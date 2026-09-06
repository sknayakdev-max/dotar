import Link from "next/link";
import { ArrowUpRight, Plus, Search } from "lucide-react";

import DashboardHeader from "./header";
import DashboardSidebar from "./sidebar";
import type { User } from "@/lib/types";

export type ModuleRow = {
  id: string;
  primary: string;
  secondary?: string;
  values: string[];
  status?: string;
};

type Props = {
  user: User;
  kicker: string;
  title: string;
  description: string;
  columns: string[];
  rows: ModuleRow[];
  totalLabel: string;
  actionLabel?: string;
  actionHref?: string;
  error?: string;
};

export default function StaffModulePage({
  user,
  kicker,
  title,
  description,
  columns,
  rows,
  totalLabel,
  actionLabel,
  actionHref,
  error,
}: Props) {
  return (
    <div className="staff-dashboard">
      <DashboardSidebar user={user} />
      <div className="dashboard-main">
        <DashboardHeader user={user} />
        <main className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <p className="dashboard-kicker">{kicker}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {actionLabel && actionHref && (
              <Link className="new-repair-button" href={actionHref}>
                <Plus size={16} />
                {actionLabel}
              </Link>
            )}
          </div>

          {error && <div className="dashboard-card customer-error"><p className="error-message">{error}</p></div>}

          <div className="module-overview-row">
            <div className="module-overview-card"><span>Total records</span><strong>{rows.length}</strong></div>
            <div className="module-overview-card"><span>Workspace</span><strong>{totalLabel}</strong></div>
          </div>

          <div className="dashboard-card customer-table-card">
            <div className="customer-table-toolbar">
              <div className="customer-search-box module-search"><Search size={17} /><input placeholder={`Search ${title.toLowerCase()}...`} aria-label={`Search ${title}`} /></div>
              <span className="toolbar-count">{rows.length} {rows.length === 1 ? "record" : "records"}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>{columns[0]}</th>{columns.slice(1).map((column) => <th key={column}>{column}</th>)}<th>Open</th></tr></thead>
                <tbody>
                  {rows.length ? rows.map((row) => <tr key={row.id}><td><strong>{row.primary}</strong>{row.secondary && <span className="inventory-secondary">{row.secondary}</span>}</td>{row.values.map((value, index) => <td key={`${row.id}-${index}`}>{index === row.values.length - 1 && row.status ? <span className={`module-status ${row.status.toLowerCase().replaceAll(" ", "-")}`}>{value}</span> : value}</td>)}<td><Link className="module-open-link" href={actionHref || "#"}>Open <ArrowUpRight size={14} /></Link></td></tr>) : <tr><td colSpan={columns.length + 1} className="customer-empty-cell"><div className="customer-empty"><h3>No {title.toLowerCase()} yet</h3><p>Records will appear here when they are added.</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}