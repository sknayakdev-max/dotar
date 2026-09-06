import {
  Activity,
  BarChart3,
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
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Service Requests", href: "/service-requests", icon: ClipboardList },
  { title: "Repairs", href: "/repairs", icon: Wrench },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Devices", href: "/devices", icon: Laptop },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Payments", href: "/payments", icon: CreditCard },
  { title: "Invoices", href: "/invoices", icon: FileText },
  { title: "Employees", href: "/employees", icon: UserCog },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Activity Logs", href: "/activity", icon: Activity },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const dashboardNavigation: Record<UserRole, NavigationItem[]> = {
  ADMIN: adminNavigation,
  super_admin: adminNavigation,
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
    ].includes(item.title)
  ),
  EMPLOYEE: adminNavigation.filter((item) =>
    ["Dashboard", "Repairs", "Customers", "Devices"].includes(
      item.title
    )
  ),
};