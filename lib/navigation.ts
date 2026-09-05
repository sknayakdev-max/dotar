import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  Laptop,
  LayoutDashboard,
  Package,
  Settings,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "./types";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const adminNavigation: NavigationItem[] = [
  { title: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
  { title: "Service Requests", href: "/staff/requests", icon: ClipboardList },
  { title: "Repairs", href: "/staff/repairs", icon: Wrench },
  { title: "Customers", href: "/staff/customers", icon: Users },
  { title: "Devices", href: "/staff/devices", icon: Laptop },
  { title: "Inventory", href: "/staff/inventory", icon: Package },
  { title: "Payments", href: "/staff/payments", icon: CreditCard },
  { title: "Invoices", href: "/staff/invoices", icon: FileText },
  { title: "Employees", href: "/staff/employees", icon: UserCog },
  { title: "Users", href: "/staff/users", icon: Users },
  { title: "Reports", href: "/staff/reports", icon: BarChart3 },
  { title: "Activity Logs", href: "/staff/activity", icon: Activity },
  { title: "Notifications", href: "/staff/notifications", icon: Bell },
  { title: "Settings", href: "/staff/settings", icon: Settings },
];

export const dashboardNavigation: Record<UserRole, NavigationItem[]> = {
  ADMIN: adminNavigation,
  super_admin: adminNavigation, // <-- Added missing required property
  MANAGER: adminNavigation.filter((item) =>
    [
      "Dashboard",
      "Service Requests",
      "Repairs",
      "Customers",
      "Devices",
      "Inventory",
      "Payments",
      "Invoices",
      "Employees",
      "Reports",
      "Notifications",
    ].includes(item.title)
  ),
  EMPLOYEE: adminNavigation.filter((item) =>
    ["Dashboard", "Repairs", "Customers", "Devices", "Notifications"].includes(
      item.title
    )
  ),
  USER: [],
};