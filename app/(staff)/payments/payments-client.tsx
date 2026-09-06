"use client";

import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, FileText, Plus, Search, X } from "lucide-react";

import DashboardHeader from "@/components/dashboard/header";
import DashboardSidebar from "@/components/dashboard/sidebar";
import type { User } from "@/lib/types";

import { recordPaymentAction, type PaymentInput, type PaymentRepair } from "./actions";

type Props = { user: User; initialRepairs: PaymentRepair[]; initialError?: string };
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

export default function PaymentsClient({ user, initialRepairs, initialError }: Props) {
  const [repairs, setRepairs] = useState(initialRepairs);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(initialError || "");
  const [creating, setCreating] = useState(false);
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return query ? repairs.filter((repair) => `${repair.repairNumber || ""} ${repair.customerName} ${repair.deviceName}`.toLowerCase().includes(query)) : repairs; }, [repairs, search]);
  const outstanding = repairs.reduce((sum, repair) => sum + Math.max(0, repair.estimatedCost - repair.paidAmount), 0);

  function paid(repairId: string, amount: number) {
    setRepairs((current) => current.map((repair) => repair.id === repairId ? { ...repair, paidAmount: repair.paidAmount + amount } : repair));
    setCreating(false);
  }

  return <div className="staff-dashboard"><DashboardSidebar user={user} /><div className="dashboard-main"><DashboardHeader user={user} /><main className="dashboard-content">
    <div className="dashboard-welcome"><div><p className="dashboard-kicker">PAYMENTS & COLLECTIONS</p><h1>Payments</h1><p>Calculate repair charges, add GST, and record the customer payment.</p></div><div className="customer-header-actions"><div className="customer-search-box"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search repairs..." aria-label="Search repairs" /></div><button type="button" className="new-repair-button" onClick={() => setCreating(true)}><Plus size={16} /> Take payment</button></div></div>
    {error && <div className="dashboard-card customer-error"><p className="error-message">{error}</p></div>}
    <div className="payment-summary-row"><Summary label="Open repairs" value={repairs.length} icon={<FileText size={18} />} /><Summary label="Outstanding" value={money(outstanding)} icon={<CreditCard size={18} />} warning /></div>
    <div className="dashboard-card customer-table-card"><div className="customer-table-toolbar"><span className="toolbar-count">{filtered.length} {filtered.length === 1 ? "repair" : "repairs"}</span></div><div className="overflow-x-auto"><table className="data-table payment-table"><thead><tr><th>Repair</th><th>Customer</th><th>Estimate</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.length ? filtered.map((repair) => { const balance = Math.max(0, repair.estimatedCost - repair.paidAmount); return <tr key={repair.id}><td><strong>{repair.repairNumber || "Repair"}</strong><span className="inventory-secondary">{repair.deviceName}</span></td><td>{repair.customerName}</td><td>{money(repair.estimatedCost)}</td><td>{money(repair.paidAmount)}</td><td><strong>{money(balance)}</strong></td><td><span className={`payment-status ${balance ? "due" : "paid"}`}>{balance ? "Payment due" : "Paid"}</span></td><td><button type="button" className="payment-action-button" onClick={() => setCreating(true)} disabled={!balance}>{balance ? "Collect" : "Complete"}</button></td></tr>; }) : <tr><td colSpan={7} className="customer-empty-cell"><div className="customer-empty"><div className="customer-empty-icon"><CreditCard /></div><h3>{search ? "No repairs found" : "No payment-ready repairs"}</h3><p>{search ? "Try a different search term." : "Repairs with charges will appear here."}</p></div></td></tr>}</tbody></table></div></div>
  </main></div>{creating && <PaymentModal repairs={repairs.filter((repair) => repair.estimatedCost > repair.paidAmount)} onClose={() => setCreating(false)} onSaved={paid} onError={setError} />}</div>;
}

