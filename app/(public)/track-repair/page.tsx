"use client";

import { useEffect, useState } from "react";

type TrackedRequest = {
  requestNumber: string;
  customerName: string;
  deviceType: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function TrackRepairPage() {
  const [requestNumber, setRequestNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [tracked, setTracked] = useState<TrackedRequest | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(showLoading = true) {
    if (!requestNumber.trim() || !phone.trim()) {
      setError("Enter your request number and phone number.");
      return;
    }
    if (showLoading) setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/service-requests?requestNumber=${encodeURIComponent(requestNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to find that request.");
      setTracked(data.request);
    } catch (lookupError) {
      if (showLoading) setTracked(null);
      if (showLoading) setError(lookupError instanceof Error ? lookupError.message : "Unable to find that request.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    if (!tracked) return;
    const timer = window.setInterval(() => lookup(false), 15000);
    return () => window.clearInterval(timer);
  }, [tracked, requestNumber, phone]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    lookup();
  }

  return <>
    <section className="page-hero"><div className="container"><p className="eyebrow">LIVE REPAIR UPDATES</p><h1>Track your repair</h1><p>Enter the request number and phone number used when you submitted it.</p></div></section>
    <section className="content-section"><div className="container narrow-container"><div className="form-card">
      <form onSubmit={submit} className="service-form">
        <label>Request number<input value={requestNumber} onChange={(event) => setRequestNumber(event.target.value)} placeholder="e.g. REQ-1725812345678" required /></label>
        <label>Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone used for the request" required /></label>
        {error && <div className="dashboard-alert">{error}</div>}
        <button className="primary-action" type="submit" disabled={loading}>{loading ? "Checking…" : "Track repair"}</button>
      </form>
      {tracked && <div className="track-result"><div className="track-result-header"><div><p className="eyebrow">{tracked.requestNumber}</p><h2>{tracked.customerName}</h2><p>{formatLabel(tracked.deviceType)} · Updated {formatDate(tracked.updatedAt)}</p></div><span className={`track-status track-status-${tracked.status.toLowerCase()}`}>{formatLabel(tracked.status)}</span></div><div className="track-timeline"><div className="track-step active"><span>1</span><strong>Request received</strong></div><div className={`track-step ${tracked.status !== "PENDING_REVIEW" ? "active" : ""}`}><span>2</span><strong>Under review</strong></div><div className={`track-step ${["APPROVED", "CONVERTED"].includes(tracked.status) ? "active" : ""}`}><span>3</span><strong>Next steps shared</strong></div></div>{tracked.reviewNotes && <p className="track-note"><strong>Update from our team:</strong> {tracked.reviewNotes}</p>}<p className="track-refresh-note">This status refreshes automatically every 15 seconds.</p></div>}
    </div></div></section>
  </>;
}

function formatLabel(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
