"use client";

import { useMemo, useState } from "react";
import { Plus, Search, UserPlus, X } from "lucide-react";

import DashboardHeader from "@/components/dashboard/header";
import DashboardSidebar from "@/components/dashboard/sidebar";
import type { User } from "@/lib/types";
import { inviteEmployeeAction, type EmployeeInput, type EmployeeItem } from "./actions";

function allowedRoles(role: string): EmployeeInput["role"][] {
  const normalized = role.toLowerCase();
  if (normalized === "super_admin") return ["ADMIN", "MANAGER", "EMPLOYEE"];
  if (normalized === "admin") return ["MANAGER", "EMPLOYEE"];
  if (normalized === "manager") return ["EMPLOYEE"];
  return [];
}

export default function EmployeesClient({ user, initialEmployees, initialError }: { user: User; initialEmployees: EmployeeItem[]; initialError?: string }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(initialError || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return query ? employees.filter((item) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(query)) : employees; }, [employees, search]);

  const assignableRoles = allowedRoles(String(user.role));
  return <div className="staff-dashboard"><DashboardSidebar user={user} /><div className="dashboard-main"><DashboardHeader user={user} /><main className="dashboard-content">
    <div className="dashboard-welcome"><div><p className="dashboard-kicker">TEAM MANAGEMENT</p><h1>Employees</h1><p>Invite staff and manage access to your repair workspace.</p></div><div className="customer-header-actions"><div className="customer-search-box"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees..." aria-label="Search employees" /></div><button type="button" className="new-repair-button" onClick={() => setDialogOpen(true)}><Plus size={16} /> Add employee</button></div></div>
    {error && <div className="dashboard-card customer-error"><p className="error-message">{error}</p></div>}
    <div className="module-overview-row"><div className="module-overview-card"><span>Total employees</span><strong>{employees.length}</strong></div><div className="module-overview-card"><span>Workspace access</span><strong>Managed</strong></div></div>
    <div className="dashboard-card customer-table-card"><div className="customer-table-toolbar"><span className="toolbar-count">{filtered.length} {filtered.length === 1 ? "employee" : "employees"}</span></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Employee</th><th>Email</th><th>Role</th><th>Status</th><th>Added</th></tr></thead><tbody>{filtered.length ? filtered.map((employee) => <tr key={employee.id}><td><strong>{employee.name}</strong></td><td>{employee.email}</td><td><span className="module-status">{employee.role}</span></td><td><span className="module-status">Invited</span></td><td>{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString("en-IN") : "—"}</td></tr>) : <tr><td colSpan={5} className="customer-empty-cell"><div className="customer-empty"><div className="customer-empty-icon"><UserPlus /></div><h3>No employees yet</h3><p>Invite your first team member to get started.</p><button type="button" className="customer-empty-button" onClick={() => setDialogOpen(true)}><Plus size={16} /> Add employee</button></div></td></tr>}</tbody></table></div></div>
  </main></div>{dialogOpen && <InviteEmployeeDialog roles={assignableRoles} onClose={() => setDialogOpen(false)} onError={setError} onCreated={(employee) => { setEmployees((current) => [employee, ...current]); setDialogOpen(false); }} />}</div>;
}

function InviteEmployeeDialog({ roles, onClose, onError, onCreated }: { roles: EmployeeInput["role"][]; onClose: () => void; onError: (message: string) => void; onCreated: (employee: EmployeeItem) => void }) {
  const [form, setForm] = useState<EmployeeInput>({ name: "", email: "", role: roles[0] || "EMPLOYEE" });
  const [saving, setSaving] = useState(false);
  function update(field: keyof EmployeeInput, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); const result = await inviteEmployeeAction(form); if (result.error) { onError(result.error); setSaving(false); return; } if (result.employee) onCreated(result.employee); }
  return <div className="customer-dialog-overlay"><section className="customer-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-employee-title"><div className="customer-drawer-header"><div><p className="dashboard-kicker">TEAM ACCESS</p><h2 id="invite-employee-title">Add employee</h2><p className="customer-drawer-subtitle">An invitation email will be sent to this employee.</p></div><button type="button" className="customer-drawer-close" onClick={onClose} aria-label="Close employee dialog"><X size={20} /></button></div><form className="customer-form" onSubmit={submit}><div className="customer-form-field"><label>Name *</label><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Employee name" required /></div><div className="customer-form-field"><label>Email *</label><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="employee@example.com" required /></div><div className="customer-form-field"><label>Role</label><select value={form.role} onChange={(event) => update("role", event.target.value)}>{roles.map((role) => <option key={role} value={role}>{role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : "Employee"}</option>)}</select></div><div className="customer-form-actions"><button type="button" className="customer-cancel-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="customer-create-button" disabled={saving}>{saving ? "Sending..." : "Send invitation"}</button></div></form></section></div>;
}