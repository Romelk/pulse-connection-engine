import { Router, Request, Response } from 'express';
import sql from '../database/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'team-photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Get all team members
router.get('/', async (req: Request, res: Response) => {
  try {
    const members = await sql<TeamMember[]>`
      SELECT * FROM team_members ORDER BY display_order ASC, created_at ASC
    `;
    res.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Get a single team member
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [member] = await sql<TeamMember[]>`SELECT * FROM team_members WHERE id = ${req.params.id}`;
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    res.json(member);
  } catch (error) {
    console.error('Error fetching team member:', error);
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
});

// Create a new team member
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, role, bio, photo_url, linkedin_url, email, display_order } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Name and role are required' });

    const [newMember] = await sql<TeamMember[]>`
      INSERT INTO team_members (name, role, bio, photo_url, linkedin_url, email, display_order)
      VALUES (${name}, ${role}, ${bio || null}, ${photo_url || null}, ${linkedin_url || null}, ${email || null}, ${display_order || 0})
      RETURNING *
    `;
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

// Update a team member
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, role, bio, photo_url, linkedin_url, email, display_order } = req.body;
    const { id } = req.params;

    const [existing] = await sql<TeamMember[]>`SELECT * FROM team_members WHERE id = ${id}`;
    if (!existing) return res.status(404).json({ error: 'Team member not found' });

    const [updated] = await sql<TeamMember[]>`
      UPDATE team_members
      SET name = ${name || existing.name},
          role = ${role || existing.role},
          bio = ${bio !== undefined ? bio : existing.bio},
          photo_url = ${photo_url !== undefined ? photo_url : existing.photo_url},
          linkedin_url = ${linkedin_url !== undefined ? linkedin_url : existing.linkedin_url},
          email = ${email !== undefined ? email : existing.email},
          display_order = ${display_order !== undefined ? display_order : existing.display_order},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *
    `;
    res.json(updated);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// Upload photo for a team member
router.post('/:id/photo', upload.single('photo'), async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await sql<TeamMember[]>`SELECT * FROM team_members WHERE id = ${id}`;
    if (!existing) return res.status(404).json({ error: 'Team member not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (existing.photo_url) {
      const oldPhotoPath = path.join(uploadDir, path.basename(existing.photo_url));
      if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
    }

    const photoUrl = `/uploads/team-photos/${req.file.filename}`;
    const [updated] = await sql<TeamMember[]>`
      UPDATE team_members SET photo_url = ${photoUrl}, updated_at = ${new Date().toISOString()}
      WHERE id = ${id} RETURNING *
    `;
    res.json(updated);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Delete a team member
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await sql<TeamMember[]>`SELECT * FROM team_members WHERE id = ${id}`;
    if (!existing) return res.status(404).json({ error: 'Team member not found' });

    if (existing.photo_url) {
      const photoPath = path.join(uploadDir, path.basename(existing.photo_url));
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    await sql`DELETE FROM team_members WHERE id = ${id}`;
    res.json({ success: true, message: 'Team member deleted' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

export default router;
