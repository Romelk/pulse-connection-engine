/**
 * Policy Linker Service
 *
 * Bridges Ops Monitor (Agent 1) → Policy Hunter (Agent 2)
 * When an AI recommendation is generated, this service automatically
 * matches relevant government schemes to the operational context.
 */

import sql from '../database/db';
import { matchPolicySchemes } from './ai.service';

interface OperationalContext {
  alertId: number;
  alertTitle: string;
  alertDescription: string;
  machineType: string | null;
  machineDepartment: string | null;
  recommendation: {
    title: string;
    explanation: string;
    category: string;
    costAvoidance: number;
  };
}

interface PolicyScheme {
  name: string;
  ministry: string;
  level: 'central' | 'state';
  max_benefit: number;
  benefit_type: string;
  description: string;
  eligibility_criteria: string[];
  priority_match: boolean;
}

interface LinkedPolicyResult {
  id: number;
  schemes: PolicyScheme[];
  totalPotentialBenefit: number;
  priorityMatchCount: number;
  whatsappMessage: string;
  status: string;
  createdAt: string;
}

interface LinkedPolicyRow {
  id: number;
  recommendation_id: number;
  alert_id: number;
  operational_context: string;
  matched_schemes: string;
  total_potential_benefit: number;
  priority_match_count: number;
  whatsapp_message: string;
  status: string;
  created_at: string;
  viewed_at: string | null;
}

interface Plant {
  name: string;
  state: string;
  udyam_tier: string;
  udyam_category: string;
}

export async function linkPoliciesToRecommendation(
  recommendationId: number,
  context: OperationalContext
): Promise<LinkedPolicyResult> {
  const existing = await sql<LinkedPolicyRow[]>`
    SELECT * FROM linked_policy_recommendations WHERE recommendation_id = ${recommendationId}
  `;
  if (existing.length > 0) return formatExistingResult(existing[0]);

  const operationalIssue = buildOperationalIssue(context);
  const [plant] = await sql<Plant[]>`SELECT * FROM plants WHERE id = 1`;
  const schemes = await matchPolicySchemes(plant, operationalIssue);

  const totalBenefit = schemes.reduce((sum, s) => sum + (s.max_benefit || 0), 0);
  const priorityCount = schemes.filter(s => s.priority_match).length;
  const whatsappMessage = generateWhatsAppMessage(context, schemes);

  const [row] = await sql`
    INSERT INTO linked_policy_recommendations
      (recommendation_id, alert_id, operational_context, matched_schemes,
       total_potential_benefit, priority_match_count, whatsapp_message)
    VALUES (${recommendationId}, ${context.alertId}, ${JSON.stringify(context)},
      ${JSON.stringify(schemes)}, ${totalBenefit}, ${priorityCount}, ${whatsappMessage})
    RETURNING id, created_at
  `;

  return {
    id: row.id,
    schemes,
    totalPotentialBenefit: totalBenefit,
    priorityMatchCount: priorityCount,
    whatsappMessage,
    status: 'pending',
    createdAt: row.created_at,
  };
}

export async function getLinkedPolicies(recommendationId: number): Promise<LinkedPolicyResult | null> {
  const rows = await sql<LinkedPolicyRow[]>`
    SELECT * FROM linked_policy_recommendations WHERE recommendation_id = ${recommendationId}
  `;
  if (rows.length === 0) return null;

  const row = rows[0];
  await sql`
    UPDATE linked_policy_recommendations SET status = 'viewed', viewed_at = ${new Date().toISOString()} WHERE id = ${row.id}
  `;
  return formatExistingResult(row);
}

export async function getLinkedPoliciesByAlert(alertId: number): Promise<LinkedPolicyResult | null> {
  const rows = await sql<LinkedPolicyRow[]>`
    SELECT * FROM linked_policy_recommendations
    WHERE alert_id = ${alertId} ORDER BY created_at DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  return formatExistingResult(rows[0]);
}

export async function markSchemeApplied(linkedPolicyId: number): Promise<void> {
  await sql`UPDATE linked_policy_recommendations SET status = 'applied' WHERE id = ${linkedPolicyId}`;
}

function formatExistingResult(row: LinkedPolicyRow): LinkedPolicyResult {
  return {
    id: row.id,
    schemes: JSON.parse(row.matched_schemes),
    totalPotentialBenefit: row.total_potential_benefit,
    priorityMatchCount: row.priority_match_count,
    whatsappMessage: row.whatsapp_message,
    status: row.status,
    createdAt: row.created_at,
  };
}

function buildOperationalIssue(context: OperationalContext): string {
  const parts = [`Alert: ${context.alertTitle}`, `Description: ${context.alertDescription}`];
  if (context.machineType)       parts.push(`Machine Type: ${context.machineType}`);
  if (context.machineDepartment) parts.push(`Department: ${context.machineDepartment}`);
  parts.push(
    `AI Recommendation: ${context.recommendation.title}`,
    `Issue Category: ${context.recommendation.category}`,
    `Estimated Cost Impact: ₹${context.recommendation.costAvoidance.toLocaleString('en-IN')}`
  );
  return parts.join('\n');
}

function generateWhatsAppMessage(context: OperationalContext, schemes: PolicyScheme[]): string {
  const topSchemes = schemes.slice(0, 3);
  const totalBenefit = schemes.reduce((sum, s) => sum + (s.max_benefit || 0), 0);
  const schemesList = topSchemes
    .map(s => `• ${s.name} (up to ₹${(s.max_benefit || 0).toLocaleString('en-IN')})`)
    .join('\n');

  return `🏭 *FactoryHealth AI Alert*\n━━━━━━━━━━━━━━━━━━\n\n⚠️ *Issue Detected*\n${context.alertTitle}\n\n🔧 *Recommended Action*\n${context.recommendation.title}\n\n💰 *Funding Opportunities Found!*\n${schemesList}\n\n📊 *Total Potential Benefit: ₹${totalBenefit.toLocaleString('en-IN')}*\n\nView full details in the FactoryHealth app.`;
}
