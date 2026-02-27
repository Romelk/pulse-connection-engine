import { Router } from 'express';
import { ingestTelemetry, getLatestReadings, getReadingHistory } from '../services/telemetry.service';
import { updatePlantHealth } from '../services/health.service';

const router = Router();

// POST /api/telemetry/ingest
router.post('/ingest', async (req, res) => {
  try {
    const { machine_id, readings } = req.body;

    if (!machine_id || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: 'machine_id and readings[] are required' });
    }

    const result = await ingestTelemetry(machine_id, readings);
    const { health: plantHealth, status: plantStatus } = await updatePlantHealth(1);

    res.json({
      success: true,
      machine_id,
      readingsStored: result.stored,
      anomaliesDetected: result.anomalies.length,
      alertsCreated: result.alertsCreated,
      downtimeTriggered: result.downtimeTriggered,
      anomalies: result.anomalies,
      plantHealth,
      plantStatus,
    });
  } catch (error: any) {
    console.error('Telemetry ingest error:', error);
    res.status(500).json({ error: error.message || 'Failed to ingest telemetry' });
  }
});

// GET /api/telemetry/:machineId/latest
router.get('/:machineId/latest', async (req, res) => {
  try {
    const machineId = parseInt(req.params.machineId);
    const readings = await getLatestReadings(machineId);
    res.json({ machine_id: machineId, readings });
  } catch (error) {
    console.error('Error fetching latest readings:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

// GET /api/telemetry/:machineId/history?sensor=temperature&hours=24
router.get('/:machineId/history', async (req, res) => {
  try {
    const machineId = parseInt(req.params.machineId);
    const sensorType = req.query.sensor as string || 'temperature';
    const hours = parseInt(req.query.hours as string) || 24;

    const readings = await getReadingHistory(machineId, sensorType, hours);
    res.json({ machine_id: machineId, sensor_type: sensorType, hours, readings });
  } catch (error) {
    console.error('Error fetching reading history:', error);
    res.status(500).json({ error: 'Failed to fetch reading history' });
  }
});

export default router;