function Summary({ label, value, icon, warning = false }: { label: string; value: string | number; icon: React.ReactNode; warning?: boolean }) { return <div className={`payment-summary ${warning ? "warning" : ""}`}><div className="payment-summary-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }

function PaymentModal({ repairs, onClose, onSaved, onError }: { repairs: PaymentRepair[]; onClose: () => void; onSaved: (repairId: string, amount: number) => void; onError: (message: string) => void }) {
  const [form, setForm] = useState<PaymentInput>({ repairId: repairs[0]?.id || "", partsCost: 0, gstRate: 18, method: "CASH", transactionReference: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const repair = repairs.find((entry) => entry.id === form.repairId);
  const subtotal = (repair?.estimatedCost || 0) + Number(form.partsCost || 0);
  const gst = subtotal * Number(form.gstRate || 0) / 100;
  const total = subtotal + gst;
  function update(field: keyof PaymentInput, value: string) { setForm((current) => ({ ...current, [field]: field === "partsCost" || field === "gstRate" ? Number(value) : value })); }
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); const result = await recordPaymentAction(form); if (result.error) { onError(result.error); setSaving(false); return; } onSaved(form.repairId, result.amount || total); }
  return <div className="customer-drawer-overlay"><aside className="customer-drawer payment-drawer"><div className="customer-drawer-header"><div><p className="dashboard-kicker">COLLECT PAYMENT</p><h2>New payment</h2><p className="customer-drawer-subtitle">Add parts, GST, and choose how the customer paid.</p></div><button type="button" className="customer-drawer-close" onClick={onClose} aria-label="Close payment form"><X size={20} /></button></div><form onSubmit={submit} className="customer-form">
    <div className="customer-form-field"><label>Repair</label><select value={form.repairId} onChange={(event) => update("repairId", event.target.value)} required><option value="">Select repair</option>{repairs.map((entry) => <option key={entry.id} value={entry.id}>{entry.repairNumber || "Repair"} · {entry.customerName}</option>)}</select></div>
    <div className="payment-charge-card"><div><span>Repair estimate</span><strong>{money(repair?.estimatedCost || 0)}</strong></div><div className="payment-charge-plus">+</div><div><span>Parts charges</span><strong>{money(Number(form.partsCost || 0))}</strong></div></div>
    <div className="customer-form-row"><Field label="Parts charges" type="number" min="0" step="0.01" value={String(form.partsCost)} onChange={(value) => update("partsCost", value)} /><Field label="GST (%)" type="number" min="0" step="0.01" value={String(form.gstRate)} onChange={(value) => update("gstRate", value)} /></div>
    <div className="payment-total"><span>GST amount</span><strong>{money(gst)}</strong><span>Total payable</span><b>{money(total)}</b></div>
    <div className="payment-methods"><label className={form.method === "CASH" ? "selected" : ""}><input type="radio" name="method" checked={form.method === "CASH"} onChange={() => setForm((current) => ({ ...current, method: "CASH" }))} /><Banknote size={17} /> Cash</label><label className={form.method === "UPI" ? "selected" : ""}><input type="radio" name="method" checked={form.method === "UPI"} onChange={() => setForm((current) => ({ ...current, method: "UPI" }))} /><CreditCard size={17} /> UPI</label></div>
    {form.method === "UPI" && <div className="customer-form-field"><label>UPI transaction reference *</label><input value={form.transactionReference || ""} onChange={(event) => update("transactionReference", event.target.value)} placeholder="Enter transaction ID" required /></div>}
    <div className="customer-form-field"><label>Notes</label><textarea rows={3} value={form.notes || ""} onChange={(event) => update("notes", event.target.value)} placeholder="Optional payment note" /></div><div className="customer-form-actions"><button type="button" className="customer-cancel-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="new-repair-button" disabled={saving || !repair}>{saving ? "Recording..." : "Record payment"}</button></div>
  </form></aside></div>;
}

function Field({ label, value, onChange, type, min, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; step?: string }) { return <div className="customer-form-field"><label>{label}</label><input type={type || "text"} min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }