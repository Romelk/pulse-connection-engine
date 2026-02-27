import sql from '../database/db';
import { matchPolicySchemes } from './ai.service';

const SCHEME_TRIGGER_THRESHOLD = 50000;

interface DowntimeEventRow {
  id: number;
  machine_id: number;
  repair_cost: number | null;
  start_time: string;
  end_time: string | null;
  duration_hours: number | null;
  cause: string | null;
  status: string;
  scheme_triggered: number;
}

interface MachineRow {
  id: number;
  name: string;
  type: string;
  department: string;
  hourly_downtime_cost: number;
  purchase_cost: number;
}

interface PlantRow {
  name: string;
  state: string;
  udyam_tier: string;
  udyam_category: string;
}

export interface CostAnalysis {
  downtimeEventId: number;
  repairCost: number;
  durationHours: number;
  hourlyDowntimeCost: number;
  productionLoss: number;
  totalLoss: number;
  thresholdBreached: boolean;
  thresholdAmount: number;
}

export interface SchemeResult {
  costAnalysis: CostAnalysis;
  schemes: any[];
  totalPotentialBenefit: number;
  triggeredAt: string;
}

export async function calculateDowntimeLoss(downtimeEventId: number): Promise<CostAnalysis> {
  const [event] = await sql<DowntimeEventRow[]>`SELECT * FROM downtime_events WHERE id = ${downtimeEventId}`;
  if (!event) throw new Error(`Downtime event ${downtimeEventId} not found`);

  const [machine] = await sql<MachineRow[]>`SELECT * FROM machines WHERE id = ${event.machine_id}`;

  const repairCost = event.repair_cost || 0;
  const durationHours = event.duration_hours || calcDurationHours(event.start_time, event.end_time);
  const hourlyDowntimeCost = machine.hourly_downtime_cost || 0;
  const productionLoss = Math.round(durationHours * hourlyDowntimeCost);
  const totalLoss = repairCost + productionLoss;

  return {
    downtimeEventId,
    repairCost,
    durationHours,
    hourlyDowntimeCost,
    productionLoss,
    totalLoss,
    thresholdBreached: totalLoss >= SCHEME_TRIGGER_THRESHOLD,
    thresholdAmount: SCHEME_TRIGGER_THRESHOLD,
  };
}

export async function checkThresholdAndSuggestSchemes(downtimeEventId: number): Promise<SchemeResult | null> {
  const analysis = await calculateDowntimeLoss(downtimeEventId);
  if (!analysis.thresholdBreached) return null;

  const [event] = await sql<{ scheme_triggered: number; machine_id: number }[]>`
    SELECT scheme_triggered, machine_id FROM downtime_events WHERE id = ${downtimeEventId}
  `;
  if (event.scheme_triggered) return null;

  const [machine] = await sql<MachineRow[]>`SELECT * FROM machines WHERE id = ${event.machine_id}`;
  const [plant] = await sql<PlantRow[]>`SELECT * FROM plants WHERE id = 1`;

  const operationalIssue = buildIssueDescription(machine, analysis);
  const schemes = await matchPolicySchemes(plant, operationalIssue);
  const totalPotentialBenefit = schemes.reduce((s, sc) => s + (sc.max_benefit || 0), 0);

  await sql`
    UPDATE downtime_events SET scheme_triggered = 1, total_loss = ${analysis.totalLoss} WHERE id = ${downtimeEventId}
  `;

  return {
    costAnalysis: analysis,
    schemes,
    totalPotentialBenefit,
    triggeredAt: new Date().toISOString(),
  };
}

function calcDurationHours(startTime: string, endTime: string | null): number {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  return Math.round(((end - start) / 3600000) * 100) / 100;
}

function buildIssueDescription(machine: MachineRow, analysis: CostAnalysis): string {
  return [
    `Machine: ${machine.name} (${machine.type}, ${machine.department})`,
    `Downtime Duration: ${analysis.durationHours.toFixed(1)} hours`,
    `Repair Cost: ₹${analysis.repairCost.toLocaleString('en-IN')}`,
    `Production Loss: ₹${analysis.productionLoss.toLocaleString('en-IN')}`,
    `Total Financial Impact: ₹${analysis.totalLoss.toLocaleString('en-IN')}`,
    `The business needs financial support to repair or upgrade this ${machine.type} to prevent recurrence.`,
  ].join('\n');
}
