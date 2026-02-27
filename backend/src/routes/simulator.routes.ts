import { Router, Request } from 'express';
import sql from '../database/db';
import { updatePlantHealth } from '../services/health.service';

const router = Router();

function getCompanyId(req: Request): number {
  const id = parseInt(req.headers['x-company-id'] as string);
  return isNaN(id) ? 1 : id;
}

const THRESHOLDS = {
  temperature: { normal: { min: 20, max: 40 }, warning: { min: 40, max: 60 }, critical: { min: 60, max: 100 } },
  vibration:   { normal: { min: 0, max: 3 },   warning: { min: 3, max: 6 },   critical: { min: 6, max: 15 } },
  load:        { normal: { min: 0, max: 80 },   warning: { min: 80, max: 95 }, critical: { min: 95, max: 100 } }
};

interface Machine {
  id: number;
  machine_id: string;
  name: string;
  type: string;
  department: string;
  status: string;
}

// GET /api/simulator/machines
router.get('/machines', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const machines = await sql`
      SELECT id, machine_id, name, type, department, status, temperature, vibration_level, load_percentage
      FROM machines WHERE plant_id = ${cid}
    `;
    res.json({ machines, thresholds: THRESHOLDS });
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

// POST /api/simulator/update-machine
router.post('/update-machine', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const { machineId, temperature, vibration, load } = req.body;

    if (!machineId) return res.status(400).json({ error: 'machineId is required' });

    const [machine] = await sql<Machine[]>`SELECT * FROM machines WHERE id = ${machineId}`;
    if (!machine) return res.status(404).json({ error: 'Machine not found' });

    await sql`
      UPDATE machines SET temperature = ${temperature ?? null}, vibration_level = ${vibration ?? null}, load_percentage = ${load ?? 50}
      WHERE id = ${machineId}
    `;

    const generatedAlerts: any[] = [];

    if (temperature !== undefined && temperature !== null) {
      if (temperature >= THRESHOLDS.temperature.critical.min) {
        generatedAlerts.push(await createAlert(machine, 'CRITICAL', 'temperature', temperature, cid));
      } else if (temperature >= THRESHOLDS.temperature.warning.min) {
        generatedAlerts.push(await createAlert(machine, 'WARNING', 'temperature', temperature, cid));
      }
    }

    if (vibration !== undefined && vibration !== null) {
      if (vibration >= THRESHOLDS.vibration.critical.min) {
        generatedAlerts.push(await createAlert(machine, 'CRITICAL', 'vibration', vibration, cid));
      } else if (vibration >= THRESHOLDS.vibration.warning.min) {
        generatedAlerts.push(await createAlert(machine, 'WARNING', 'vibration', vibration, cid));
      }
    }

    if (load !== undefined && load !== null) {
      if (load >= THRESHOLDS.load.critical.min) {
        generatedAlerts.push(await createAlert(machine, 'CRITICAL', 'load', load, cid));
      } else if (load >= THRESHOLDS.load.warning.min) {
        generatedAlerts.push(await createAlert(machine, 'WARNING', 'load', load, cid));
      }
    }

    let newStatus = 'ACTIVE';
    if (generatedAlerts.some(a => a.severity === 'CRITICAL')) newStatus = 'DOWN';
    else if (generatedAlerts.some(a => a.severity === 'WARNING')) newStatus = 'WARNING';

    await sql`UPDATE machines SET status = ${newStatus} WHERE id = ${machineId}`;
    const [updatedMachine] = await sql`SELECT * FROM machines WHERE id = ${machineId}`;
    const { health: plantHealth, status: plantStatus } = await updatePlantHealth(cid);

    res.json({
      success: true,
      machine: updatedMachine,
      alerts: generatedAlerts,
      statusChanged: machine.status !== newStatus,
      previousStatus: machine.status,
      newStatus,
      thresholds: THRESHOLDS,
      plantHealth,
      plantStatus
    });
  } catch (error) {
    console.error('Error updating machine:', error);
    res.status(500).json({ error: 'Failed to update machine' });
  }
});

// POST /api/simulator/reset-machine
router.post('/reset-machine', async (req, res) => {
  try {
    const { machineId } = req.body;
    if (!machineId) return res.status(400).json({ error: 'machineId is required' });

    await sql`
      UPDATE machines SET temperature = NULL, vibration_level = NULL, load_percentage = 50, status = 'ACTIVE'
      WHERE id = ${machineId}
    `;
    const resolvedResult = await sql`
      UPDATE alerts SET status = 'resolved', resolved_at = ${new Date().toISOString()}
      WHERE machine_id = ${machineId} AND status = 'active'
    `;

    const [machine] = await sql`SELECT * FROM machines WHERE id = ${machineId}`;
    const cid = getCompanyId(req);
    const { health: plantHealth, status: plantStatus } = await updatePlantHealth(cid);

    res.json({ success: true, machine, alertsResolved: resolvedResult.count, plantHealth, plantStatus });
  } catch (error) {
    console.error('Error resetting machine:', error);
    res.status(500).json({ error: 'Failed to reset machine' });
  }
});

