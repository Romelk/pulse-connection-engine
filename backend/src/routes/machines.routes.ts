import { Router } from 'express';
import db from '../database/db';
import type { Machine, MachineStatusOverview, Alert } from '../types';

const router = Router();

// GET /api/machines
router.get('/', (req, res) => {
  try {
    const machines = db.prepare('SELECT * FROM machines WHERE plant_id = 1').all() as Machine[];

    // Get active alerts to associate with machines
    const activeAlerts = db.prepare(`
      SELECT id, machine_id FROM alerts
      WHERE plant_id = 1 AND status = 'active'
    `).all() as { id: number; machine_id: number | null }[];

    // Create a map of machine_id to alert_id
    const machineAlertMap = new Map<number, number>();
    activeAlerts.forEach(alert => {
      if (alert.machine_id) {
        machineAlertMap.set(alert.machine_id, alert.id);
      }
    });

    // Add alert_id to machines that have active alerts
    const machinesWithAlerts = machines.map(machine => ({
      ...machine,
      alert_id: machineAlertMap.get(machine.id) || null,
    }));

    const statusCounts = {
      active: machines.filter(m => m.status === 'ACTIVE').length,
      idle: machines.filter(m => m.status === 'IDLE').length,
      down: machines.filter(m => m.status === 'DOWN').length,
      warning: machines.filter(m => m.status === 'WARNING').length,
      maintenance: machines.filter(m => m.status === 'MAINTENANCE').length,
    };

    const response: MachineStatusOverview = {
      ...statusCounts,
      machines: machinesWithAlerts,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

// GET /api/machines/:id
router.get('/:id', (req, res) => {
  try {
    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id) as Machine | undefined;

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    res.status(500).json({ error: 'Failed to fetch machine' });
  }
});

// PUT /api/machines/:id/status
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;

    db.prepare('UPDATE machines SET status = ? WHERE id = ?').run(status, req.params.id);

    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id) as Machine;
    res.json(machine);
  } catch (error) {
    console.error('Error updating machine status:', error);
    res.status(500).json({ error: 'Failed to update machine status' });
  }
});

export default router;
