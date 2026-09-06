"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, ShieldBan, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";

import DashboardHeader from "@/components/dashboard/header";
import DashboardSidebar from "@/components/dashboard/sidebar";
import Toast from "@/components/toast";
import type { User } from "@/lib/types";
import { deleteEmployeeAction, inviteEmployeeAction, suspendEmployeeAction, updateEmployeeAction, type EmployeeInput, type EmployeeItem } from "./actions";

function allowedRoles(role: string): EmployeeInput["role"][] {
  const normalized = role.toLowerCase();
  if (normalized === "super_admin") return ["ADMIN", "MANAGER", "EMPLOYEE"];
  if (normalized === "admin") return ["MANAGER", "EMPLOYEE"];
  if (normalized === "manager") return ["EMPLOYEE"];
  return [];
}

export default function EmployeesClient({ user, initialEmployees, initialError }: { user: User; initialEmployees: EmployeeItem[]; initialError?: string }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(initialError ? { message: initialError, tone: "error" } : null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeItem | null>(null);
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return query ? employees.filter((item) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(query)) : employees; }, [employees, search]);

  const assignableRoles = allowedRoles(String(user.role));
  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4500);
  }
  async function toggleSuspended(employee: EmployeeItem) {
    const result = await suspendEmployeeAction(employee.id, employee.status === "ACTIVE");
    if (result.error) { showToast(result.error, "error"); return; }
    setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, status: result.status || item.status } : item));
    showToast(`${employee.name} is now ${employee.status === "ACTIVE" ? "suspended" : "active"}.`);
  }
  async function removeEmployee(employee: EmployeeItem) {
    if (!window.confirm(`Delete ${employee.name}'s account? This cannot be undone.`)) return;
    const result = await deleteEmployeeAction(employee.id);
    if (result.error) { showToast(result.error, "error"); return; }
    setEmployees((current) => current.filter((item) => item.id !== employee.id));
    showToast(`${employee.name} was deleted.`);
  }
  return <div className="staff-dashboard"><DashboardSidebar user={user} /><div className="dashboard-main"><DashboardHeader user={user} /><main className="dashboard-content">
    <div className="dashboard-welcome"><div><p className="dashboard-kicker">TEAM MANAGEMENT</p><h1>Employees</h1><p>Invite staff and manage access to your repair workspace.</p></div><div className="customer-header-actions"><div className="customer-search-box"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees..." aria-label="Search employees" /></div><button type="button" className="new-repair-button" onClick={() => setDialogOpen(true)}><Plus size={16} /> Add employee</button></div></div>
    <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    {temporaryPassword && <div className="dashboard-card"><p><strong>Temporary password:</strong> <code>{temporaryPassword}</code></p><p>Share it securely with the employee and ask them to change it after signing in.</p></div>}
    <div className="module-overview-row"><div className="module-overview-card"><span>Total employees</span><strong>{employees.length}</strong></div><div className="module-overview-card"><span>Workspace access</span><strong>Managed</strong></div></div>
    <div className="dashboard-card customer-table-card"><div className="customer-table-toolbar"><span className="toolbar-count">{filtered.length} {filtered.length === 1 ? "employee" : "employees"}</span></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Employee</th><th>Email</th><th>Role</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead><tbody>{filtered.length ? filtered.map((employee) => <tr key={employee.id}><td><strong>{employee.name}</strong></td><td>{employee.email}</td><td><span className="module-status">{employee.role}</span></td><td><span className="module-status">{employee.status === "SUSPENDED" ? "Suspended" : "Active"}</span></td><td>{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString("en-IN") : "—"}</td><td><div className="table-actions"><button type="button" className="icon-button" onClick={() => setEditing(employee)} title="Edit employee" aria-label={`Edit ${employee.name}`}><Pencil size={16} /></button><button type="button" className="icon-button" onClick={() => toggleSuspended(employee)} title={employee.status === "ACTIVE" ? "Suspend employee" : "Restore employee"} aria-label={employee.status === "ACTIVE" ? `Suspend ${employee.name}` : `Restore ${employee.name}`}>{employee.status === "ACTIVE" ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}</button><button type="button" className="icon-button danger" onClick={() => removeEmployee(employee)} title="Delete employee" aria-label={`Delete ${employee.name}`}><Trash2 size={16} /></button></div></td></tr>) : <tr><td colSpan={6} className="customer-empty-cell"><div className="customer-empty"><div className="customer-empty-icon"><UserPlus /></div><h3>No employees yet</h3><p>Add your first team member to get started.</p><button type="button" className="customer-empty-button" onClick={() => setDialogOpen(true)}><Plus size={16} /> Add employee</button></div></td></tr>}</tbody></table></div></div>
  </main></div>{dialogOpen && <InviteEmployeeDialog roles={assignableRoles} onClose={() => setDialogOpen(false)} onError={(message) => showToast(message, "error")} onCreated={(employee, password) => { setEmployees((current) => [employee, ...current]); setTemporaryPassword(password || ""); setDialogOpen(false); showToast(password ? `${employee.name} was created. Temporary password: ${password}` : `${employee.name} was created successfully.`); }} />}{editing && <EditEmployeeDialog employee={editing} roles={assignableRoles} onClose={() => setEditing(null)} onError={(message) => showToast(message, "error")} onSaved={(employee) => { setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, ...employee, status: editing.status } : item)); setEditing(null); showToast(`${employee.name} was updated successfully.`); }} />}</div>;
}

