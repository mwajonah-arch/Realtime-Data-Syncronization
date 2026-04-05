// lib/db/src/index.ts
// Uses Neon's serverless HTTP driver — works in Vercel serverless functions.
// The old pg Pool kept persistent TCP connections which don't survive
// serverless cold-starts. Neon's driver makes fresh HTTP requests per query,
// which is exactly what serverless needs.

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema/index.js';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add it to your Vercel environment variables.',
  );
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export { schema };
export * from './schema/index.js';
