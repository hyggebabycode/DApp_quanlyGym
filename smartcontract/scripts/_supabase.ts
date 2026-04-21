import "dotenv/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Thieu bien moi truong ${name}. Vui long cap nhat file .env`,
    );
  }

  return value;
}

export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = getEnvOrThrow("SUPABASE_URL");
  const serviceRoleKey = getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
