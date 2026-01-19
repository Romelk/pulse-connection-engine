import { Router } from 'express';
import db from '../database/db';
import type { GovernmentScheme, PolicySummary, Plant } from '../types';

const router = Router();

// GET /api/policies/schemes
router.get('/schemes', (req, res) => {
  try {
    const schemes = db.prepare(`
      SELECT gs.*,
        CASE WHEN ss.id IS NOT NULL THEN 1 ELSE 0 END as is_saved
      FROM government_schemes gs
      LEFT JOIN saved_schemes ss ON gs.id = ss.scheme_id
      WHERE gs.is_active = 1
      ORDER BY gs.priority_match DESC, gs.max_benefit DESC
    `).all() as (GovernmentScheme & { is_saved: number })[];

    // Parse JSON fields
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
router.get('/schemes/:id', (req, res) => {
  try {
    const scheme = db.prepare(`
      SELECT gs.*,
        CASE WHEN ss.id IS NOT NULL THEN 1 ELSE 0 END as is_saved
      FROM government_schemes gs
      LEFT JOIN saved_schemes ss ON gs.id = ss.scheme_id
      WHERE gs.id = ?
    `).get(req.params.id) as (GovernmentScheme & { is_saved: number }) | undefined;

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' });
    }

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
router.get('/summary', (req, res) => {
  try {
    const schemes = db.prepare('SELECT * FROM government_schemes WHERE is_active = 1').all() as GovernmentScheme[];

    const totalSubsidy = schemes.reduce((sum, s) => sum + (s.max_benefit || 0), 0);
    const centralCount = schemes.filter(s => s.level === 'central').length;
    const stateCount = schemes.filter(s => s.level === 'state').length;

    const summary: PolicySummary = {
      potentialSubsidy: {
        amount: totalSubsidy,
        comparison: 12,
        comparisonLabel: '+12% vs last quarter'
      },
      eligibleSchemes: {
        count: schemes.length,
        centralCount,
        stateCount
      },
      successRate: {
        percentage: 82,
        label: 'Based on your data health'
      }
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching policy summary:', error);
    res.status(500).json({ error: 'Failed to fetch policy summary' });
  }
});

// GET /api/policies/udyam-status
router.get('/udyam-status', (req, res) => {
  try {
    const plant = db.prepare('SELECT * FROM plants WHERE id = 1').get() as Plant;

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
router.post('/schemes/:id/save', (req, res) => {
  try {
    // Check if already saved
    const existing = db.prepare('SELECT * FROM saved_schemes WHERE scheme_id = ?').get(req.params.id);

    if (existing) {
      return res.json({ success: true, message: 'Scheme already saved' });
    }

    db.prepare('INSERT INTO saved_schemes (scheme_id) VALUES (?)').run(req.params.id);
    res.json({ success: true, message: 'Scheme saved successfully' });
  } catch (error) {
    console.error('Error saving scheme:', error);
    res.status(500).json({ error: 'Failed to save scheme' });
  }
});

// DELETE /api/policies/schemes/:id/save
router.delete('/schemes/:id/save', (req, res) => {
  try {
    db.prepare('DELETE FROM saved_schemes WHERE scheme_id = ?').run(req.params.id);
    res.json({ success: true, message: 'Scheme removed from saved' });
  } catch (error) {
    console.error('Error removing saved scheme:', error);
    res.status(500).json({ error: 'Failed to remove saved scheme' });
  }
});

// GET /api/policies/saved
router.get('/saved', (req, res) => {
  try {
    const schemes = db.prepare(`
      SELECT gs.* FROM government_schemes gs
      INNER JOIN saved_schemes ss ON gs.id = ss.scheme_id
      ORDER BY ss.saved_at DESC
    `).all() as GovernmentScheme[];

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

export default router;
