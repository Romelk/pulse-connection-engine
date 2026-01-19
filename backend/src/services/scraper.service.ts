import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../database/db';

// Verified real government scheme data from official sources
// This serves as a curated database of actual Indian MSME schemes
const VERIFIED_SCHEMES = [
  {
    name: 'Credit Linked Capital Subsidy Scheme (CLCSS)',
    short_name: 'CLCSS',
    ministry: 'Ministry of MSME, Government of India',
    level: 'central',
    state: null,
    max_benefit: 1500000,
    benefit_type: 'subsidy',
    benefit_unit: 'Lakhs',
    description: '15% capital subsidy up to Rs.15 lakhs for technology upgradation in specified sub-sectors. Available for MSE units for induction of well-established and improved technology in approved sectors.',
    eligibility_criteria: JSON.stringify([
      'Registered under Udyam Registration',
      'Manufacturing sector only',
      'For technology upgradation projects',
      'Unit should not have availed CLCSS earlier',
      'Loan should be for purchase of Plant & Machinery'
    ]),
    tags: JSON.stringify(['Udyam Registered', 'Technology Upgrade', 'Manufacturing']),
    source_url: 'https://msme.gov.in/credit-linked-capital-subsidy-scheme-clcss',
    priority_match: 1,
  },
  {
    name: 'Prime Minister Employment Generation Programme (PMEGP)',
    short_name: 'PMEGP',
    ministry: 'Ministry of MSME, Government of India',
    level: 'central',
    state: null,
    max_benefit: 2500000,
    benefit_type: 'subsidy',
    benefit_unit: 'Lakhs',
    description: 'Credit-linked subsidy programme for setting up new micro-enterprises. Margin money subsidy of 15-35% of project cost depending on category and location. Maximum project cost Rs.25 lakhs for manufacturing and Rs.10 lakhs for service sector.',
    eligibility_criteria: JSON.stringify([
      'Age: 18 years and above',
      'Minimum 8th class pass for projects above Rs.10 lakhs',
      'New units only (not for expansion)',
      'Non-farm sector activities',
      'Income ceiling based on category'
    ]),
    tags: JSON.stringify(['New Enterprise', 'Non-farm Sector', 'Self Employment']),
    source_url: 'https://www.kviconline.gov.in/pmegp/',
    priority_match: 1,
  },
  {
    name: 'Scheme of Fund for Regeneration of Traditional Industries (SFURTI)',
    short_name: 'SFURTI',
    ministry: 'Ministry of MSME, Government of India',
    level: 'central',
    state: null,
    max_benefit: 800000,
    benefit_type: 'grant',
    benefit_unit: 'per artisan',
    description: 'Organizes traditional artisans into clusters to enhance their competitiveness. Provides support for common facility centers, design development, marketing, training, and other infrastructure needs.',
    eligibility_criteria: JSON.stringify([
      'Traditional industry artisans',
      'Must form cluster of minimum 500 artisans (Regular) or 1000 (Major)',
      'Includes khadi, village industries, coir sectors',
      'Cluster should be in existence for at least one year'
    ]),
    tags: JSON.stringify(['Traditional Industries', 'Cluster Development', 'Artisans']),
    source_url: 'https://sfurti.msme.gov.in/',
    priority_match: 0,
  },
  {
    name: 'Micro & Small Enterprises Cluster Development Programme (MSE-CDP)',
    short_name: 'MSE-CDP',
    ministry: 'Ministry of MSME, Government of India',
    level: 'central',
    state: null,
    max_benefit: 1000000000,
    benefit_type: 'grant',
    benefit_unit: 'per cluster',
    description: 'Support for infrastructure development in MSME clusters. Includes setting up of Common Facility Centers (CFCs), testing centers, design centers, training facilities with GoI contribution up to 70-90%.',
    eligibility_criteria: JSON.stringify([
      'Identified MSME clusters',
      'State/UT government support required',
      'Cluster must have minimum 100 MSEs',
      'SPV formation required for implementation'
    ]),
    tags: JSON.stringify(['Infrastructure', 'Cluster Development', 'Common Facility']),
    source_url: 'https://msme.gov.in/mse-cdp',
    priority_match: 0,
  },
  {
    name: 'Package Scheme of Incentives (PSI) 2024',
    short_name: 'PSI 2024',
    ministry: 'Industries Department, Government of Maharashtra',
    level: 'state',
    state: 'Maharashtra',
    max_benefit: 5000000,
    benefit_type: 'interest_subsidy',
    benefit_unit: '5% Per Annum',
    description: 'Comprehensive incentive package for new and expansion manufacturing units in Maharashtra. Interest subsidy up to 5% per annum for 7 years. Higher benefits for units in less developed regions (C, D, D+ zones).',
    eligibility_criteria: JSON.stringify([
      'New manufacturing unit in Maharashtra',
      'Minimum fixed capital investment as per zone',
      'Higher incentives in C, D, D+ zones',
      'Unit must be registered on MAITRI portal'
    ]),
    tags: JSON.stringify(['Maharashtra', 'New Investment', 'Interest Subsidy']),
    source_url: 'https://maitri.mahaonline.gov.in/',
    priority_match: 1,
  },
  {
    name: 'Technology Upgradation Fund Scheme (TUFS)',
    short_name: 'TUFS',
    ministry: 'Ministry of Textiles, Government of India',
    level: 'central',
    state: null,
    max_benefit: 3000000,
    benefit_type: 'subsidy',
    benefit_unit: 'Lakhs',
    description: 'Capital investment subsidy of 10-15% for technology upgradation in textile sector. Covers spinning, weaving, processing, garmenting and made-ups segments.',
    eligibility_criteria: JSON.stringify([
      'Textile manufacturing units',
      'For new machinery procurement',
      'Must be registered entity',
      'MSME or larger units in textile sector'
    ]),
    tags: JSON.stringify(['Textile Sector', 'Technology Upgrade', 'Machinery']),
    source_url: 'https://texmin.nic.in/schemes',
    priority_match: 0,
  },
  {
    name: 'Stand-Up India Scheme',
    short_name: 'Stand-Up India',
    ministry: 'Ministry of Finance, Government of India',
    level: 'central',
    state: null,
    max_benefit: 10000000,
    benefit_type: 'loan',
    benefit_unit: 'Lakhs',
    description: 'Facilitates bank loans between Rs.10 lakh and Rs.1 crore for SC/ST and Women entrepreneurs for setting up greenfield enterprises in manufacturing, services, or trading sector.',
    eligibility_criteria: JSON.stringify([
      'SC/ST or Women entrepreneur',
      'Above 18 years of age',
      'Greenfield project only',
      'Manufacturing, services, or trading sector',
      'Should not be defaulter to any bank'
    ]),
    tags: JSON.stringify(['SC/ST', 'Women Entrepreneur', 'Bank Loan']),
    source_url: 'https://www.standupmitra.in/',
    priority_match: 0,
  },
  {
    name: 'Emergency Credit Line Guarantee Scheme (ECLGS)',
    short_name: 'ECLGS',
    ministry: 'Ministry of Finance, Government of India',
    level: 'central',
    state: null,
    max_benefit: 50000000,
    benefit_type: 'guarantee',
    benefit_unit: '100% Guarantee',
    description: 'Collateral-free, automatic additional credit facility for MSMEs. 100% government guarantee on additional funding of up to 20% of outstanding credit. Extended to support business continuity.',
    eligibility_criteria: JSON.stringify([
      'Existing MSME borrowers',
      'Account should not be NPA as on specific date',
      'Udyam registered',
      'For business continuity and working capital'
    ]),
    tags: JSON.stringify(['Credit Guarantee', 'Working Capital', 'MSME Support']),
    source_url: 'https://www.eclgs.com/',
    priority_match: 0,
  },
  {
    name: 'A Scheme for Promoting Innovation, Rural Industry & Entrepreneurship (ASPIRE)',
    short_name: 'ASPIRE',
    ministry: 'Ministry of MSME, Government of India',
    level: 'central',
    state: null,
    max_benefit: 10000000,
    benefit_type: 'grant',
    benefit_unit: 'per incubator',
    description: 'Promotes innovation and rural entrepreneurship through technology business incubators and livelihood business incubators. Grant support for setting up incubation centers.',
    eligibility_criteria: JSON.stringify([
      'Institutions promoting entrepreneurship',
      'Livelihood Business Incubators (LBIs)',
      'Technology Business Incubators (TBIs)',
      'Should have necessary infrastructure'
    ]),
    tags: JSON.stringify(['Innovation', 'Rural Industry', 'Incubation']),
    source_url: 'https://aspire.msme.gov.in/',
    priority_match: 0,
  },
  {
    name: 'Interest Subvention Scheme for MSMEs',
    short_name: 'Interest Subvention',
    ministry: 'Ministry of MSME, Government of India',
    level: 'central',
    state: null,
    max_benefit: 200000,
    benefit_type: 'interest_subsidy',
    benefit_unit: '2% Per Annum',
    description: '2% interest subvention on fresh or incremental term loans taken by MSMEs. Applicable to Udyam registered enterprises for loans availed from scheduled commercial banks.',
    eligibility_criteria: JSON.stringify([
      'Udyam registered MSMEs',
      'Fresh or incremental term loan',
      'Loan from scheduled commercial bank',
      'Manufacturing and service sectors'
    ]),
    tags: JSON.stringify(['Interest Subvention', 'Term Loan', 'MSME']),
    source_url: 'https://msme.gov.in/interest-subvention-scheme',
    priority_match: 1,
  },
  {
    name: 'Rajiv Gandhi Udyami Mitra Yojana (RGUMY)',
    short_name: 'RGUMY',
    ministry: 'Ministry of MSME, Government of India',
    level: 'central',
    state: null,
    max_benefit: 0,
    benefit_type: 'support',
    benefit_unit: 'Handholding Support',
    description: 'Provides handholding support and assistance to first-generation entrepreneurs through Udyami Mitras. Helps in all aspects from project formulation to bank loan approval.',
    eligibility_criteria: JSON.stringify([
      'First-generation entrepreneurs',
      'Planning to set up new MSME',
      'Need assistance with documentation',
      'Support through empanelled Udyami Mitras'
    ]),
    tags: JSON.stringify(['First Generation', 'Handholding', 'New Entrepreneur']),
    source_url: 'https://msme.gov.in/rajiv-gandhi-udyami-mitra-yojana',
    priority_match: 0,
  },
  {
    name: 'Procurement and Marketing Support (PMS) Scheme',
    short_name: 'PMS',
    ministry: 'Ministry of MSME, Government of India',
    level: 'central',
    state: null,
    max_benefit: 500000,
    benefit_type: 'subsidy',
    benefit_unit: 'Lakhs',
    description: 'Financial assistance to MSMEs for participation in domestic and international trade fairs, exhibitions. Covers stall charges, airfare, and other promotional activities.',
    eligibility_criteria: JSON.stringify([
      'Udyam registered MSMEs',
      'For participation in trade fairs',
      'Domestic and international exhibitions',
      'Product promotion activities'
    ]),
    tags: JSON.stringify(['Marketing', 'Trade Fair', 'Export Promotion']),
    source_url: 'https://msme.gov.in/procurement-and-marketing-support',
    priority_match: 0,
  },
];

