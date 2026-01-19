import { Router } from 'express';
import db from '../database/db';
import { updatePlantHealth } from '../services/health.service';

const router = Router();

// Alert thresholds for different parameters
const THRESHOLDS = {
  temperature: {
    normal: { min: 20, max: 40 },
    warning: { min: 40, max: 60 },
    critical: { min: 60, max: 100 }
  },
  vibration: {
    normal: { min: 0, max: 3 },
    warning: { min: 3, max: 6 },
    critical: { min: 6, max: 15 }
  },
  load: {
    normal: { min: 0, max: 80 },
    warning: { min: 80, max: 95 },
    critical: { min: 95, max: 100 }
  }
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
// Get all machines for the simulator
router.get('/machines', (req, res) => {
  try {
    const machines = db.prepare(`
      SELECT id, machine_id, name, type, department, status, temperature, vibration_level, load_percentage
      FROM machines WHERE plant_id = 1
    `).all();
    res.json({ machines, thresholds: THRESHOLDS });
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

// POST /api/simulator/update-machine
// Update machine parameters and trigger alerts if thresholds exceeded
router.post('/update-machine', (req, res) => {
  try {
    const { machineId, temperature, vibration, load } = req.body;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    // Get current machine data
    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId) as Machine;

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    // Update machine parameters
    db.prepare(`
      UPDATE machines
      SET temperature = ?, vibration_level = ?, load_percentage = ?
      WHERE id = ?
    `).run(
      temperature ?? null,
      vibration ?? null,
      load ?? 50,
      machineId
    );

    // Check thresholds and generate alerts
    const generatedAlerts: any[] = [];

    // Check temperature
    if (temperature !== undefined && temperature !== null) {
      if (temperature >= THRESHOLDS.temperature.critical.min) {
        generatedAlerts.push(createAlert(machine, 'CRITICAL', 'temperature', temperature));
      } else if (temperature >= THRESHOLDS.temperature.warning.min) {
        generatedAlerts.push(createAlert(machine, 'WARNING', 'temperature', temperature));
      }
    }

    // Check vibration
    if (vibration !== undefined && vibration !== null) {
      if (vibration >= THRESHOLDS.vibration.critical.min) {
        generatedAlerts.push(createAlert(machine, 'CRITICAL', 'vibration', vibration));
      } else if (vibration >= THRESHOLDS.vibration.warning.min) {
        generatedAlerts.push(createAlert(machine, 'WARNING', 'vibration', vibration));
      }
    }

    // Check load
    if (load !== undefined && load !== null) {
      if (load >= THRESHOLDS.load.critical.min) {
        generatedAlerts.push(createAlert(machine, 'CRITICAL', 'load', load));
      } else if (load >= THRESHOLDS.load.warning.min) {
        generatedAlerts.push(createAlert(machine, 'WARNING', 'load', load));
      }
    }

    // Determine new machine status based on alerts
    let newStatus = 'ACTIVE';
    if (generatedAlerts.some(a => a.severity === 'CRITICAL')) {
      newStatus = 'DOWN';
    } else if (generatedAlerts.some(a => a.severity === 'WARNING')) {
      newStatus = 'WARNING';
    }

    // Update machine status
    db.prepare('UPDATE machines SET status = ? WHERE id = ?').run(newStatus, machineId);

    // Get updated machine
    const updatedMachine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId);

    // Recalculate plant health after machine status change
    const { health: plantHealth, status: plantStatus } = updatePlantHealth(1);

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
// Reset machine to normal state
router.post('/reset-machine', (req, res) => {
  try {
    const { machineId } = req.body;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    // Reset machine parameters
    db.prepare(`
      UPDATE machines
      SET temperature = NULL, vibration_level = NULL, load_percentage = 50, status = 'ACTIVE'
      WHERE id = ?
    `).run(machineId);

    // Resolve any active alerts for this machine
    const resolvedCount = db.prepare(`
      UPDATE alerts
      SET status = 'resolved', resolved_at = ?
      WHERE machine_id = ? AND status = 'active'
    `).run(new Date().toISOString(), machineId);

    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId);

    // Recalculate plant health after machine reset
    const { health: plantHealth, status: plantStatus } = updatePlantHealth(1);

    res.json({
      success: true,
      machine,
      alertsResolved: resolvedCount.changes,
      plantHealth,
      plantStatus
    });
  } catch (error) {
    console.error('Error resetting machine:', error);
    res.status(500).json({ error: 'Failed to reset machine' });
  }
});

// POST /api/simulator/reset-all
// Reset all machines and clear simulator-generated alerts
router.post('/reset-all', (req, res) => {
  try {
    // Reset all machines
    db.prepare(`
      UPDATE machines
      SET temperature = NULL, vibration_level = NULL, load_percentage = 50, status = 'ACTIVE'
      WHERE plant_id = 1
    `).run();

    // Resolve all simulator-generated alerts
    db.prepare(`
      UPDATE alerts
      SET status = 'resolved', resolved_at = ?
      WHERE sensor_id LIKE 'SIM-%' AND status = 'active'
    `).run(new Date().toISOString());

    // Recalculate plant health after reset all
    const { health: plantHealth, status: plantStatus } = updatePlantHealth(1);

    res.json({
      success: true,
      message: 'All machines reset to normal state',
      plantHealth,
      plantStatus
    });
  } catch (error) {
    console.error('Error resetting all machines:', error);
    res.status(500).json({ error: 'Failed to reset machines' });
  }
});

// Helper function to create alerts
function createAlert(machine: Machine, severity: string, type: string, value: number): any {
  const alertId = `#AL-SIM-${Date.now().toString().slice(-6)}`;

  const alertConfig: Record<string, { title: string; description: string; impact: number; sensorPrefix: string }> = {
    temperature: {
      title: `High Temperature Alert - ${machine.name}`,
      description: `Temperature reading of ${value.toFixed(1)}°C exceeds safe operating limits. ${severity === 'CRITICAL' ? 'Immediate cooling or shutdown required to prevent equipment damage.' : 'Monitor closely and consider reducing load.'}`,
      impact: severity === 'CRITICAL' ? -20 : -10,
      sensorPrefix: 'TEMP'
    },
    vibration: {
      title: `Abnormal Vibration Detected - ${machine.name}`,
      description: `Vibration level of ${value.toFixed(1)} mm/s detected on ${machine.type}. ${severity === 'CRITICAL' ? 'Indicates potential bearing failure or severe misalignment. Stop operation immediately.' : 'Possible early signs of bearing wear or alignment issues.'}`,
      impact: severity === 'CRITICAL' ? -25 : -12,
      sensorPrefix: 'VIB'
    },
    load: {
      title: `Overload Warning - ${machine.name}`,
      description: `Load at ${value.toFixed(0)}% - machine operating ${severity === 'CRITICAL' ? 'at maximum capacity. Risk of thermal overload and motor damage.' : 'above recommended capacity. May cause premature wear.'}`,
      impact: severity === 'CRITICAL' ? -15 : -8,
      sensorPrefix: 'LOAD'
    }
  };

  const config = alertConfig[type];
  const sensorId = `SIM-${config.sensorPrefix}-${machine.id}`;
  const now = new Date().toISOString();

  // Check if similar alert already exists
  const existingAlert = db.prepare(`
    SELECT id FROM alerts
    WHERE machine_id = ? AND sensor_id = ? AND status = 'active'
  `).get(machine.id, sensorId);

  if (existingAlert) {
    // Update existing alert instead of creating new one
    db.prepare(`
      UPDATE alerts
      SET severity = ?, description = ?, production_impact = ?
      WHERE id = ?
    `).run(severity, config.description, config.impact, (existingAlert as any).id);

    return db.prepare('SELECT * FROM alerts WHERE id = ?').get((existingAlert as any).id);
  }

  // Create new alert
  db.prepare(`
    INSERT INTO alerts (alert_id, plant_id, machine_id, severity, title, description, status, production_impact, ai_confidence, sensor_id, created_at)
    VALUES (?, 1, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
  `).run(
    alertId,
    machine.id,
    severity,
    config.title,
    config.description,
    config.impact,
    Math.floor(Math.random() * 10) + 85, // 85-94% confidence
    sensorId,
    now
  );

  return db.prepare('SELECT * FROM alerts WHERE alert_id = ?').get(alertId);
}

export default router;
