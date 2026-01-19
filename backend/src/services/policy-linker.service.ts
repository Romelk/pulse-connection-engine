/**
 * Policy Linker Service
 *
 * Bridges Ops Monitor (Agent 1) → Policy Hunter (Agent 2)
 * When an AI recommendation is generated, this service automatically
 * matches relevant government schemes to the operational context.
 */

import db from '../database/db';
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

/**
 * Links policy schemes to an AI recommendation based on operational context.
 * This is the core function that bridges Ops Monitor → Policy Hunter.
 */
export async function linkPoliciesToRecommendation(
  recommendationId: number,
  context: OperationalContext
): Promise<LinkedPolicyResult> {
  // Check if already linked (return cached result)
  const existing = db.prepare(
    'SELECT * FROM linked_policy_recommendations WHERE recommendation_id = ?'
  ).get(recommendationId) as LinkedPolicyRow | undefined;

  if (existing) {
    return formatExistingResult(existing);
  }

  // Build operational issue description for policy matching
  const operationalIssue = buildOperationalIssue(context);

  // Get plant info for context
  const plant = db.prepare('SELECT * FROM plants WHERE id = 1').get() as Plant;

  // Call AI to match policies (Agent 2: Policy Hunter)
  const schemes = await matchPolicySchemes(plant, operationalIssue);

  // Calculate metrics
  const totalBenefit = schemes.reduce((sum, s) => sum + (s.max_benefit || 0), 0);
  const priorityCount = schemes.filter(s => s.priority_match).length;

  // Generate WhatsApp message
  const whatsappMessage = generateWhatsAppMessage(context, schemes);

  // Store in database
  const result = db.prepare(`
    INSERT INTO linked_policy_recommendations
    (recommendation_id, alert_id, operational_context, matched_schemes,
     total_potential_benefit, priority_match_count, whatsapp_message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    recommendationId,
    context.alertId,
    JSON.stringify(context),
    JSON.stringify(schemes),
    totalBenefit,
    priorityCount,
    whatsappMessage
  );

  const createdAt = new Date().toISOString();

  return {
    id: result.lastInsertRowid as number,
    schemes,
    totalPotentialBenefit: totalBenefit,
    priorityMatchCount: priorityCount,
    whatsappMessage,
    status: 'pending',
    createdAt
  };
}

/**
 * Get linked policies by recommendation ID
 */
export function getLinkedPolicies(recommendationId: number): LinkedPolicyResult | null {
  const row = db.prepare(
    'SELECT * FROM linked_policy_recommendations WHERE recommendation_id = ?'
  ).get(recommendationId) as LinkedPolicyRow | undefined;

  if (!row) return null;

  // Mark as viewed
  db.prepare(`
    UPDATE linked_policy_recommendations
    SET status = 'viewed', viewed_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), row.id);

  return formatExistingResult(row);
}

/**
 * Get linked policies by alert ID
 */
export function getLinkedPoliciesByAlert(alertId: number): LinkedPolicyResult | null {
  const row = db.prepare(
    'SELECT * FROM linked_policy_recommendations WHERE alert_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(alertId) as LinkedPolicyRow | undefined;

  if (!row) return null;
  return formatExistingResult(row);
}

/**
 * Mark a scheme as applied
 */
export function markSchemeApplied(linkedPolicyId: number): void {
  db.prepare(`
    UPDATE linked_policy_recommendations
    SET status = 'applied'
    WHERE id = ?
  `).run(linkedPolicyId);
}

/**
 * Format an existing database row into the result interface
 */
function formatExistingResult(row: LinkedPolicyRow): LinkedPolicyResult {
  return {
    id: row.id,
    schemes: JSON.parse(row.matched_schemes),
    totalPotentialBenefit: row.total_potential_benefit,
    priorityMatchCount: row.priority_match_count,
    whatsappMessage: row.whatsapp_message,
    status: row.status,
    createdAt: row.created_at
  };
}

/**
 * Build a comprehensive operational issue description for AI matching
 */
function buildOperationalIssue(context: OperationalContext): string {
  const parts = [
    `Alert: ${context.alertTitle}`,
    `Description: ${context.alertDescription}`,
  ];

  if (context.machineType) {
    parts.push(`Machine Type: ${context.machineType}`);
  }
  if (context.machineDepartment) {
    parts.push(`Department: ${context.machineDepartment}`);
  }

  parts.push(
    `AI Recommendation: ${context.recommendation.title}`,
    `Issue Category: ${context.recommendation.category}`,
    `Estimated Cost Impact: ₹${context.recommendation.costAvoidance.toLocaleString('en-IN')}`
  );

  return parts.join('\n');
}

/**
 * Generate a WhatsApp-formatted notification message
 */
function generateWhatsAppMessage(
  context: OperationalContext,
  schemes: PolicyScheme[]
): string {
  const topSchemes = schemes.slice(0, 3);
  const totalBenefit = schemes.reduce((sum, s) => sum + (s.max_benefit || 0), 0);

  const schemesList = topSchemes
    .map(s => `• ${s.name} (up to ₹${(s.max_benefit || 0).toLocaleString('en-IN')})`)
    .join('\n');

  return `🏭 *FactoryHealth AI Alert*
━━━━━━━━━━━━━━━━━━

⚠️ *Issue Detected*
${context.alertTitle}

🔧 *Recommended Action*
${context.recommendation.title}

💰 *Funding Opportunities Found!*
${schemesList}

📊 *Total Potential Benefit: ₹${totalBenefit.toLocaleString('en-IN')}*

View full details in the FactoryHealth app.`;
}
