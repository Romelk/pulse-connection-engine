import sql from '../database/db';

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
export async function calculatePlantHealth(plantId = 1): Promise<number> {
  let health = 100;

  const machines = await sql<Machine[]>`
    SELECT id, status, efficiency FROM machines WHERE plant_id = ${plantId}
  `;

  machines.forEach(machine => {
    switch (machine.status) {
      case 'DOWN':        health -= 15; break;
      case 'WARNING':     health -= 8;  break;
      case 'MAINTENANCE': health -= 3;  break;
    }
  });

  const alerts = await sql<Alert[]>`
    SELECT id, severity, status FROM alerts
    WHERE plant_id = ${plantId} AND status = 'active'
  `;

  alerts.forEach(alert => {
    switch (alert.severity) {
      case 'CRITICAL': health -= 10; break;
      case 'WARNING':  health -= 5;  break;
    }
  });

  return Math.max(0, Math.min(100, health));
}

export function determineStatus(health: number): 'stable' | 'warning' | 'critical' {
  if (health >= 80) return 'stable';
  if (health >= 50) return 'warning';
  return 'critical';
}

export async function updatePlantHealth(plantId = 1): Promise<{ health: number; status: string }> {
  const health = await calculatePlantHealth(plantId);
  const status = determineStatus(health);

  await sql`
    UPDATE plants
    SET overall_health = ${health}, status = ${status}, last_ai_sync = ${new Date().toISOString()}
    WHERE id = ${plantId}
  `;

  console.log(`Plant ${plantId} health updated: ${health}% (${status})`);
  return { health, status };
}

export default { calculatePlantHealth, determineStatus, updatePlantHealth };
