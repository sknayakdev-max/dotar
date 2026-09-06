"use client";

import { useEffect, useState } from "react";
import { Bell, Check, KeyRound, Moon, Save, Sun, UserRound } from "lucide-react";

import DashboardHeader from "@/components/dashboard/header";
import DashboardSidebar from "@/components/dashboard/sidebar";
import Toast from "@/components/toast";
import type { User } from "@/lib/types";
import { updatePasswordAction, updateProfileNameAction } from "./actions";

const SETTINGS_KEY = "fixdesk-settings";

type Preferences = {
  theme: "light" | "dark";
  gstRate: string;
  alertRefresh: string;
};

const defaultPreferences: Preferences = {
  theme: "light",
  gstRate: "18",
  alertRefresh: "30",
};

export default function SettingsClient({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.theme]);

  function updatePreference<K extends keyof Preferences>(field: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [field]: value }));
    if (field === "theme") document.documentElement.dataset.theme = value;
    setSaved(false);
  }

  function savePreferences() {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const result = await updateProfileNameAction(name);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const result = await updatePasswordAction(currentPassword, newPassword, confirmPassword);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  return <div className="staff-dashboard"><DashboardSidebar user={{ ...user, name }} /><div className="dashboard-main"><DashboardHeader user={{ ...user, name }} /><main className="dashboard-content">
    <div className="dashboard-welcome"><div><p className="dashboard-kicker">WORKSPACE SETTINGS</p><h1>Settings</h1><p>Manage your profile, appearance, and repair payment defaults.</p></div></div>
    <Toast message={error} tone="error" onClose={() => setError("")} />
    <div className="settings-grid">
      <section className="dashboard-card settings-section"><div className="settings-section-heading"><span className="settings-icon"><UserRound size={18} /></span><div><h2>Profile</h2><p>Keep the name shown across your workspace up to date.</p></div></div><form className="settings-form" onSubmit={saveProfile}><label>Display name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Email<input value={user.email} readOnly /></label><button className="new-repair-button" type="submit"><Save size={15} /> Save profile</button></form></section>
      <section className="dashboard-card settings-section"><div className="settings-section-heading"><span className="settings-icon"><KeyRound size={18} /></span><div><h2>Password</h2><p>Verify your current password before setting a new one.</p></div></div><form className="settings-form" onSubmit={savePassword}><label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label><label>New password<input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label><button className="new-repair-button" type="submit"><KeyRound size={15} /> Update password</button></form></section>
      <section className="dashboard-card settings-section"><div className="settings-section-heading"><span className="settings-icon"><Sun size={18} /></span><div><h2>Appearance</h2><p>Choose the interface theme for this browser.</p></div></div><div className="theme-toggle"><button type="button" className={preferences.theme === "light" ? "selected" : ""} onClick={() => updatePreference("theme", "light")}><Sun size={16} /> Light</button><button type="button" className={preferences.theme === "dark" ? "selected" : ""} onClick={() => updatePreference("theme", "dark")}><Moon size={16} /> Dark</button></div></section>
      <section className="dashboard-card settings-section"><div className="settings-section-heading"><span className="settings-icon"><Bell size={18} /></span><div><h2>Operations</h2><p>Set sensible defaults for alerts and payment collection.</p></div></div><div className="settings-form"><label>Default GST rate (%)<input type="number" min="0" max="100" step="0.01" value={preferences.gstRate} onChange={(event) => updatePreference("gstRate", event.target.value)} /></label><label>Alert refresh interval<select value={preferences.alertRefresh} onChange={(event) => updatePreference("alertRefresh", event.target.value)}><option value="15">Every 15 seconds</option><option value="30">Every 30 seconds</option><option value="60">Every minute</option></select></label></div></section>
    </div>
    <div className="settings-save-row"><button type="button" className="new-repair-button" onClick={savePreferences}>{saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save preferences</>}</button></div>
  </main></div></div>;
}

function loadPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences;
  const stored = window.localStorage.getItem(SETTINGS_KEY);
  if (!stored) return defaultPreferences;
  try {
    return { ...defaultPreferences, ...JSON.parse(stored) } as Preferences;
  } catch {
    window.localStorage.removeItem(SETTINGS_KEY);
    return defaultPreferences;
  }
}