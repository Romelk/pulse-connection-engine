import { Router } from 'express';
import db from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import type { OperationRecord, Machine, OperationsMetrics } from '../types';

const router = Router();

// GET /api/operations/history
router.get('/history', (req, res) => {
  try {
    const { machineId, status, search } = req.query;

    let query = `
      SELECT oh.*, m.machine_id as machine_code, m.name as machine_name
      FROM operations_history oh
      LEFT JOIN machines m ON oh.machine_id = m.id
      WHERE oh.plant_id = 1
    `;
    const params: any[] = [];

    if (machineId) {
      query += ' AND oh.machine_id = ?';
      params.push(machineId);
    }

    if (status) {
      query += ' AND oh.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (m.machine_id LIKE ? OR m.name LIKE ? OR oh.action_taken_by LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY oh.timestamp DESC LIMIT 50';

    const operations = db.prepare(query).all(...params);

    // Format for timeline display
    const timeline = operations.map((op: any) => ({
      id: op.id,
      operationId: op.operation_id,
      timestamp: op.timestamp,
      machine: {
        id: op.machine_id,
        machineId: op.machine_code,
        name: op.machine_name
      },
      alertId: op.alert_id ? `#AL-${9800 + op.id}` : null,
      status: op.status,
      aiRecommendation: {
        text: op.ai_recommendation,
        severity: op.ai_recommendation_severity
      },
      actionTaken: op.action_taken ? {
        text: op.action_taken,
        user: op.action_taken_by
      } : null,
      outcome: op.outcome,
      recoveryTime: op.recovery_time_minutes
    }));

    res.json(timeline);
  } catch (error) {
    console.error('Error fetching operations history:', error);
    res.status(500).json({ error: 'Failed to fetch operations history' });
  }
});

// GET /api/operations/metrics
router.get('/metrics', (req, res) => {
  try {
    const totalActions = db.prepare(`
      SELECT COUNT(*) as count FROM operations_history WHERE plant_id = 1
    `).get() as { count: number };

    const resolved = db.prepare(`
      SELECT COUNT(*) as count FROM operations_history
      WHERE plant_id = 1 AND status IN ('resolved', 'critical_override')
    `).get() as { count: number };

    const avgRecovery = db.prepare(`
      SELECT AVG(recovery_time_minutes) as avg FROM operations_history
      WHERE plant_id = 1 AND recovery_time_minutes IS NOT NULL
    `).get() as { avg: number | null };

    const resolutionRate = totalActions.count > 0
      ? (resolved.count / totalActions.count) * 100
      : 0;

    const metrics: OperationsMetrics = {
      totalActions: {
        count: totalActions.count || 142, // Show demo value if no data
        comparison: 12,
        comparisonLabel: '+12% vs last month'
      },
      resolutionRate: {
        percentage: resolutionRate || 98.2,
        comparison: 0.5,
        comparisonLabel: '+0.5% efficiency gain'
      },
      avgRecoveryTime: {
        minutes: Math.round(avgRecovery.avg || 14),
        comparison: -4,
        comparisonLabel: '-4% downtime reduction'
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching operations metrics:', error);
    res.status(500).json({ error: 'Failed to fetch operations metrics' });
  }
});

// POST /api/operations/log-action
router.post('/log-action', (req, res) => {
  try {
    const {
      machineId,
      alertId,
      aiRecommendation,
      aiRecommendationSeverity,
      actionTaken,
      actionTakenBy,
      outcome,
      recoveryTimeMinutes
    } = req.body;

    const operationId = `OP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${uuidv4().slice(0, 8)}`;

    const result = db.prepare(`
      INSERT INTO operations_history (
        operation_id, plant_id, machine_id, alert_id, status,
        ai_recommendation, ai_recommendation_severity,
        action_taken, action_taken_by, outcome, recovery_time_minutes,
        timestamp, resolved_at
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      operationId,
      machineId,
      alertId || null,
      outcome ? 'resolved' : 'in_progress',
      aiRecommendation,
      aiRecommendationSeverity || 'info',
      actionTaken || null,
      actionTakenBy || null,
      outcome || null,
      recoveryTimeMinutes || null,
      new Date().toISOString(),
      outcome ? new Date().toISOString() : null
    );

    res.json({
      success: true,
      operationId,
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error logging action:', error);
    res.status(500).json({ error: 'Failed to log action' });
  }
});

// GET /api/operations/export
router.get('/export', (req, res) => {
  try {
    const operations = db.prepare(`
      SELECT oh.*, m.machine_id as machine_code, m.name as machine_name
      FROM operations_history oh
      LEFT JOIN machines m ON oh.machine_id = m.id
      WHERE oh.plant_id = 1
      ORDER BY oh.timestamp DESC
    `).all();

    // Create CSV content
    const headers = [
      'Operation ID',
      'Timestamp',
      'Machine ID',
      'Machine Name',
      'Status',
      'AI Recommendation',
      'Severity',
      'Action Taken',
      'Taken By',
      'Outcome',
      'Recovery Time (min)'
    ];

    const rows = operations.map((op: any) => [
      op.operation_id,
      op.timestamp,
      op.machine_code,
      op.machine_name,
      op.status,
      `"${(op.ai_recommendation || '').replace(/"/g, '""')}"`,
      op.ai_recommendation_severity,
      `"${(op.action_taken || '').replace(/"/g, '""')}"`,
      op.action_taken_by || '',
      `"${(op.outcome || '').replace(/"/g, '""')}"`,
      op.recovery_time_minutes || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=operations-history.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting operations:', error);
    res.status(500).json({ error: 'Failed to export operations' });
  }
});

export default router;
