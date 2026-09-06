"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bell, Search, Wrench, Package, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/lib/types";

interface DashboardHeaderProps {
  user: User;
}

type AlertItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  type: "request" | "stock";
};

type RequestAlertRow = {
  id: string;
  request_number: string | null;
  customer_name: string;
};

type StockAlertRow = {
  id: string;
  name: string;
  quantity: number;
  minimum_stock: number;
};

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadAlerts() {
      const [{ data: requests }, { data: inventory }] = await Promise.all([
        supabase
          .from("service_requests")
          .select("id, request_number, customer_name, created_at")
          .eq("status", "PENDING_REVIEW")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("inventory_items")
          .select("id, name, quantity, minimum_stock")
          .is("deleted_at", null)
          .order("quantity", { ascending: true })
          .limit(10),
      ]);

      if (!active) return;

      const requestAlerts: AlertItem[] = (requests as RequestAlertRow[] || []).map((request) => ({
        id: `request-${request.id}`,
        title: "New repair request",
        detail: `${request.request_number || "Request"} · ${request.customer_name}`,
        href: "/service-requests",
        type: "request",
      }));
      const stockAlerts: AlertItem[] = (inventory as StockAlertRow[] || [])
        .filter((item) => item.quantity <= item.minimum_stock)
        .slice(0, 5)
        .map((item) => ({
          id: `stock-${item.id}`,
          title: "Low stock",
          detail: `${item.name} · ${item.quantity} remaining`,
          href: "/inventory",
          type: "stock",
        }));

      setAlerts([...requestAlerts, ...stockAlerts]);
    }

    loadAlerts();
    let refreshInterval = 30;
    try {
      const stored = window.localStorage.getItem("fixdesk-settings");
      if (stored) {
        refreshInterval = Number(JSON.parse(stored).alertRefresh) || 30;
      }
    } catch {
      refreshInterval = 30;
    }
    const timer = window.setInterval(loadAlerts, refreshInterval * 1000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-title">
        <p>
          {getGreeting()}, {getFirstName(user.name)}
        </p>

        <h2>{getDashboardTitle(user.role)}</h2>
      </div>

      <div className="dashboard-header-actions">
        {/* Search */}
        <div className="dashboard-search">
          <Search size={17} className="text-slate-400" />

          <input
            type="search"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>

        {/* Notification */}
        <div className="dashboard-alerts">
          <button
            onClick={() => setAlertsOpen((open) => !open)}
            className="dashboard-icon-button"
            aria-label={`Open alerts${alerts.length ? ` (${alerts.length})` : ""}`}
            aria-expanded={alertsOpen}
            type="button"
          >
            <Bell size={20} />
            {alerts.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
          </button>

          {alertsOpen && (
            <div className="dashboard-alert-menu">
              <div className="dashboard-alert-header">
                <div><strong>Alerts</strong><span>{alerts.length ? `${alerts.length} need attention` : "All caught up"}</span></div>
                <button type="button" onClick={() => setAlertsOpen(false)} aria-label="Close alerts"><X size={16} /></button>
              </div>
              {alerts.length ? alerts.map((alert) => (
                <button key={alert.id} type="button" className="dashboard-alert-item" onClick={() => router.push(alert.href)}>
                  <span className={`dashboard-alert-icon ${alert.type}`}>
                    {alert.type === "request" ? <Wrench size={15} /> : <Package size={15} />}
                  </span>
                  <span><strong>{alert.title}</strong><small>{alert.detail}</small></span>
                </button>
              )) : <p className="dashboard-alert-empty">No new repair requests or stock warnings.</p>}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="dashboard-profile">
          <button
            className="dashboard-avatar"
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
            onClick={() => setProfileOpen((open) => !open)}
            type="button"
          >
            {getInitial(user.name)}
          </button>

          {profileOpen ? (
            <div className="dashboard-profile-menu">
              <p>{user.name}</p>

              <span>{user.email}</span>

              <b>{user.role}</b>

              <button
                className="dashboard-menu-logout"
                onClick={handleLogout}
                disabled={loggingOut}
                type="button"
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getFirstName(name: string) {
  const firstName = name.trim().split(/\s+/)[0];

  return firstName || "User";
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function getDashboardTitle(role: UserRole | string) {
  const normalizedRole = role ? String(role).toUpperCase() : "";

  switch (normalizedRole) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "Admin Dashboard";

    case "MANAGER":
      return "Manager Dashboard";

    case "EMPLOYEE":
      return "My Repair Dashboard";

    default:
      return "Dashboard";
  }
}