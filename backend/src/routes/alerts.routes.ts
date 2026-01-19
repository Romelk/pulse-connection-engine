import { Router } from 'express';
import db from '../database/db';
import { generateRecommendation } from '../services/ai.service';
import { linkPoliciesToRecommendation } from '../services/policy-linker.service';
import type { Alert, AIRecommendation, Machine } from '../types';

const router = Router();

// GET /api/alerts
router.get('/', (req, res) => {
  try {
    const { status, severity } = req.query;

    let query = 'SELECT * FROM alerts WHERE plant_id = 1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY created_at DESC';

    const alerts = db.prepare(query).all(...params) as Alert[];
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET /api/alerts/active
router.get('/active', (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT * FROM alerts
      WHERE plant_id = 1 AND status = 'active'
      ORDER BY
        CASE severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'WARNING' THEN 2
          WHEN 'INFO' THEN 3
          WHEN 'SYSTEM' THEN 4
        END,
        created_at DESC
    `).all() as Alert[];
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

// GET /api/alerts/:id
router.get('/:id', (req, res) => {
  try {
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Alert | undefined;

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Get associated machine if exists
    let machine = null;
    if (alert.machine_id) {
      machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(alert.machine_id) as Machine;
    }

    // Get previous incidents for this machine
    let previousIncidents: any[] = [];
    if (alert.machine_id) {
      previousIncidents = db.prepare(`
        SELECT * FROM alerts
        WHERE machine_id = ? AND id != ? AND status = 'resolved'
        ORDER BY created_at DESC LIMIT 3
      `).all(alert.machine_id, alert.id) as Alert[];
    }

    res.json({
      ...alert,
      machine,
      previousIncidents,
      spareParts: {
        available: true,
        items: '2 Main Spindle Bearing sets (SKF-7204) are currently in stock at the local warehouse.'
      },
      assignedPersonnel: {
        name: 'Rajesh Kumar',
        role: 'Sr. Maintenance Engineer',
        initials: 'RK'
      }
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// POST /api/alerts/:id/acknowledge
router.post('/:id/acknowledge', (req, res) => {
  try {
    db.prepare(`
      UPDATE alerts
      SET status = 'acknowledged', acknowledged_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), req.params.id);

    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Alert;
    res.json(alert);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// POST /api/alerts/:id/resolve
router.post('/:id/resolve', (req, res) => {
  try {
    db.prepare(`
      UPDATE alerts
      SET status = 'resolved', resolved_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), req.params.id);

    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Alert;
    res.json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// POST /api/alerts/:id/dismiss
router.post('/:id/dismiss', (req, res) => {
  try {
    db.prepare(`
      UPDATE alerts
      SET status = 'dismissed'
      WHERE id = ?
    `).run(req.params.id);

    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Alert;
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

    // Check for existing recommendation
    let recommendation = db.prepare(`
      SELECT * FROM ai_recommendations WHERE alert_id = ?
    `).get(alertId) as AIRecommendation | undefined;

    // If no recommendation exists, generate one with AI
    if (!recommendation) {
      const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId) as Alert | undefined;

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      // Get machine data if available
      let machine = null;
      if (alert.machine_id) {
        machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(alert.machine_id) as Machine;
      }

      // Generate AI recommendation
      console.log(`Generating AI recommendation for alert ${alertId}...`);
      const aiResponse = await generateRecommendation(alert, machine);

      // Store the generated recommendation in database
      db.prepare(`
        INSERT INTO ai_recommendations (alert_id, priority, category, title, explanation, uptime_gain, cost_avoidance, why_reasons, confidence_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        alertId,
        aiResponse.priority,
        aiResponse.category,
        aiResponse.title,
        aiResponse.explanation,
        aiResponse.uptime_gain,
        aiResponse.cost_avoidance,
        JSON.stringify(aiResponse.why_reasons),
        aiResponse.confidence_score
      );

      // Fetch the newly created recommendation
      recommendation = db.prepare(`
        SELECT * FROM ai_recommendations WHERE alert_id = ?
      `).get(alertId) as AIRecommendation;

      console.log(`AI recommendation generated and stored for alert ${alertId}`);
    }

    // Get alert and machine data for policy linking context
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId) as Alert;
    let machine = null;
    if (alert?.machine_id) {
      machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(alert.machine_id) as Machine;
    }

    // Link policies to recommendation (Agent 2: Policy Hunter)
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

    // Parse JSON fields and return with linked policies
    const response = {
      ...recommendation,
      why_reasons: JSON.parse(recommendation.why_reasons || '[]'),
      linked_policies: linkedPolicies
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching/generating recommendation:', error);
    res.status(500).json({ error: 'Failed to fetch recommendation' });
  }
});

export default router;
