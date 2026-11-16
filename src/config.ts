/** Public Supabase project settings. The publishable key is browser-safe; row level security scopes every row to the signed-in email. */
export const SUPABASE_URL = "https://ignaggqncggkfqzuvxja.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1tJ8wnvDZNDXXlwRFXwvxw_fc3npQxL";

export const BASE = "/quest-journal/";

export function appUrl(): string {
  if (typeof window === "undefined") return BASE;
  return new URL(BASE, window.location.origin).toString();
}
