import { Router, Request, Response } from 'express';
import sql from '../database/db';

const router = Router();

// GET /api/admin/companies — list all companies with local admin info + stats
router.get('/companies', async (_req: Request, res: Response) => {
  try {
    const companies = await sql`
      SELECT
        p.id,
        p.name,
        p.location,
        p.state,
        p.udyam_number,
        p.udyam_tier,
        p.overall_health,
        p.status,
        p.created_at,
        u.id    AS admin_id,
        u.name  AS admin_name,
        u.email AS admin_email,
        (SELECT COUNT(*)::int FROM machines m WHERE m.plant_id = p.id) AS machine_count,
        (SELECT COUNT(*)::int FROM downtime_events d
          INNER JOIN machines m2 ON d.machine_id = m2.id
          WHERE m2.plant_id = p.id AND d.status = 'ongoing') AS active_downtime_count
      FROM plants p
      LEFT JOIN users u ON u.company_id = p.id AND u.role = 'local_admin'
      ORDER BY p.created_at DESC
    `;
    res.json(companies);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch companies' });
  }
});

// GET /api/admin/companies/:id — single company stats
router.get('/companies/:id', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.id as string);

    const [company] = await sql`
      SELECT p.*,
        u.name AS admin_name, u.email AS admin_email
      FROM plants p
      LEFT JOIN users u ON u.company_id = p.id AND u.role = 'local_admin'
      WHERE p.id = ${companyId}
    `;
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const [mc] = await sql<{ n: number }[]>`SELECT COUNT(*)::int as n FROM machines WHERE plant_id = ${companyId}`;
    const [ad] = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int as n FROM downtime_events d
      INNER JOIN machines m ON d.machine_id = m.id
      WHERE m.plant_id = ${companyId} AND d.status = 'ongoing'
    `;
    const [ei] = await sql<{ n: number }[]>`SELECT COUNT(*)::int as n FROM expansion_intents WHERE company_id = ${companyId}`;

    res.json({
      ...company,
      stats: { machine_count: mc.n, active_downtime: ad.n, expansion_intents: ei.n }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch company' });
  }
});

// PATCH /api/admin/companies/:id — update editable company details
router.patch('/companies/:id', async (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const { name, location, state, industry, udyam_number, udyam_tier } = req.body;

  if (!name || !location || !state) {
    return res.status(400).json({ error: 'name, location, and state are required' });
  }

  try {
    const [updated] = await sql`
      UPDATE plants
      SET name         = ${name.trim()},
          location     = ${location.trim()},
          state        = ${state.trim()},
          industry     = ${industry || null},
          udyam_number = ${udyam_number || null},
          udyam_tier   = ${udyam_tier || null}
      WHERE id = ${companyId}
      RETURNING id, name, location, state, industry, udyam_number, udyam_tier, overall_health, status
    `;
    if (!updated) return res.status(404).json({ error: 'Company not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update company' });
  }
});

// POST /api/admin/companies — create company + local admin atomically
router.post('/companies', async (req: Request, res: Response) => {
  const { name, industry, location, state, udyam_number, admin_name, admin_email, admin_password } = req.body;

  if (!name || !location || !state || !admin_name || !admin_email || !admin_password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const [existing] = await sql<{ id: number }[]>`SELECT id FROM users WHERE email = ${admin_email.trim().toLowerCase()}`;
  if (existing) return res.status(409).json({ error: 'Admin email already in use' });

  try {
    const result = await sql.begin(async (txSql: any) => {
      const [plant] = await txSql`
        INSERT INTO plants (name, industry, location, state, udyam_number, udyam_tier, overall_health, status, last_ai_sync)
        VALUES (${name.trim()}, ${industry || null}, ${location.trim()}, ${state.trim()}, ${udyam_number || null}, 'Micro', 100, 'stable', ${new Date().toISOString()})
        RETURNING id, name, location, state
      `;
      const [user] = await txSql`
        INSERT INTO users (email, password, role, company_id, name)
        VALUES (${admin_email.trim().toLowerCase()}, ${admin_password}, 'local_admin', ${plant.id}, ${admin_name.trim()})
        RETURNING id, email, name
      `;
      return {
        company: { ...plant, industry: industry || null },
        localAdmin: user,
      };
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create company' });
  }
});

export default router;
