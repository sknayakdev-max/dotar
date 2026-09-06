"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/lib/types";

interface DashboardHeaderProps {
  user: User;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/auth");
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
        <Link
          href="/notifications"
          className="dashboard-icon-button"
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Link>

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
    case "STAFF":
      return "My Repair Dashboard";

    default:
      return "Dashboard";
  }
}