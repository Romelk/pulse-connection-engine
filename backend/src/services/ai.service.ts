import Anthropic from '@anthropic-ai/sdk';
import { aiConfig } from '../config/ai.config';

// Initialize Anthropic client only if API key is available
const anthropic = aiConfig.enabled ? new Anthropic({ apiKey: aiConfig.anthropicApiKey }) : null;

interface Alert {
  id: number;
  title: string;
  severity: string;
  description: string;
  production_impact: number | null;
  sensor_id: string | null;
}

interface Machine {
  id: number;
  name: string;
  type: string;
  department: string;
  temperature: number | null;
  vibration_level: number | null;
}

interface Plant {
  name: string;
  state: string;
  udyam_tier: string;
  udyam_category: string;
}

interface AIRecommendation {
  priority: string;
  category: string;
  title: string;
  explanation: string;
  uptime_gain: string;
  cost_avoidance: number;
  why_reasons: Array<{ icon: string; title: string; description: string }>;
  confidence_score: number;
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

/**
 * Generate AI-powered maintenance recommendation based on alert and machine context
 */
export async function generateRecommendation(alert: Alert, machine: Machine | null): Promise<AIRecommendation> {
  if (!anthropic || !aiConfig.enabled) {
    // Return fallback recommendation if AI is not configured
    return getFallbackRecommendation(alert, machine);
  }

  const prompt = `You are an AI maintenance advisor for SME manufacturing in India. Analyze this alert and provide a maintenance recommendation.

ALERT DETAILS:
- Title: ${alert.title}
- Severity: ${alert.severity}
- Description: ${alert.description}
- Production Impact: ${alert.production_impact ? `${alert.production_impact}%` : 'Unknown'}
- Sensor ID: ${alert.sensor_id || 'N/A'}

MACHINE DETAILS:
${machine ? `
- Name: ${machine.name}
- Type: ${machine.type}
- Department: ${machine.department}
- Current Temperature: ${machine.temperature ? `${machine.temperature}°C` : 'N/A'}
- Vibration Level: ${machine.vibration_level ? `${machine.vibration_level} mm/s` : 'N/A'}
` : '- Machine data not available'}

Generate a maintenance recommendation in the following JSON format ONLY (no other text):
{
  "priority": "HIGH PRIORITY" | "MEDIUM PRIORITY" | "LOW PRIORITY",
  "category": "MAINTENANCE" | "SAFETY" | "EFFICIENCY" | "INSPECTION",
  "title": "Short action title (e.g., 'Schedule Preventive Maintenance at 4 PM')",
  "explanation": "2-3 sentences explaining the issue and prediction based on the sensor data",
  "uptime_gain": "Estimated hours saved (e.g., '4 Hours Saved')",
  "cost_avoidance": number (estimated INR saved, e.g., 12500),
  "why_reasons": [
    {"icon": "moon", "title": "Reason 1 Title", "description": "Explanation for reason 1"},
    {"icon": "history", "title": "Reason 2 Title", "description": "Explanation for reason 2"}
  ],
  "confidence_score": number (75-99)
}

Consider:
- Indian manufacturing context (INR currency, Indian work shifts)
- Common manufacturing issues: bearing failure, overheating, vibration anomalies
- Cost estimates in realistic INR ranges (5000-100000 for typical issues)
- Valid icon options: moon, history, clock, shield, zap, wrench, tool, alert-triangle`;

  try {
    const response = await anthropic.messages.create({
      model: aiConfig.model,
      max_tokens: aiConfig.maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return getFallbackRecommendation(alert, machine);
  } catch (error) {
    console.error('AI recommendation generation failed:', error);
    return getFallbackRecommendation(alert, machine);
  }
}

/**
 * Generate AI-powered policy scheme matching based on plant profile and operational issue
 */
export async function matchPolicySchemes(plant: Plant, operationalIssue: string): Promise<PolicyScheme[]> {
  if (!anthropic || !aiConfig.enabled) {
    return getFallbackSchemes();
  }

  const prompt = `You are an expert on Indian MSME government schemes and subsidies.

PLANT PROFILE:
- Name: ${plant.name}
- State: ${plant.state}
- Udyam Tier: ${plant.udyam_tier}
- Udyam Category: ${plant.udyam_category}

CURRENT OPERATIONAL ISSUE: ${operationalIssue}

Recommend 3-5 REAL Indian government schemes that could help this manufacturing unit. Return ONLY a JSON array:

[
  {
    "name": "Full Official Scheme Name",
    "ministry": "Ministry or Department Name",
    "level": "central" or "state",
    "max_benefit": number (in rupees),
    "benefit_type": "subsidy" | "interest_subsidy" | "grant" | "loan",
    "description": "2-3 sentences about the scheme",
    "eligibility_criteria": ["Criterion 1", "Criterion 2"],
    "priority_match": true if highly relevant to the issue
  }
]

Focus on REAL Indian government schemes such as:
- CLCSS (Credit Linked Capital Subsidy Scheme)
- PMEGP (Prime Minister Employment Generation Programme)
- SFURTI (Scheme of Fund for Regeneration of Traditional Industries)
- PSI (Package Scheme of Incentives) for Maharashtra
- Stand-Up India
- MUDRA
- Technology Upgradation Fund Scheme (TUFS)
- ZED Certification Scheme`;

  try {
    const response = await anthropic.messages.create({
      model: aiConfig.model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return getFallbackSchemes();
  } catch (error) {
    console.error('AI policy matching failed:', error);
    return getFallbackSchemes();
  }
}

/**
 * Fallback recommendation when AI is not available
 */
function getFallbackRecommendation(alert: Alert, machine: Machine | null): AIRecommendation {
  const isCritical = alert.severity === 'CRITICAL';

  return {
    priority: isCritical ? 'HIGH PRIORITY' : 'MEDIUM PRIORITY',
    category: 'MAINTENANCE',
    title: isCritical ? 'Immediate Inspection Required' : 'Schedule Preventive Maintenance',
    explanation: `Based on the ${alert.severity.toLowerCase()} alert "${alert.title}", ${machine ? `the ${machine.name}` : 'the affected equipment'} requires attention. ${alert.description}`,
    uptime_gain: isCritical ? '6 Hours Saved' : '2 Hours Saved',
    cost_avoidance: isCritical ? 25000 : 8000,
    why_reasons: [
      {
        icon: 'clock',
        title: 'Prevent Unplanned Downtime',
        description: 'Addressing this issue now prevents unexpected production stoppages during peak hours.'
      },
      {
        icon: 'history',
        title: 'Historical Pattern',
        description: 'Similar alerts have led to equipment failures if not addressed within 24 hours.'
      }
    ],
    confidence_score: 85
  };
}

/**
 * Fallback schemes when AI is not available
 */
function getFallbackSchemes(): PolicyScheme[] {
  return [
    {
      name: 'Credit Linked Capital Subsidy Scheme (CLCSS)',
      ministry: 'Ministry of MSME',
      level: 'central',
      max_benefit: 1500000,
      benefit_type: 'subsidy',
      description: '15% capital subsidy for technology upgradation in manufacturing sector.',
      eligibility_criteria: ['Udyam Registered', 'Manufacturing sector', 'Technology upgrade'],
      priority_match: true
    },
    {
      name: 'PMEGP',
      ministry: 'Ministry of MSME',
      level: 'central',
      max_benefit: 2500000,
      benefit_type: 'subsidy',
      description: 'Credit-linked subsidy for new micro-enterprises.',
      eligibility_criteria: ['New units', 'Non-farm sector'],
      priority_match: false
    }
  ];
}
