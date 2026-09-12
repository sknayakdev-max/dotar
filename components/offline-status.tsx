"use client";

import { useOffline } from "next/offline";

export default function OfflineStatus() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      className="offline-status-overlay"
      role="status"
      aria-live="assertive"
      aria-label="You are offline. Waiting for an internet connection."
    >
      <div className="offline-status-card">
        <div className="offline-status-signal" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>You&apos;re offline</strong>
          <p>Waiting for your internet connection to return…</p>
        </div>
      </div>
    </div>
  );
}
