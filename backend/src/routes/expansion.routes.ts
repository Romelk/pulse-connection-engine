import { Router } from 'express';
import sql from '../database/db';
import Anthropic from '@anthropic-ai/sdk';
import { aiConfig } from '../config/ai.config';

const router = Router();
const anthropic = aiConfig.enabled ? new Anthropic({ apiKey: aiConfig.anthropicApiKey }) : null;

interface ExpansionIntentRow {
  id: number;
  business_goal: string;
  investment_range: string | null;
  timeline: string | null;
  sector: string | null;
  current_capacity: string | null;
  target_capacity: string | null;
  state: string;
  matched_schemes: string | null;
  gap_analysis: string | null;
  status: string;
  created_at: string;
}

interface PlantRow {
  name: string;
  state: string;
  udyam_tier: string;
  udyam_category: string;
}

// GET /api/expansion
router.get('/', async (req, res) => {
  try {
    const intents = await sql<ExpansionIntentRow[]>`SELECT * FROM expansion_intents ORDER BY created_at DESC`;
    const parsed = intents.map(i => ({
      ...i,
      matched_schemes: i.matched_schemes ? JSON.parse(i.matched_schemes) : null,
    }));
    res.json(parsed);
  } catch (error) {
    console.error('Error fetching expansion intents:', error);
    res.status(500).json({ error: 'Failed to fetch expansion intents' });
  }
});

// GET /api/expansion/:id
router.get('/:id', async (req, res) => {
  try {
    const [intent] = await sql<ExpansionIntentRow[]>`SELECT * FROM expansion_intents WHERE id = ${req.params.id}`;
    if (!intent) return res.status(404).json({ error: 'Expansion intent not found' });

    res.json({
      ...intent,
      matched_schemes: intent.matched_schemes ? JSON.parse(intent.matched_schemes) : null,
    });
  } catch (error) {
    console.error('Error fetching expansion intent:', error);
    res.status(500).json({ error: 'Failed to fetch expansion intent' });
  }
});

// POST /api/expansion/intent
router.post('/intent', async (req, res) => {
  try {
    const { business_goal, investment_range, timeline, sector, current_capacity, target_capacity, state } = req.body;
    if (!business_goal) return res.status(400).json({ error: 'business_goal is required' });

    const [plant] = await sql<PlantRow[]>`SELECT * FROM plants WHERE id = 1`;
    const now = new Date().toISOString();

    const [insertResult] = await sql<{ id: number }[]>`
      INSERT INTO expansion_intents
        (business_goal, investment_range, timeline, sector, current_capacity, target_capacity, state, status, created_at)
      VALUES (
        ${business_goal}, ${investment_range || null}, ${timeline || null}, ${sector || null},
        ${current_capacity || null}, ${target_capacity || null}, ${state || plant.state}, 'pending', ${now}
      )
      RETURNING id
    `;
    const intentId = insertResult.id;

    const aiResult = await matchExpansionToSchemes({
      business_goal, investment_range, timeline, sector,
      current_capacity, target_capacity, state: state || plant.state,
    }, plant);

    await sql`
      UPDATE expansion_intents
      SET matched_schemes = ${aiResult.schemes ? JSON.stringify(aiResult.schemes) : null},
          gap_analysis = ${aiResult.gap_analysis || null},
          status = ${aiResult.schemes && aiResult.schemes.length > 0 ? 'matched' : 'gap_identified'}
      WHERE id = ${intentId}
    `;

    const [updated] = await sql<ExpansionIntentRow[]>`SELECT * FROM expansion_intents WHERE id = ${intentId}`;

    res.status(201).json({
      ...updated,
      matched_schemes: updated.matched_schemes ? JSON.parse(updated.matched_schemes) : null,
    });
  } catch (error) {
    console.error('Error processing expansion intent:', error);
    res.status(500).json({ error: 'Failed to process expansion intent' });
  }
});

// --- AI Matching ---

async function matchExpansionToSchemes(
  intent: {
    business_goal: string;
    investment_range?: string;
    timeline?: string;
    sector?: string;
    current_capacity?: string;
    target_capacity?: string;
    state: string;
  },
  plant: PlantRow
): Promise<{ schemes: any[] | null; gap_analysis: string | null }> {
  if (!anthropic) return getFallbackExpansionResult(intent);

  const prompt = `You are an expert on Indian MSME government schemes. A manufacturing business owner wants to expand their operations.

PLANT PROFILE:
- Plant: ${plant.name}
- State: ${intent.state}
- Udyam Tier: ${plant.udyam_tier}
- Category: ${plant.udyam_category}

EXPANSION INTENT:
- Business Goal: ${intent.business_goal}
- Investment Range: ${intent.investment_range || 'Not specified'}
- Timeline: ${intent.timeline || 'Not specified'}
- Sector: ${intent.sector || 'Manufacturing'}
- Current Capacity: ${intent.current_capacity || 'Not specified'}
- Target Capacity: ${intent.target_capacity || 'Not specified'}

TASK: Analyze whether any real Indian government schemes could support this expansion.

If matching schemes exist, respond with JSON:
{
  "result_type": "matched",
  "schemes": [
    {
      "name": "Full Official Scheme Name",
      "ministry": "Ministry Name",
      "level": "central" or "state",
      "max_benefit": number (INR),
      "benefit_type": "subsidy" | "loan" | "grant" | "interest_subsidy",
      "description": "2-3 sentences about the scheme",
      "why_it_fits": "1-2 sentences explaining why this matches the stated intent",
      "next_step": "Concrete first action the owner should take"
    }
  ]
}

If NO schemes match, respond with JSON:
{
  "result_type": "gap",
  "gap_analysis": "Clear explanation of why no current scheme matches, what would need to be true for eligibility, and what the owner can do now to position themselves for future schemes."
}

Focus on REAL schemes: CLCSS, PMEGP, PSI Maharashtra, SFURTI, TUFS, ZED, Stand-Up India, MUDRA, etc.`;

  try {
    const response = await anthropic.messages.create({
      model: aiConfig.model,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.result_type === 'matched') return { schemes: parsed.schemes, gap_analysis: null };
        else return { schemes: null, gap_analysis: parsed.gap_analysis };
      }
    }
  } catch (error) {
    console.error('AI expansion matching failed:', error);
  }

  return getFallbackExpansionResult(intent);
}

function getFallbackExpansionResult(intent: { business_goal: string; investment_range?: string }) {
  const investmentNum = parseInvestmentRange(intent.investment_range || '');

  if (investmentNum && investmentNum >= 500000) {
    return {
      schemes: [
        {
          name: 'Credit Linked Capital Subsidy Scheme (CLCSS)',
          ministry: 'Ministry of MSME',
          level: 'central',
          max_benefit: 1500000,
          benefit_type: 'subsidy',
          description: '15% capital subsidy for technology upgradation in manufacturing.',
          why_it_fits: 'Capital expansion for manufacturing units is a primary use case for CLCSS.',
          next_step: 'Visit udyamregistration.gov.in to verify Udyam status, then apply through your bank.',
        },
      ],
      gap_analysis: null,
    };
  }

  return {
    schemes: null,
    gap_analysis: `Based on the stated investment range, the expansion may fall below the minimum threshold for most capital subsidy schemes (typically ₹5 Lakhs+). Consider: (1) Bundling multiple upgrades into one application, (2) Applying for MUDRA loans for smaller expansion needs under ₹10 Lakhs, (3) Revisiting once the investment scale increases.`,
  };
}

function parseInvestmentRange(range: string): number | null {
  if (range.includes('5-25')) return 1500000;
  if (range.includes('25-100')) return 5000000;
  if (range.includes('>100')) return 15000000;
  if (range.includes('<5')) return 300000;
  return null;
}

export default router;