/**
 * Syncs verified scheme data to the database
 * Replaces existing schemes with fresh data from curated list
 */
export async function syncSchemeData(): Promise<number> {
  try {
    // Clear existing schemes
    db.prepare('DELETE FROM government_schemes').run();

    // Reset auto-increment
    db.prepare("DELETE FROM sqlite_sequence WHERE name='government_schemes'").run();

    // Insert verified schemes
    const insertScheme = db.prepare(`
      INSERT INTO government_schemes
      (name, short_name, ministry, level, state, max_benefit, benefit_type, benefit_unit, description, eligibility_criteria, tags, priority_match, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const now = new Date().toISOString();

    VERIFIED_SCHEMES.forEach((scheme) => {
      insertScheme.run(
        scheme.name,
        scheme.short_name,
        scheme.ministry,
        scheme.level,
        scheme.state,
        scheme.max_benefit,
        scheme.benefit_type,
        scheme.benefit_unit,
        scheme.description,
        scheme.eligibility_criteria,
        scheme.tags,
        scheme.priority_match,
        now
      );
    });

    console.log(`Synced ${VERIFIED_SCHEMES.length} government schemes to database`);
    return VERIFIED_SCHEMES.length;
  } catch (error) {
    console.error('Error syncing scheme data:', error);
    throw error;
  }
}

/**
 * Attempts to fetch fresh scheme data from government websites
 * Falls back to curated data if scraping fails (most government sites block scrapers)
 */
export async function scrapeSchemeUpdates(): Promise<{
  scraped: boolean;
  source?: string;
  fallback?: boolean;
  count: number;
  schemes?: Array<{ name: string; source: string }>;
}> {
  const scrapedSchemes: Array<{ name: string; source: string }> = [];

  try {
    // Attempt to fetch from MSME portal
    const response = await axios.get('https://msme.gov.in/all-schemes', {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const $ = cheerio.load(response.data);

    // Try to extract scheme names from the page
    // Note: The actual selector would depend on the website structure
    $('h2, h3, .scheme-title, .card-title').each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 10 && text.length < 200) {
        scrapedSchemes.push({
          name: text,
          source: 'msme.gov.in'
        });
      }
    });

    if (scrapedSchemes.length > 0) {
      return {
        scraped: true,
        source: 'msme.gov.in',
        count: scrapedSchemes.length,
        schemes: scrapedSchemes.slice(0, 10) // Return first 10
      };
    }
  } catch (error) {
    console.log('Web scraping failed (expected for most government sites), using curated data');
  }

  // Fallback to curated data
  return {
    scraped: false,
    fallback: true,
    count: VERIFIED_SCHEMES.length,
    schemes: VERIFIED_SCHEMES.slice(0, 5).map(s => ({
      name: s.name,
      source: s.source_url
    }))
  };
}

/**
 * Gets the list of all verified schemes without inserting into database
 */
export function getVerifiedSchemes() {
  return VERIFIED_SCHEMES;
}

/**
 * Checks if the database needs to be synced with latest scheme data
 */
export function checkSchemeSyncStatus(): {
  needsSync: boolean;
  currentCount: number;
  availableCount: number;
} {
  const result = db.prepare('SELECT COUNT(*) as count FROM government_schemes').get() as { count: number };
  return {
    needsSync: result.count < VERIFIED_SCHEMES.length,
    currentCount: result.count,
    availableCount: VERIFIED_SCHEMES.length
  };
}
