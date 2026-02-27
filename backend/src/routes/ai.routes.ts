import { Router } from 'express';
import { matchPolicySchemes } from '../services/ai.service';
import { getLinkedPolicies, getLinkedPoliciesByAlert, markSchemeApplied } from '../services/policy-linker.service';
import sql from '../database/db';

const router = Router();

interface Plant {
  id: number;
  name: string;
  state: string;
  udyam_tier: string;
  udyam_category: string;
}

// POST /api/ai/match-policies
router.post('/match-policies', async (req, res) => {
  try {
    const { operationalIssue } = req.body;
    if (!operationalIssue) return res.status(400).json({ error: 'operationalIssue is required' });

    const [plant] = await sql<Plant[]>`SELECT * FROM plants WHERE id = 1`;
    if (!plant) return res.status(404).json({ error: 'Plant not found' });

    console.log(`Generating AI policy matches for issue: "${operationalIssue}"`);
    const schemes = await matchPolicySchemes(plant, operationalIssue);

    res.json({
      success: true,
      operationalIssue,
      plant: { name: plant.name, state: plant.state, tier: plant.udyam_tier },
      schemes,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error matching policies:', error);
    res.status(500).json({ error: 'Failed to match policies' });
  }
});

// GET /api/ai/status
router.get('/status', (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  res.json({
    enabled: !!apiKey,
    provider: 'Anthropic Claude',
    model: 'claude-3-haiku-20240307',
    features: ['recommendations', 'policy-matching', 'policy-linking']
  });
});

// GET /api/ai/linked-policies/:recommendationId
router.get('/linked-policies/:recommendationId', async (req, res) => {
  try {
    const recommendationId = parseInt(req.params.recommendationId);
    const linkedPolicies = await getLinkedPolicies(recommendationId);

    if (!linkedPolicies) {
      return res.status(404).json({ error: 'No linked policies found for this recommendation' });
    }

    res.json({
      id: linkedPolicies.id,
      recommendationId,
      schemes: linkedPolicies.schemes,
      totalPotentialBenefit: linkedPolicies.totalPotentialBenefit,
      priorityMatchCount: linkedPolicies.priorityMatchCount,
      whatsappMessage: linkedPolicies.whatsappMessage,
      status: 'viewed',
      createdAt: linkedPolicies.createdAt
    });
  } catch (error) {
    console.error('Error fetching linked policies:', error);
    res.status(500).json({ error: 'Failed to fetch linked policies' });
  }
});

// POST /api/ai/linked-policies/:id/apply
router.post('/linked-policies/:id/apply', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await markSchemeApplied(id);
    res.json({ success: true, message: 'Scheme application status updated' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/ai/whatsapp-notification/:alertId
router.get('/whatsapp-notification/:alertId', async (req, res) => {
  try {
    const alertId = parseInt(req.params.alertId);
    const linkedPolicies = await getLinkedPoliciesByAlert(alertId);

    if (!linkedPolicies) {
      return res.status(404).json({ error: 'No notification found for this alert' });
    }

    res.json({
      message: linkedPolicies.whatsappMessage,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(linkedPolicies.whatsappMessage)}`
    });
  } catch (error) {
    console.error('Error fetching WhatsApp notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

export default router;
