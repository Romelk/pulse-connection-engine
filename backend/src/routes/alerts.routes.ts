import { Router, Request } from 'express';
import sql from '../database/db';
import { generateRecommendation } from '../services/ai.service';
import { linkPoliciesToRecommendation } from '../services/policy-linker.service';
import type { Alert, AIRecommendation, Machine } from '../types';

function getCompanyId(req: Request): number {
  const id = parseInt(req.headers['x-company-id'] as string);
  return isNaN(id) ? 1 : id;
}

const router = Router();

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { status, severity } = req.query;
    const cid = getCompanyId(req);

    const alerts = await sql<Alert[]>`
      SELECT * FROM alerts WHERE plant_id = ${cid}
      ${status ? sql`AND status = ${status as string}` : sql``}
      ${severity ? sql`AND severity = ${severity as string}` : sql``}
      ORDER BY created_at DESC
    `;
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET /api/alerts/active
router.get('/active', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const alerts = await sql<Alert[]>`
      SELECT * FROM alerts
      WHERE plant_id = ${cid} AND status = 'active'
      ORDER BY
        CASE severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'WARNING' THEN 2
          WHEN 'INFO' THEN 3
          WHEN 'SYSTEM' THEN 4
        END,
        created_at DESC
    `;
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res) => {
  try {
    const [alert] = await sql<Alert[]>`SELECT * FROM alerts WHERE id = ${req.params.id}`;

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    let machine: Machine | null = null;
    if (alert.machine_id) {
      const [m] = await sql<Machine[]>`SELECT * FROM machines WHERE id = ${alert.machine_id}`;
      machine = m || null;
    }

    let previousIncidents: Alert[] = [];
    if (alert.machine_id) {
      previousIncidents = await sql<Alert[]>`
        SELECT * FROM alerts
        WHERE machine_id = ${alert.machine_id} AND id != ${alert.id} AND status = 'resolved'
        ORDER BY created_at DESC LIMIT 3
      `;
    }

    const teamMembers = await sql<{ id: number; name: string; role: string }[]>`
      SELECT id, name, role FROM team_members ORDER BY display_order ASC, id ASC
    `;
    const member = teamMembers.length > 0 ? teamMembers[alert.id % teamMembers.length] : null;
    const assignedPersonnel = member
      ? {
          name: member.name,
          role: member.role,
          initials: member.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
        }
      : { name: 'Rajesh Kumar', role: 'Sr. Maintenance Engineer', initials: 'RK' };

    res.json({
      ...alert,
      machine,
      previousIncidents,
      spareParts: {
        available: true,
        items: '2 Main Spindle Bearing sets (SKF-7204) are currently in stock at the local warehouse.'
      },
      assignedPersonnel,
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// POST /api/alerts/:id/acknowledge
router.post('/:id/acknowledge', async (req, res) => {
  try {
    await sql`
      UPDATE alerts SET status = 'acknowledged', acknowledged_at = ${new Date().toISOString()}
      WHERE id = ${req.params.id}
    `;
    const [alert] = await sql<Alert[]>`SELECT * FROM alerts WHERE id = ${req.params.id}`;
    res.json(alert);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// POST /api/alerts/:id/resolve
router.post('/:id/resolve', async (req, res) => {
  try {
    await sql`
      UPDATE alerts SET status = 'resolved', resolved_at = ${new Date().toISOString()}
      WHERE id = ${req.params.id}
    `;
    const [alert] = await sql<Alert[]>`SELECT * FROM alerts WHERE id = ${req.params.id}`;
    res.json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// POST /api/alerts/:id/dismiss
router.post('/:id/dismiss', async (req, res) => {
  try {
    await sql`UPDATE alerts SET status = 'dismissed' WHERE id = ${req.params.id}`;
    const [alert] = await sql<Alert[]>`SELECT * FROM alerts WHERE id = ${req.params.id}`;
    res.json(alert);
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

// GET /api/alerts/:id/recommendation
router.get('/:id/recommendation', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);

    let [recommendation] = await sql<AIRecommendation[]>`
      SELECT * FROM ai_recommendations WHERE alert_id = ${alertId}
    `;

    if (!recommendation) {
      const [alert] = await sql<Alert[]>`SELECT * FROM alerts WHERE id = ${alertId}`;
      if (!alert) return res.status(404).json({ error: 'Alert not found' });

      let machine: Machine | null = null;
      if (alert.machine_id) {
        const [m] = await sql<Machine[]>`SELECT * FROM machines WHERE id = ${alert.machine_id}`;
        machine = m || null;
      }

      console.log(`Generating AI recommendation for alert ${alertId}...`);
      const aiResponse = await generateRecommendation(alert, machine);

      [recommendation] = await sql<AIRecommendation[]>`
        INSERT INTO ai_recommendations
          (alert_id, priority, category, title, explanation, uptime_gain, cost_avoidance, why_reasons, confidence_score)
        VALUES (
          ${alertId}, ${aiResponse.priority}, ${aiResponse.category}, ${aiResponse.title},
          ${aiResponse.explanation}, ${aiResponse.uptime_gain}, ${aiResponse.cost_avoidance},
          ${JSON.stringify(aiResponse.why_reasons)}, ${aiResponse.confidence_score}
        ) RETURNING *
      `;
      console.log(`AI recommendation generated and stored for alert ${alertId}`);
    }

    const [alert] = await sql<Alert[]>`SELECT * FROM alerts WHERE id = ${alertId}`;
    let machine: Machine | null = null;
    if (alert?.machine_id) {
      const [m] = await sql<Machine[]>`SELECT * FROM machines WHERE id = ${alert.machine_id}`;
      machine = m || null;
    }

    let linkedPolicies = null;
    try {
      linkedPolicies = await linkPoliciesToRecommendation(recommendation.id, {
        alertId,
        alertTitle: alert.title,
        alertDescription: alert.description,
        machineType: machine?.type || null,
        machineDepartment: machine?.department || null,
        recommendation: {
          title: recommendation.title,
          explanation: recommendation.explanation,
          category: recommendation.category,
          costAvoidance: recommendation.cost_avoidance
        }
      });
      console.log(`Policy Hunter linked ${linkedPolicies.schemes.length} schemes to recommendation ${recommendation.id}`);
    } catch (policyError) {
      console.error('Policy linking failed (non-blocking):', policyError);
    }

    res.json({
      ...recommendation,
      why_reasons: JSON.parse(recommendation.why_reasons || '[]'),
      linked_policies: linkedPolicies
    });
  } catch (error) {
    console.error('Error fetching/generating recommendation:', error);
    res.status(500).json({ error: 'Failed to fetch recommendation' });
  }
});

export default router;
