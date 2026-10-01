import { z } from "zod";

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DEMO_ACCESS_SECRET: z.string().min(16),
});

export function getSupabaseEnv() {
  return supabaseEnvSchema.parse(process.env);
}

const telegramEnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(20),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
});

export function getTelegramEnv() { return telegramEnvSchema.parse(process.env); }

const sheetsEnvSchema = z.object({
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(10),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.email(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().min(40),
});

export function getSheetsEnv() { return sheetsEnvSchema.parse(process.env); }
