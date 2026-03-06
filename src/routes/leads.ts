import { Hono } from 'hono';
import { db } from '../db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { sendTelegramNotification } from '../telegram.js';

const leads = new Hono();

// POST /leads — public, from landing page
leads.post('/', async (c) => {
  const { name, phone, message } = await c.req.json();

  if (!name || !phone) {
    return c.json({ error: 'name and phone required' }, 400);
  }

  const result = db.prepare(
    'INSERT INTO leads (name, phone, message) VALUES (?, ?, ?)'
  ).run(name, phone, message || null);

  await sendTelegramNotification(name, phone, message);

  return c.json({ id: result.lastInsertRowid, success: true }, 201);
});

// GET /leads — admin only
leads.get('/', authMiddleware, adminMiddleware, (c) => {
  const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  return c.json(rows);
});

// PATCH /leads/:id — update status
leads.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
  const { status } = await c.req.json();

  if (!['new', 'processed', 'rejected'].includes(status)) {
    return c.json({ error: 'status must be: new, processed, rejected' }, 400);
  }

  const result = db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, c.req.param('id'));
  if (result.changes === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ updated: true });
});

export { leads };
