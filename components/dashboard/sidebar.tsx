"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  BarChart3,
  ClipboardList,
  CreditCard,
  FileText,
  Laptop,
  Package,
  Settings,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

import type { User, UserRole } from "@/lib/types";

type NavigationItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
};

const adminItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/repairs", label: "Repairs", icon: Wrench },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/devices", label: "Devices", icon: Laptop },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/employees", label: "Employees", icon: UserCog },
  { href: "/users", label: "Users", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/activity", label: "Activity Logs", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

const managerItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/service-requests", label: "Service Requests", icon: ClipboardList },
  { href: "/repairs", label: "Repairs", icon: Wrench },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/devices", label: "Devices", icon: Laptop },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/employees", label: "Employees", icon: UserCog },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const employeeItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/service-requests", label: "Service Requests", icon: ClipboardList },
  { href: "/repairs", label: "Repairs", icon: Wrench },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/devices", label: "Devices", icon: Laptop },
];

const navigation: Record<string, NavigationItem[]> = {
  ADMIN: adminItems,
  SUPER_ADMIN: adminItems,
  MANAGER: managerItems,
  EMPLOYEE: employeeItems,
  STAFF: employeeItems,
  USER: [],
};

interface DashboardSidebarProps {
  user: User;
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname() || "";

  // Normalize role string to uppercase so 'staff', 'admin', 'super_admin' lookup cleanly
  const normalizedRole = user?.role ? String(user.role).toUpperCase() : "USER";

  const items = navigation[normalizedRole] || [];

  return (
    <aside className="dashboard-sidebar">
      {/* Brand */}
      <div className="dashboard-sidebar-brand">
        <Link href="/dashboard">
          <span>FixDesk</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className="dashboard-sidebar-nav"
        aria-label="Staff navigation"
      >
        {items.map((item: NavigationItem) => {
          const Icon = item.icon;

          const isDashboard = item.href === "/dashboard";

          const isActive = isDashboard
            ? pathname === "/staff/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "dashboard-nav-item active"
                  : "dashboard-nav-item"
              }
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="dashboard-sidebar-footer">
        <span>{user?.role}</span>
      </div>
    </aside>
  );
}