import { Router } from 'express';
import { syncSchemeData, scrapeSchemeUpdates, getVerifiedSchemes, checkSchemeSyncStatus } from '../services/scraper.service';

const router = Router();

// POST /api/scraper/sync-schemes
// Sync government scheme data from curated list to database
router.post('/sync-schemes', async (req, res) => {
  try {
    console.log('Starting scheme data sync...');
    const count = await syncSchemeData();
    res.json({
      success: true,
      schemesUpdated: count,
      message: `Successfully synced ${count} government schemes to database`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing schemes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync scheme data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/scraper/check-updates
// Check if there are scheme updates available from web sources
router.get('/check-updates', async (req, res) => {
  try {
    const result = await scrapeSchemeUpdates();
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check for updates'
    });
  }
});

// GET /api/scraper/status
// Get current sync status
router.get('/status', (req, res) => {
  try {
    const status = checkSchemeSyncStatus();
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check sync status'
    });
  }
});

// GET /api/scraper/verified-schemes
// Get list of all verified schemes (preview without syncing)
router.get('/verified-schemes', (req, res) => {
  try {
    const schemes = getVerifiedSchemes();
    res.json({
      success: true,
      count: schemes.length,
      schemes: schemes.map(s => ({
        name: s.name,
        short_name: s.short_name,
        ministry: s.ministry,
        level: s.level,
        state: s.state,
        benefit_type: s.benefit_type,
        max_benefit: s.max_benefit,
        source_url: s.source_url
      }))
    });
  } catch (error) {
    console.error('Error getting verified schemes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get verified schemes'
    });
  }
});

export default router;
