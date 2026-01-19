import db from '../database/db';

interface Machine {
  id: number;
  status: string;
  efficiency: number;
}

interface Alert {
  id: number;
  severity: string;
  status: string;
}

/**
 * Calculate and update the overall health of a plant based on:
 * - Machine statuses (ACTIVE, IDLE, WARNING, DOWN, MAINTENANCE)
 * - Active alert severity levels (CRITICAL, WARNING, INFO, SYSTEM)
 *
 * Health calculation formula:
 * - Base score: 100
 * - Each DOWN machine: -15 points
 * - Each WARNING machine: -8 points
 * - Each MAINTENANCE machine: -3 points
 * - Each active CRITICAL alert: -10 points
 * - Each active WARNING alert: -5 points
 * - Minimum health: 0
 */
export function calculatePlantHealth(plantId: number = 1): number {
  let health = 100;

  // Get all machines for this plant
  const machines = db.prepare(`
    SELECT id, status, efficiency FROM machines WHERE plant_id = ?
  `).all(plantId) as Machine[];

  // Calculate machine impact
  machines.forEach(machine => {
    switch (machine.status) {
      case 'DOWN':
        health -= 15;
        break;
      case 'WARNING':
        health -= 8;
        break;
      case 'MAINTENANCE':
        health -= 3;
        break;
      // ACTIVE and IDLE don't reduce health
    }
  });

  // Get active alerts for this plant
  const alerts = db.prepare(`
    SELECT id, severity, status FROM alerts
    WHERE plant_id = ? AND status = 'active'
  `).all(plantId) as Alert[];

  // Calculate alert impact
  alerts.forEach(alert => {
    switch (alert.severity) {
      case 'CRITICAL':
        health -= 10;
        break;
      case 'WARNING':
        health -= 5;
        break;
      // INFO and SYSTEM alerts don't reduce health
    }
  });

  // Ensure health stays within bounds
  return Math.max(0, Math.min(100, health));
}

/**
 * Determine plant status based on health percentage
 */
export function determineStatus(health: number): 'stable' | 'warning' | 'critical' {
  if (health >= 80) return 'stable';
  if (health >= 50) return 'warning';
  return 'critical';
}

/**
 * Recalculate and update plant health in the database
 * Returns the new health value
 */
export function updatePlantHealth(plantId: number = 1): { health: number; status: string } {
  const health = calculatePlantHealth(plantId);
  const status = determineStatus(health);

  db.prepare(`
    UPDATE plants
    SET overall_health = ?, status = ?, last_ai_sync = ?
    WHERE id = ?
  `).run(health, status, new Date().toISOString(), plantId);

  console.log(`Plant ${plantId} health updated: ${health}% (${status})`);

  return { health, status };
}

export default {
  calculatePlantHealth,
  determineStatus,
  updatePlantHealth,
};
