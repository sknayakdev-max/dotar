'use client'

import Link from "next/link"

type ErrorPageProps = {
  statusCode: number
}

const errorMessages: Record<number, { title: string; message: string }> = {
  400: {
    title: "Invalid request",
    message: "The repair desk could not understand that request. Please check the details and try again.",
  },
  401: {
    title: "Sign-in required",
    message: "You need to sign in before you can access this page.",
  },
  403: {
    title: "Access denied",
    message: "You do not have permission to view this page. Contact an administrator if you need access.",
  },
  404: {
    title: "Page not found",
    message: "The page you requested may have moved, or the link may be incorrect.",
  },
  408: {
    title: "Request timed out",
    message: "That took longer than expected. Please try the request again.",
  },
  500: {
    title: "Something went wrong",
    message: "Our repair desk hit an unexpected problem. Please try again in a moment.",
  },
  503: {
    title: "Service unavailable",
    message: "The repair desk is temporarily unavailable. Please try again shortly.",
  },
}

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  const content = errorMessages[statusCode] ?? {
    title: "Request could not be completed",
    message: "We could not complete that request right now. Please return to the dashboard and try again.",
  }

  return (
    <main className="error-page-container">
      <section className="error-page">
        <div className="error-page-card">
          <span className="error-page-code">ERROR {statusCode}</span>
          <div className="error-page-mark" aria-hidden="true">
            !
          </div>
          <h1>{content.title}</h1>
          <p>{content.message}</p>
          <div className="error-page-actions">
            <Link className="primary-action" href="/">
              Back to home
            </Link>
            <button className="secondary-action" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}