function EditEmployeeDialog({ employee, roles, onClose, onError, onSaved }: { employee: EmployeeItem; roles: EmployeeInput["role"][]; onClose: () => void; onError: (message: string) => void; onSaved: (employee: EmployeeItem) => void }) {
  const [form, setForm] = useState<EmployeeInput>({ name: employee.name, email: employee.email, role: employee.role.toUpperCase() as EmployeeInput["role"] });
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); const result = await updateEmployeeAction(employee.id, form); if (result.error) { onError(result.error); setSaving(false); return; } if (result.employee) onSaved(result.employee); }
  return <div className="customer-dialog-overlay"><section className="customer-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-employee-title"><div className="customer-drawer-header"><div><p className="dashboard-kicker">TEAM ACCESS</p><h2 id="edit-employee-title">Edit employee</h2><p className="customer-drawer-subtitle">Update the employee account details.</p></div><button type="button" className="customer-drawer-close" onClick={onClose} aria-label="Close edit employee dialog"><X size={20} /></button></div><form className="customer-form" onSubmit={submit}><div className="customer-form-field"><label>Name *</label><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></div><div className="customer-form-field"><label>Email *</label><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></div><div className="customer-form-field"><label>Role</label><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as EmployeeInput["role"] }))}>{roles.map((role) => <option key={role} value={role}>{role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : "Employee"}</option>)}</select></div><div className="customer-form-actions"><button type="button" className="customer-cancel-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="customer-create-button" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div></form></section></div>;
}

function InviteEmployeeDialog({ roles, onClose, onError, onCreated }: { roles: EmployeeInput["role"][]; onClose: () => void; onError: (message: string) => void; onCreated: (employee: EmployeeItem, temporaryPassword?: string) => void }) {
  const [form, setForm] = useState<EmployeeInput>({ name: "", email: "", role: roles[0] || "EMPLOYEE" });
  const [saving, setSaving] = useState(false);
  function update(field: keyof EmployeeInput, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); const result = await inviteEmployeeAction(form); if (result.error) { onError(result.error); setSaving(false); return; } if (result.employee) onCreated(result.employee, result.temporaryPassword); }
  return <div className="customer-dialog-overlay"><section className="customer-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-employee-title"><div className="customer-drawer-header"><div><p className="dashboard-kicker">TEAM ACCESS</p><h2 id="invite-employee-title">Add employee</h2><p className="customer-drawer-subtitle">A temporary password will be created for this employee.</p></div><button type="button" className="customer-drawer-close" onClick={onClose} aria-label="Close employee dialog"><X size={20} /></button></div><form className="customer-form" onSubmit={submit}><div className="customer-form-field"><label>Name *</label><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Employee name" required /></div><div className="customer-form-field"><label>Email *</label><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="employee@example.com" required /></div><div className="customer-form-field"><label>Role</label><select value={form.role} onChange={(event) => update("role", event.target.value)}>{roles.map((role) => <option key={role} value={role}>{role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : "Employee"}</option>)}</select></div><div className="customer-form-actions"><button type="button" className="customer-cancel-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="customer-create-button" disabled={saving}>{saving ? "Creating..." : "Create employee"}</button></div></form></section></div>;
}