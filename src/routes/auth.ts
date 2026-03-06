import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcryptjs from 'bcryptjs';
const { compareSync, hashSync } = bcryptjs;
import { db } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const auth = new Hono();

auth.post('/register', async (c) => {
  const { email, password, name } = await c.req.json();

  if (!email || !password || !name) {
    return c.json({ error: 'email, password, name required' }, 400);
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) {
    return c.json({ error: 'Email already exists' }, 409);
  }

  const result = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(
    email,
    hashSync(password, 10),
    name
  );

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24h
  const token = await sign({ id: result.lastInsertRowid, email, role: 'user', exp }, JWT_SECRET);
  return c.json({ token }, 201);
});

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !compareSync(password, user.password)) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24h
  const token = await sign({ id: user.id, email: user.email, role: user.role, exp }, JWT_SECRET);
  return c.json({ token });
});

export { auth };
