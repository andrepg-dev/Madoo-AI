"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction}>
      {state.error ? <p className="error">{state.error}</p> : null}
      <label className="field">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </label>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
