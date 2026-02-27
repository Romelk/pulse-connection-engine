import { Router } from 'express';
import sql from '../database/db';
import { calculateDowntimeLoss, checkThresholdAndSuggestSchemes } from '../services/cost-threshold.service';
import { updatePlantHealth } from '../services/health.service';

const router = Router();

function getCompanyId(req: any): number {
  const id = parseInt(req.headers['x-company-id'] as string);
  return isNaN(id) ? 1 : id;
}

interface DowntimeEventRow {
  id: number;
  machine_id: number;
  triggered_by_alert_id: number | null;
  start_time: string;
  end_time: string | null;
  duration_hours: number | null;
  repair_cost: number | null;
  repair_description: string | null;
  cause: string | null;
  status: string;
  total_loss: number | null;
  scheme_triggered: number;
  created_at: string;
}

// GET /api/downtime/active
router.get('/active', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const events = await sql`
      SELECT d.*, m.name as machine_name, m.type as machine_type,
             m.department, m.hourly_downtime_cost, m.purchase_cost
      FROM downtime_events d
      JOIN machines m ON d.machine_id = m.id
      WHERE d.status = 'ongoing' AND m.plant_id = ${cid}
      ORDER BY d.start_time DESC
    `;
    res.json(events);
  } catch (error) {
    console.error('Error fetching active downtime:', error);
    res.status(500).json({ error: 'Failed to fetch active downtime events' });
  }
});

// GET /api/downtime/history
router.get('/history', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const events = await sql`
      SELECT d.*, m.name as machine_name, m.type as machine_type,
             m.department, m.hourly_downtime_cost
      FROM downtime_events d
      JOIN machines m ON d.machine_id = m.id
      WHERE d.status = 'resolved' AND m.plant_id = ${cid}
      ORDER BY d.end_time DESC
      LIMIT 50
    `;
    res.json(events);
  } catch (error) {
    console.error('Error fetching downtime history:', error);
    res.status(500).json({ error: 'Failed to fetch downtime history' });
  }
});

// GET /api/downtime/:id
router.get('/:id', async (req, res) => {
  try {
    const [event] = await sql<(DowntimeEventRow & { machine_name: string; hourly_downtime_cost: number })[]>`
      SELECT d.*, m.name as machine_name, m.type as machine_type,
             m.department, m.hourly_downtime_cost, m.purchase_cost, m.sensor_configs
      FROM downtime_events d
      JOIN machines m ON d.machine_id = m.id
      WHERE d.id = ${req.params.id}
    `;

    if (!event) return res.status(404).json({ error: 'Downtime event not found' });

    const costAnalysis = await calculateDowntimeLoss(event.id);
    res.json({ ...event, costAnalysis });
  } catch (error) {
    console.error('Error fetching downtime event:', error);
    res.status(500).json({ error: 'Failed to fetch downtime event' });
  }
});

// POST /api/downtime
router.post('/', async (req, res) => {
  try {
    const { machine_id, cause, triggered_by_alert_id } = req.body;
    if (!machine_id) return res.status(400).json({ error: 'machine_id is required' });

    const now = new Date().toISOString();

    const [event] = await sql`
      INSERT INTO downtime_events (machine_id, triggered_by_alert_id, start_time, cause, status, created_at)
      VALUES (${machine_id}, ${triggered_by_alert_id || null}, ${now}, ${cause || null}, 'ongoing', ${now})
      RETURNING *
    `;

    await sql`UPDATE machines SET status = 'DOWN' WHERE id = ${machine_id}`;
    await updatePlantHealth(getCompanyId(req));

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating downtime event:', error);
    res.status(500).json({ error: 'Failed to create downtime event' });
  }
});

// PATCH /api/downtime/:id/repair
router.patch('/:id/repair', async (req, res) => {
  try {
    const { repair_cost, repair_description, cause } = req.body;
    if (repair_cost === undefined) return res.status(400).json({ error: 'repair_cost is required' });

    const now = new Date().toISOString();

    const [event] = await sql<DowntimeEventRow[]>`SELECT * FROM downtime_events WHERE id = ${req.params.id}`;
    if (!event) return res.status(404).json({ error: 'Downtime event not found' });

    const durationMs = new Date(now).getTime() - new Date(event.start_time).getTime();
    const durationHours = Math.round((durationMs / 3600000) * 100) / 100;

    await sql`
      UPDATE downtime_events
      SET repair_cost = ${repair_cost},
          repair_description = ${repair_description || null},
          cause = COALESCE(${cause || null}, cause),
          end_time = ${now},
          duration_hours = ${durationHours},
          status = 'resolved'
      WHERE id = ${req.params.id}
    `;

    const [machine] = await sql<{ plant_id: number }[]>`SELECT plant_id FROM machines WHERE id = ${event.machine_id}`;
    await sql`UPDATE machines SET status = 'ACTIVE' WHERE id = ${event.machine_id}`;
    await updatePlantHealth(machine?.plant_id || getCompanyId(req));

    const schemeResult = await checkThresholdAndSuggestSchemes(parseInt(req.params.id));
    const costAnalysis = await calculateDowntimeLoss(parseInt(req.params.id));

    res.json({
      success: true,
      costAnalysis,
      schemeTriggered: !!schemeResult,
      schemeResult: schemeResult || null,
    });
  } catch (error) {
    console.error('Error submitting repair cost:', error);
    res.status(500).json({ error: 'Failed to submit repair cost' });
  }
});

export default router;