// POST /api/simulator/reset-all
router.post('/reset-all', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    await sql`
      UPDATE machines SET temperature = NULL, vibration_level = NULL, load_percentage = 50, status = 'ACTIVE'
      WHERE plant_id = ${cid}
    `;
    await sql`
      UPDATE alerts SET status = 'resolved', resolved_at = ${new Date().toISOString()}
      WHERE sensor_id LIKE 'SIM-%' AND status = 'active'
    `;
    const { health: plantHealth, status: plantStatus } = await updatePlantHealth(cid);
    res.json({ success: true, message: 'All machines reset to normal state', plantHealth, plantStatus });
  } catch (error) {
    console.error('Error resetting all machines:', error);
    res.status(500).json({ error: 'Failed to reset machines' });
  }
});

function calculateProductionImpact(type: string, value: number): number {
  const ranges: Record<string, { warningMin: number; max: number; base: number }> = {
    temperature: { warningMin: 40, max: 100, base: -8 },
    vibration:   { warningMin: 3,  max: 15,  base: -10 },
    load:        { warningMin: 80, max: 100, base: -6 },
  };
  const r = ranges[type];
  if (!r) return -10;
  const exceedance = Math.min(1, Math.max(0, (value - r.warningMin) / (r.max - r.warningMin)));
  return Math.round(r.base * (1 + exceedance));
}

function calculateAiConfidence(type: string, value: number): number {
  const ranges: Record<string, { warningMin: number; max: number }> = {
    temperature: { warningMin: 40, max: 100 },
    vibration:   { warningMin: 3,  max: 15 },
    load:        { warningMin: 80, max: 100 },
  };
  const r = ranges[type];
  if (!r) return 85;
  const exceedance = Math.min(1, Math.max(0, (value - r.warningMin) / (r.max - r.warningMin)));
  return Math.round(70 + exceedance * 29);
}

async function createAlert(machine: Machine, severity: string, type: string, value: number, companyId = 1): Promise<any> {
  const alertId = `#AL-SIM-${Date.now().toString().slice(-6)}`;

  const alertConfig: Record<string, { title: string; description: string; impact: number; sensorPrefix: string }> = {
    temperature: {
      title: `High Temperature Alert - ${machine.name}`,
      description: `Temperature reading of ${value.toFixed(1)}°C exceeds safe operating limits. ${severity === 'CRITICAL' ? 'Immediate cooling or shutdown required to prevent equipment damage.' : 'Monitor closely and consider reducing load.'}`,
      impact: calculateProductionImpact('temperature', value),
      sensorPrefix: 'TEMP'
    },
    vibration: {
      title: `Abnormal Vibration Detected - ${machine.name}`,
      description: `Vibration level of ${value.toFixed(1)} mm/s detected on ${machine.type}. ${severity === 'CRITICAL' ? 'Indicates potential bearing failure or severe misalignment. Stop operation immediately.' : 'Possible early signs of bearing wear or alignment issues.'}`,
      impact: calculateProductionImpact('vibration', value),
      sensorPrefix: 'VIB'
    },
    load: {
      title: `Overload Warning - ${machine.name}`,
      description: `Load at ${value.toFixed(0)}% - machine operating ${severity === 'CRITICAL' ? 'at maximum capacity. Risk of thermal overload and motor damage.' : 'above recommended capacity. May cause premature wear.'}`,
      impact: calculateProductionImpact('load', value),
      sensorPrefix: 'LOAD'
    }
  };

  const config = alertConfig[type];
  const sensorId = `SIM-${config.sensorPrefix}-${machine.id}`;
  const now = new Date().toISOString();

  const [existingAlert] = await sql<{ id: number }[]>`
    SELECT id FROM alerts WHERE machine_id = ${machine.id} AND sensor_id = ${sensorId} AND status = 'active'
  `;

  if (existingAlert) {
    await sql`
      UPDATE alerts SET severity = ${severity}, description = ${config.description},
        production_impact = ${config.impact}, ai_confidence = ${calculateAiConfidence(type, value)}
      WHERE id = ${existingAlert.id}
    `;
    const [alert] = await sql`SELECT * FROM alerts WHERE id = ${existingAlert.id}`;
    return alert;
  }

  await sql`
    INSERT INTO alerts (alert_id, plant_id, machine_id, severity, title, description, status, production_impact, ai_confidence, sensor_id, created_at)
    VALUES (${alertId}, ${companyId}, ${machine.id}, ${severity}, ${config.title}, ${config.description}, 'active', ${config.impact}, ${calculateAiConfidence(type, value)}, ${sensorId}, ${now})
  `;
  const [alert] = await sql`SELECT * FROM alerts WHERE alert_id = ${alertId}`;
  return alert;
}

export default router;
