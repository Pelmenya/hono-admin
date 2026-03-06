import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { auth } from './routes/auth.js';
import { users } from './routes/users.js';
import { leads } from './routes/leads.js';
import 'dotenv/config';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.route('/auth', auth);
app.route('/users', users);
app.route('/leads', leads);

app.use('/*', serveStatic({ root: './public' }));

serve({ fetch: app.fetch, port: 3111 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
