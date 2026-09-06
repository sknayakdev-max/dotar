"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, MapPin, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import DashboardHeader from "@/components/dashboard/header";
import DashboardSidebar from "@/components/dashboard/sidebar";
import Toast from "@/components/toast";
import type { User } from "@/lib/types";

import {
  createInventoryAction,
  deleteInventoryAction,
  updateInventoryAction,
  type InventoryInput,
  type InventoryItem,
} from "./actions";

type Props = { user: User; initialItems: InventoryItem[]; initialError?: string };

const emptyForm: InventoryInput = {
  name: "", category: "", brand: "", sku: "", quantity: 0,
  minimumStock: 0, purchasePrice: 0, sellingPrice: 0, supplier: "", location: "",
};

export default function InventoryClient({ user, initialItems, initialError }: Props) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(initialError || "");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => [item.name, item.category, item.brand, item.sku, item.supplier]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [items, search]);

  async function remove(id: string) {
    if (!window.confirm("Remove this part from inventory?")) return;
    const result = await deleteInventoryAction(id);
    if (result.error) return setError(result.error);
    setItems((current) => current.filter((item) => item.id !== id));
    setSuccess("Part removed from inventory.");
  }

  function saveItem(item: InventoryItem) {
    const wasEditing = Boolean(editing);
    setItems((current) => current.some((entry) => entry.id === item.id)
      ? current.map((entry) => entry.id === item.id ? item : entry)
      : [...current, item].sort((a, b) => a.name.localeCompare(b.name)));
    setCreating(false);
    setEditing(null);
    setSuccess(wasEditing ? "Part updated successfully." : "Part added successfully.");
  }

  return (
    <div className="staff-dashboard">
      <DashboardSidebar user={user} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <p className="dashboard-kicker">PARTS & STOCK</p>
              <h1>Inventory</h1>
              <p>Keep repair parts, pricing, and stock levels organized.</p>
            </div>
            <div className="customer-header-actions">
              <div className="customer-search-box">
                <Search size={17} />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search parts..." aria-label="Search parts" />
              </div>
              <button type="button" className="new-repair-button" onClick={() => setCreating(true)}><Plus size={16} /> Add part</button>
            </div>
          </div>

          <Toast message={error} tone="error" onClose={() => setError("")} />
          <Toast message={success} onClose={() => setSuccess("")} />

          <div className="inventory-summary-row">
            <Summary label="Total parts" value={items.length} icon={<Package size={18} />} />
            <Summary label="Low stock" value={items.filter((item) => item.quantity <= item.minimumStock).length} icon={<AlertTriangle size={18} />} warning />
            <Summary label="Stock value" value={formatCurrency(items.reduce((total, item) => total + item.quantity * item.purchasePrice, 0))} icon={<span className="inventory-summary-symbol">$</span>} />
          </div>

          <div className="dashboard-card customer-table-card">
            <div className="customer-table-toolbar"><span className="toolbar-count">{filtered.length} {filtered.length === 1 ? "part" : "parts"}</span></div>
            <div className="overflow-x-auto">
              <table className="data-table inventory-table">
                <thead><tr><th>Part</th><th>SKU</th><th>Stock</th><th>Price</th><th>Location</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.length === 0 ? <tr><td colSpan={6} className="customer-empty-cell"><div className="customer-empty"><div className="customer-empty-icon"><Package /></div><h3>{search ? "No parts found" : "No inventory yet"}</h3><p>{search ? "Try a different search term." : "Add your first repair part to get started."}</p>{!search && <button type="button" className="customer-empty-button" onClick={() => setCreating(true)}><Plus size={16} /> Add part</button>}</div></td></tr> : filtered.map((item) => {
                    const lowStock = item.quantity <= item.minimumStock;
                    return <tr key={item.id}>
                      <td><strong>{item.name}</strong><span className="inventory-secondary">{[item.brand, item.category].filter(Boolean).join(" · ") || "Uncategorized"}</span></td>
                      <td>{item.sku || "—"}</td>
                      <td><span className={`inventory-stock ${lowStock ? "low" : ""}`}>{item.quantity}</span><span className="inventory-secondary">{lowStock ? "Reorder soon" : "In stock"}</span></td>
                      <td><strong>{formatCurrency(item.sellingPrice)}</strong><span className="inventory-secondary">Cost {formatCurrency(item.purchasePrice)}</span></td>
                      <td>{item.location ? <span className="inventory-location"><MapPin size={14} />{item.location}</span> : "—"}</td>
                      <td><div className="table-actions"><button type="button" className="icon-button" onClick={() => setEditing(item)} title="Edit part" aria-label="Edit part"><Pencil size={16} /></button><button type="button" className="icon-button danger" onClick={() => remove(item.id)} title="Remove part" aria-label="Remove part"><Trash2 size={16} /></button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      {(creating || editing) && <InventoryModal item={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={saveItem} />}
    </div>
  );
}

function Summary({ label, value, icon, warning = false }: { label: string; value: string | number; icon: React.ReactNode; warning?: boolean }) {
  return <div className={`inventory-summary ${warning ? "warning" : ""}`}><div className="inventory-summary-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function InventoryModal({ item, onClose, onSaved }: { item: InventoryItem | null; onClose: () => void; onSaved: (item: InventoryItem) => void }) {
  const [form, setForm] = useState<InventoryInput>(item ? { name: item.name, category: item.category || "", brand: item.brand || "", sku: item.sku || "", quantity: item.quantity, minimumStock: item.minimumStock, purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice, supplier: item.supplier || "", location: item.location || "" } : emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function update(field: keyof InventoryInput, value: string) { setForm((current) => ({ ...current, [field]: ["quantity", "minimumStock", "purchasePrice", "sellingPrice"].includes(field) ? Number(value) : value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    const result = item ? await updateInventoryAction(item.id, form) : await createInventoryAction(form);
    if (result.error) { setError(result.error); setSaving(false); return; }
    if (result.item) onSaved(result.item);
  }
  return <div className="customer-drawer-overlay"><aside className="customer-drawer inventory-drawer"><div className="customer-drawer-header"><div><p className="dashboard-kicker">INVENTORY</p><h2>{item ? "Update part" : "Add part"}</h2><p className="customer-drawer-subtitle">{item ? "Keep stock and pricing current." : "Add a repair part to your stock."}</p></div><button type="button" className="customer-drawer-close" onClick={onClose} aria-label="Close part form"><X size={20} /></button></div>
    <form onSubmit={submit} className="customer-form">
      {error && <div className="customer-form-error">{error}</div>}
      <div className="customer-form-row"><Field label="Part name" value={form.name} onChange={(value) => update("name", value)} placeholder="e.g. iPhone 12 screen" required /><Field label="SKU" value={form.sku || ""} onChange={(value) => update("sku", value)} placeholder="Optional SKU" /></div>
      <div className="customer-form-row"><Field label="Category" value={form.category || ""} onChange={(value) => update("category", value)} placeholder="Screens, batteries..." /><Field label="Brand" value={form.brand || ""} onChange={(value) => update("brand", value)} placeholder="Part brand" /></div>
      <div className="customer-form-row"><Field label="Quantity" type="number" min="0" value={String(form.quantity)} onChange={(value) => update("quantity", value)} required /><Field label="Minimum stock" type="number" min="0" value={String(form.minimumStock)} onChange={(value) => update("minimumStock", value)} /></div>
      <div className="customer-form-row"><Field label="Purchase price" type="number" min="0" step="0.01" value={String(form.purchasePrice)} onChange={(value) => update("purchasePrice", value)} /><Field label="Selling price" type="number" min="0" step="0.01" value={String(form.sellingPrice)} onChange={(value) => update("sellingPrice", value)} /></div>
      <div className="customer-form-row"><Field label="Supplier" value={form.supplier || ""} onChange={(value) => update("supplier", value)} placeholder="Supplier name" /><Field label="Location" value={form.location || ""} onChange={(value) => update("location", value)} placeholder="Shelf or cabinet" /></div>
      <div className="customer-form-actions"><button type="button" className="customer-cancel-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="new-repair-button" disabled={saving}>{saving ? "Saving..." : item ? "Update part" : "Add part"}</button></div>
    </form></aside></div>;
}

function Field({ label, value, onChange, placeholder, type = "text", min, step, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; min?: string; step?: string; required?: boolean }) {
  return <div className="customer-form-field"><label>{label}{required ? " *" : ""}</label><input type={type} min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} /></div>;
}

function formatCurrency(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }