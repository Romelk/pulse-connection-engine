import { Router, Request } from 'express';
import sql from '../database/db';
import type { GovernmentScheme, PolicySummary, Plant } from '../types';

function getCompanyId(req: Request): number {
  const id = parseInt(req.headers['x-company-id'] as string);
  return isNaN(id) ? 1 : id;
}

const router = Router();

// GET /api/policies/schemes
router.get('/schemes', async (req, res) => {
  try {
    const schemes = await sql<(GovernmentScheme & { is_saved: number })[]>`
      SELECT gs.*,
        CASE WHEN ss.id IS NOT NULL THEN 1 ELSE 0 END as is_saved
      FROM government_schemes gs
      LEFT JOIN saved_schemes ss ON gs.id = ss.scheme_id
      WHERE gs.is_active = 1
      ORDER BY gs.priority_match DESC, gs.max_benefit DESC
    `;
    const parsed = schemes.map(s => ({
      ...s,
      eligibility_criteria: JSON.parse(s.eligibility_criteria || '[]'),
      tags: JSON.parse(s.tags || '[]'),
      is_saved: Boolean(s.is_saved)
    }));
    res.json(parsed);
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

// GET /api/policies/schemes/:id
router.get('/schemes/:id', async (req, res) => {
  try {
    const [scheme] = await sql<(GovernmentScheme & { is_saved: number })[]>`
      SELECT gs.*,
        CASE WHEN ss.id IS NOT NULL THEN 1 ELSE 0 END as is_saved
      FROM government_schemes gs
      LEFT JOIN saved_schemes ss ON gs.id = ss.scheme_id
      WHERE gs.id = ${req.params.id}
    `;
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });

    res.json({
      ...scheme,
      eligibility_criteria: JSON.parse(scheme.eligibility_criteria || '[]'),
      tags: JSON.parse(scheme.tags || '[]'),
      is_saved: Boolean(scheme.is_saved)
    });
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({ error: 'Failed to fetch scheme' });
  }
});

// GET /api/policies/summary
router.get('/summary', async (req, res) => {
  try {
    const schemes = await sql<GovernmentScheme[]>`SELECT * FROM government_schemes WHERE is_active = 1`;

    const totalSubsidy = schemes.reduce((sum, s) => sum + (s.max_benefit || 0), 0);
    const centralCount = schemes.filter(s => s.level === 'central').length;
    const stateCount = schemes.filter(s => s.level === 'state').length;

    const summary: PolicySummary = {
      potentialSubsidy: { amount: totalSubsidy, comparison: 12, comparisonLabel: '+12% vs last quarter' },
      eligibleSchemes: { count: schemes.length, centralCount, stateCount },
      successRate: { percentage: 82, label: 'Based on your data health' }
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching policy summary:', error);
    res.status(500).json({ error: 'Failed to fetch policy summary' });
  }
});

// GET /api/policies/udyam-status
router.get('/udyam-status', async (req, res) => {
  try {
    const [plant] = await sql<Plant[]>`SELECT * FROM plants WHERE id = 1`;
    res.json({
      verified: Boolean(plant.udyam_verified),
      tier: plant.udyam_tier,
      category: plant.udyam_category,
      state: plant.state,
      udyamNumber: plant.udyam_number
    });
  } catch (error) {
    console.error('Error fetching Udyam status:', error);
    res.status(500).json({ error: 'Failed to fetch Udyam status' });
  }
});

// POST /api/policies/schemes/:id/save
router.post('/schemes/:id/save', async (req, res) => {
  try {
    const [existing] = await sql`SELECT * FROM saved_schemes WHERE scheme_id = ${req.params.id}`;
    if (existing) return res.json({ success: true, message: 'Scheme already saved' });

    await sql`INSERT INTO saved_schemes (scheme_id) VALUES (${req.params.id})`;
    res.json({ success: true, message: 'Scheme saved successfully' });
  } catch (error) {
    console.error('Error saving scheme:', error);
    res.status(500).json({ error: 'Failed to save scheme' });
  }
});

// DELETE /api/policies/schemes/:id/save
router.delete('/schemes/:id/save', async (req, res) => {
  try {
    await sql`DELETE FROM saved_schemes WHERE scheme_id = ${req.params.id}`;
    res.json({ success: true, message: 'Scheme removed from saved' });
  } catch (error) {
    console.error('Error removing saved scheme:', error);
    res.status(500).json({ error: 'Failed to remove saved scheme' });
  }
});

// GET /api/policies/saved
router.get('/saved', async (req, res) => {
  try {
    const schemes = await sql<GovernmentScheme[]>`
      SELECT gs.* FROM government_schemes gs
      INNER JOIN saved_schemes ss ON gs.id = ss.scheme_id
      ORDER BY ss.saved_at DESC
    `;
    const parsed = schemes.map(s => ({
      ...s,
      eligibility_criteria: JSON.parse(s.eligibility_criteria || '[]'),
      tags: JSON.parse(s.tags || '[]'),
      is_saved: true
    }));
    res.json(parsed);
  } catch (error) {
    console.error('Error fetching saved schemes:', error);
    res.status(500).json({ error: 'Failed to fetch saved schemes' });
  }
});

// GET /api/policies/applications
router.get('/applications', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const applications = await sql`
      SELECT sa.*, gs.name as scheme_name, gs.ministry, gs.max_benefit, gs.short_name
      FROM scheme_applications sa
      JOIN government_schemes gs ON sa.scheme_id = gs.id
      WHERE sa.plant_id = ${cid}
      ORDER BY sa.created_at DESC
    `;
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST /api/policies/applications
router.post('/applications', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    const { scheme_id } = req.body;
    if (!scheme_id) return res.status(400).json({ error: 'scheme_id is required' });

    const [scheme] = await sql`SELECT * FROM government_schemes WHERE id = ${scheme_id}`;
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });

    // Check if draft already exists for this scheme + plant
    const [existing] = await sql`
      SELECT * FROM scheme_applications
      WHERE scheme_id = ${scheme_id} AND plant_id = ${cid} AND status = 'draft'
    `;
    if (existing) return res.json(existing);

    const [plant] = await sql<Plant[]>`SELECT * FROM plants WHERE id = ${cid}`;
    const [{ count }] = await sql<{ count: string }[]>`
      SELECT COUNT(*) as count FROM machines WHERE plant_id = ${cid}
    `;

    const now = new Date().toISOString();
    const [application] = await sql`
      INSERT INTO scheme_applications
        (scheme_id, plant_id, status, company_name, udyam_number, udyam_tier, state, industry, machine_count, created_at, updated_at)
      VALUES
        (${scheme_id}, ${cid}, 'draft',
         ${plant?.name || null}, ${plant?.udyam_number || null}, ${plant?.udyam_tier || null},
         ${plant?.state || null}, ${plant?.industry || null}, ${parseInt(count) || 0},
         ${now}, ${now})
      RETURNING *
    `;
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PATCH /api/policies/applications/:id
router.patch('/applications/:id', async (req, res) => {
  try {
    const { purpose, estimated_cost, notes, status } = req.body;
    const now = new Date().toISOString();
    const [application] = await sql`
      UPDATE scheme_applications
      SET purpose         = COALESCE(${purpose ?? null}, purpose),
          estimated_cost  = COALESCE(${estimated_cost ?? null}, estimated_cost),
          notes           = COALESCE(${notes ?? null}, notes),
          status          = COALESCE(${status ?? null}, status),
          updated_at      = ${now}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

export default router;
