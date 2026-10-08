import type { Metadata } from "next";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in · Ad Ledger" };

export default function LoginPage() {
  return (
    <div className="login">
      <div className="card login-card">
        <h1>
          Ad Ledger<span>.</span>
        </h1>
        <p>Every change to Lascade&apos;s app campaigns on Meta, Google and the rest, logged the day it happens.</p>
        <SignInForm />
        <small>Accounts are created by the owner in Supabase. Ask them if you need one.</small>
      </div>
    </div>
  );
}
