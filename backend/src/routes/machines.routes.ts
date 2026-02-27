import { Router, Request } from 'express';
import sql from '../database/db';
import type { Machine, MachineStatusOverview } from '../types';

const router = Router();

function getCompanyId(req: Request): number {
  const id = parseInt(req.headers['x-company-id'] as string);
  return isNaN(id) ? 1 : id;
}

// GET /api/machines
router.get('/', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const machines = await sql<Machine[]>`SELECT * FROM machines WHERE plant_id = ${cid}`;

    const activeAlerts = await sql<{ id: number; machine_id: number | null }[]>`
      SELECT id, machine_id FROM alerts WHERE plant_id = ${cid} AND status = 'active'
    `;

    const machineAlertMap = new Map<number, number>();
    activeAlerts.forEach(alert => {
      if (alert.machine_id) machineAlertMap.set(alert.machine_id, alert.id);
    });

    const machinesWithAlerts = machines.map(machine => ({
      ...machine,
      alert_id: machineAlertMap.get(machine.id) || null,
    }));

    const statusCounts = {
      active:      machines.filter(m => m.status === 'ACTIVE').length,
      idle:        machines.filter(m => m.status === 'IDLE').length,
      down:        machines.filter(m => m.status === 'DOWN').length,
      warning:     machines.filter(m => m.status === 'WARNING').length,
      maintenance: machines.filter(m => m.status === 'MAINTENANCE').length,
    };

    const response: MachineStatusOverview = { ...statusCounts, machines: machinesWithAlerts };
    res.json(response);
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

// GET /api/machines/:id
router.get('/:id', async (req, res) => {
  try {
    const [machine] = await sql<Machine[]>`SELECT * FROM machines WHERE id = ${req.params.id}`;
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    res.json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    res.status(500).json({ error: 'Failed to fetch machine' });
  }
});

// PUT /api/machines/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const [machine] = await sql<Machine[]>`
      UPDATE machines SET status = ${status} WHERE id = ${req.params.id} RETURNING *
    `;
    res.json(machine);
  } catch (error) {
    console.error('Error updating machine status:', error);
    res.status(500).json({ error: 'Failed to update machine status' });
  }
});

// POST /api/machines/register
router.post('/register', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const { name, type, department, icon_type, purchase_cost, hourly_downtime_cost, planned_hours_per_day, sensor_configs, notes } = req.body;

    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });

    const machineId = `${type.toUpperCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString();
    const sensorConfigsJson = JSON.stringify(sensor_configs || []);
    const hasEconomics = purchase_cost || hourly_downtime_cost || planned_hours_per_day ? 1 : 0;

    const [machine] = await sql`
      INSERT INTO machines
        (machine_id, name, type, plant_id, department, status, load_percentage, efficiency,
         icon_type, notes, purchase_cost, hourly_downtime_cost, planned_hours_per_day,
         sensor_configs, economics_configured, created_at)
      VALUES (${machineId}, ${name}, ${type}, ${cid}, ${department || null}, 'IDLE', 0, 100,
        ${icon_type || 'cog'}, ${notes || null},
        ${purchase_cost || 0}, ${hourly_downtime_cost || 0}, ${planned_hours_per_day || 8},
        ${sensorConfigsJson}, ${hasEconomics}, ${now})
      RETURNING *
    `;
    res.status(201).json(machine);
  } catch (error) {
    console.error('Error registering machine:', error);
    res.status(500).json({ error: 'Failed to register machine' });
  }
});

// PATCH /api/machines/:id/config
router.patch('/:id/config', async (req, res) => {
  try {
    const { purchase_cost, hourly_downtime_cost, planned_hours_per_day, sensor_configs, notes, department } = req.body;

    const updates: Record<string, any> = { economics_configured: 1 };
    if (purchase_cost !== undefined)         updates.purchase_cost = purchase_cost;
    if (hourly_downtime_cost !== undefined)  updates.hourly_downtime_cost = hourly_downtime_cost;
    if (planned_hours_per_day !== undefined) updates.planned_hours_per_day = planned_hours_per_day;
    if (sensor_configs !== undefined)        updates.sensor_configs = JSON.stringify(sensor_configs);
    if (notes !== undefined)                 updates.notes = notes;
    if (department !== undefined)            updates.department = department;

    if (Object.keys(updates).length <= 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const [machine] = await sql`
      UPDATE machines SET ${sql(updates)} WHERE id = ${req.params.id} RETURNING *
    `;
    res.json(machine);
  } catch (error) {
    console.error('Error updating machine config:', error);
    res.status(500).json({ error: 'Failed to update machine config' });
  }
});

export default router;
