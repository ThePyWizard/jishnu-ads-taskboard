"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SignInState {
  error: string;
  email: string;
}

export async function signIn(_prev: SignInState | null, fd: FormData): Promise<SignInState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "That email and password don't match. Check them and try again."
        : error.code === "email_not_confirmed"
          ? "This account isn't confirmed yet. Ask the owner to confirm it in Supabase."
          : error.message;
    return { error: message, email };
  }
  redirect("/");
}
