import { Router } from 'express';
import db from '../database/db';
import { updatePlantHealth } from '../services/health.service';
import type { Plant, Shift, RiskAssessment, DashboardOverview, Machine, Alert } from '../types';

const router = Router();

// GET /api/dashboard/overview
router.get('/overview', (req, res) => {
  try {
    const plant = db.prepare('SELECT * FROM plants WHERE id = 1').get() as Plant;
    const shift = db.prepare('SELECT * FROM shifts WHERE plant_id = 1 AND is_current = 1').get() as Shift | undefined;

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
// Dynamic risk calculation based on machine status and active alerts
router.get('/risks', (req, res) => {
  try {
    const dynamicRisks: Partial<RiskAssessment>[] = [];

    // 1. Get machines with WARNING or DOWN status
    const problemMachines = db.prepare(`
      SELECT * FROM machines
      WHERE plant_id = 1 AND status IN ('WARNING', 'DOWN')
    `).all() as Machine[];

    problemMachines.forEach(machine => {
      dynamicRisks.push({
        id: 1000 + machine.id,
        plant_id: 1,
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

    // 2. Get active critical/warning alerts not linked to machine risks
    const alerts = db.prepare(`
      SELECT a.*, m.name as machine_name
      FROM alerts a
      LEFT JOIN machines m ON a.machine_id = m.id
      WHERE a.plant_id = 1 AND a.status = 'active'
      AND a.severity IN ('CRITICAL', 'WARNING')
    `).all() as (Alert & { machine_name?: string })[];

    alerts.forEach(alert => {
      // Skip if already covered by machine risk
      const alreadyCovered = problemMachines.some(m => m.id === alert.machine_id);
      if (alreadyCovered) return;

      dynamicRisks.push({
        id: 2000 + alert.id,
        plant_id: 1,
        title: alert.title,
        description: alert.description,
        risk_level: alert.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        badge_text: alert.severity === 'CRITICAL' ? 'HIGH RISK' : 'MEDIUM RISK',
        icon_type: alert.severity === 'CRITICAL' ? 'alert-triangle' : 'clock',
        is_active: true,
      });
    });

    // 3. If no dynamic risks, return static risks from database
    if (dynamicRisks.length === 0) {
      const staticRisks = db.prepare(`
        SELECT * FROM risk_assessments WHERE plant_id = 1 AND is_active = 1
      `).all() as RiskAssessment[];
      return res.json(staticRisks);
    }

    res.json(dynamicRisks);
  } catch (error) {
    console.error('Error fetching risks:', error);
    res.status(500).json({ error: 'Failed to fetch risk assessments' });
  }
});

// POST /api/dashboard/run-diagnostics
router.post('/run-diagnostics', (req, res) => {
  try {
    // Recalculate plant health based on current machine states and alerts
    const { health, status } = updatePlantHealth(1);

    res.json({
      success: true,
      message: 'AI Diagnostics completed successfully',
      timestamp: new Date().toISOString(),
      health,
      status
    });
  } catch (error) {
    console.error('Error running diagnostics:', error);
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

export default router;
