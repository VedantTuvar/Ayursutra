import * as dotenv from 'dotenv';
import { z } from 'zod';
import * as path from 'path';

// Load environmental parameters from root or local workspace
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
dotenv.config(); // fallback to local directory .env

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  PORT: z.preprocess((val) => Number(val), z.number().default(3001)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@ayursutra.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configurations:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
