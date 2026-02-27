import { Router, Request, Response } from 'express';
import sql from '../database/db';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const [user] = await sql<{ id: number; email: string; name: string; role: string; company_id: number | null; company_name: string | null }[]>`
    SELECT u.id, u.email, u.name, u.role, u.company_id, p.name AS company_name
    FROM users u
    LEFT JOIN plants p ON p.id = u.company_id
    WHERE u.email = ${email.trim().toLowerCase()} AND u.password = ${password}
  `;

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  return res.json(user);
});

// POST /api/auth/logout  (client clears localStorage — this is a no-op)
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;
