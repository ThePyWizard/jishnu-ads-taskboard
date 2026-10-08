import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Retries reads that fail before any response arrives (a dropped or corrupted connection).
 * Writes are not retried: the first attempt may have reached the database, and repeating
 * it could save the same change twice.
 */
export const fetchWithRetry: typeof fetch = async (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const attempts = method === "GET" || method === "HEAD" ? 3 : 1;
  for (let i = 1; ; i++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      if (i >= attempts || !(e instanceof TypeError)) throw e;
      await new Promise((r) => setTimeout(r, 200 * i));
    }
  }
};

/** Supabase client acting as the signed-in user (row level security applies). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { fetch: fetchWithRetry },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component: the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

/** Turns a Supabase error into a message a person can act on. */
export function describeError(error: { message: string }): string {
  return /fetch failed|network|ECONN|ETIMEDOUT|socket/i.test(error.message)
    ? "Couldn't reach the database. Check your internet connection and try again."
    : error.message;
}
