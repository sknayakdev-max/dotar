'use client'

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"

import { loginAction } from "./actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button className="primary-action" disabled={pending} type="submit">
      {pending ? "Signing in..." : "Sign in"}
    </button>
  )
}

export default function AuthPage() {
  const [state, formAction] = useActionState(loginAction, null)

  return (
    <main className="public-shell">
      <section className="account-section">
        <div className="account-card">
          <p className="eyebrow">STAFF PORTAL</p>

          <h1>Staff sign in</h1>

          <p className="account-intro">
            Sign in with your authorised FixDesk account.
          </p>

          <form action={formAction} className="service-form">
            <label htmlFor="email">
              Work email address
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>

            <label htmlFor="password">
              Password
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>

            {state?.error ? (
              <p className="error-message">{state.error}</p>
            ) : null}

            <Link className="text-link" href="/reset-password">
              Forgot password?
            </Link>

            <SubmitButton />
          </form>
        </div>
      </section>
    </main>
  )
}