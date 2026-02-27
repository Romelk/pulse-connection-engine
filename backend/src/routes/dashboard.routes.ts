import { Router, Request } from 'express';
import sql from '../database/db';
import { updatePlantHealth } from '../services/health.service';
import type { Plant, Shift, RiskAssessment, DashboardOverview, Machine, Alert } from '../types';

function getCompanyId(req: Request): number {
  const id = parseInt(req.headers['x-company-id'] as string);
  return isNaN(id) ? 1 : id;
}

const router = Router();

// GET /api/dashboard/overview
router.get('/overview', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const [plant] = await sql<Plant[]>`SELECT * FROM plants WHERE id = ${cid}`;
    const [shift] = await sql<Shift[]>`SELECT * FROM shifts WHERE plant_id = ${cid} AND is_current = 1`;

    if (!plant) return res.status(404).json({ error: 'Plant not found' });

    const pulse = plant.overall_health >= 90 ? 'Normal' : plant.overall_health >= 70 ? 'Elevated' : 'Critical';

    const response: DashboardOverview = {
      plant,
      currentShift: shift || null,
      overallHealth: plant.overall_health,
      status: plant.status as 'stable' | 'warning' | 'critical',
      lastAiSync: plant.last_ai_sync,
      pulse,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// GET /api/dashboard/risks
router.get('/risks', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const dynamicRisks: Partial<RiskAssessment>[] = [];

    const problemMachines = await sql<Machine[]>`
      SELECT * FROM machines WHERE plant_id = ${cid} AND status IN ('WARNING', 'DOWN')
    `;

    problemMachines.forEach(machine => {
      dynamicRisks.push({
        id: 1000 + machine.id,
        plant_id: cid,
        title: `${machine.status === 'DOWN' ? 'Machine Down' : 'Machine Warning'}: ${machine.name}`,
        description: machine.status === 'DOWN'
          ? `${machine.name} is currently down. Immediate attention required.`
          : `${machine.name} showing abnormal readings. ${machine.notes || 'Check sensors.'}`,
        risk_level: machine.status === 'DOWN' ? 'CRITICAL' : 'MEDIUM',
        badge_text: machine.status === 'DOWN' ? 'CRITICAL' : 'WARNING',
        icon_type: machine.status === 'DOWN' ? 'alert-triangle' : 'activity',
        is_active: true,
      });
    });

    const alerts = await sql<(Alert & { machine_name?: string })[]>`
      SELECT a.*, m.name as machine_name
      FROM alerts a
      LEFT JOIN machines m ON a.machine_id = m.id
      WHERE a.plant_id = ${cid} AND a.status = 'active'
        AND a.severity IN ('CRITICAL', 'WARNING')
    `;

    alerts.forEach(alert => {
      const alreadyCovered = problemMachines.some(m => m.id === alert.machine_id);
      if (alreadyCovered) return;
      dynamicRisks.push({
        id: 2000 + alert.id,
        plant_id: cid,
        title: alert.title,
        description: alert.description,
        risk_level: alert.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        badge_text: alert.severity === 'CRITICAL' ? 'HIGH RISK' : 'MEDIUM RISK',
        icon_type: alert.severity === 'CRITICAL' ? 'alert-triangle' : 'clock',
        is_active: true,
      });
    });

    if (dynamicRisks.length === 0) {
      const staticRisks = await sql<RiskAssessment[]>`
        SELECT * FROM risk_assessments WHERE plant_id = ${cid} AND is_active = 1
      `;
      return res.json(staticRisks);
    }

    res.json(dynamicRisks);
  } catch (error) {
    console.error('Error fetching risks:', error);
    res.status(500).json({ error: 'Failed to fetch risk assessments' });
  }
});

// POST /api/dashboard/run-diagnostics
router.post('/run-diagnostics', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const { health, status } = await updatePlantHealth(cid);

    res.json({
      success: true,
      message: 'AI Diagnostics completed successfully',
      timestamp: new Date().toISOString(),
      health,
      status,
    });
  } catch (error) {
    console.error('Error running diagnostics:', error);
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

export default router;
