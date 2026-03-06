import { Hono } from 'hono';
import bcryptjs from 'bcryptjs';
const { hashSync } = bcryptjs;
import { db } from '../db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const users = new Hono();

users.use('*', authMiddleware, adminMiddleware);

// GET /users — list all
users.get('/', (c) => {
  const rows = db.prepare('SELECT id, email, name, role, created_at FROM users').all();
  return c.json(rows);
});

// GET /users/:id
users.get('/:id', (c) => {
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(c.req.param('id'));
  if (!user) return c.json({ error: 'Not found' }, 404);
  return c.json(user);
});

// POST /users — create
users.post('/', async (c) => {
  const { email, password, name, role } = await c.req.json();

  if (!email || !password || !name) {
    return c.json({ error: 'email, password, name required' }, 400);
  }

  try {
    const result = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      email,
      hashSync(password, 10),
      name,
      role || 'user'
    );
    return c.json({ id: result.lastInsertRowid }, 201);
  } catch {
    return c.json({ error: 'Email already exists' }, 409);
  }
});

// PATCH /users/:id — update
users.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const fields: string[] = [];
  const values: any[] = [];

  if (body.name) { fields.push('name = ?'); values.push(body.name); }
  if (body.email) { fields.push('email = ?'); values.push(body.email); }
  if (body.role) { fields.push('role = ?'); values.push(body.role); }
  if (body.password) { fields.push('password = ?'); values.push(hashSync(body.password, 10)); }

  if (fields.length === 0) {
    return c.json({ error: 'Nothing to update' }, 400);
  }

  values.push(id);
  const result = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  if (result.changes === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ updated: true });
});

// DELETE /users/:id
users.delete('/:id', (c) => {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(c.req.param('id'));
  if (result.changes === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ deleted: true });
});

export { users };
