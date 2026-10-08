"use client";

import { startTransition, useActionState } from "react";
import { signIn } from "./actions";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        // Submit manually so React doesn't clear the email when sign-in fails.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state?.email} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {state?.error && <p className="form-error">{state.error}</p>}
    </form>
  );
}
