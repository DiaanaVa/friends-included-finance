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
