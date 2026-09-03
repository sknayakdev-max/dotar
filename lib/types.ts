
export type ServiceRequestStatus = 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'REPAIR_TICKET_CREATED'
export type DeviceType = 'LAPTOP' | 'DESKTOP' | 'MONITOR' | 'PRINTER' | 'GAMING_PC' | 'GRAPHICS_CARD' | 'MOTHERBOARD' | 'HARD_DRIVE' | 'SSD' | 'RAM' | 'POWER_SUPPLY' | 'OTHER'
export type ContactMethod = 'PHONE' | 'EMAIL' | 'WHATSAPP'

export interface ServiceRequestInput {
  customerName: string
  phone: string
  email?: string
  deviceType: DeviceType
  brand?: string
  model?: string
  serialNumber?: string
  problemDescription: string
  additionalNotes?: string
  preferredContact: ContactMethod
}

export interface ServiceRequestRecord extends ServiceRequestInput {
  id: string
  requestNumber?: string
  userId?: string
  customerId?: string
  status: ServiceRequestStatus
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}


// types/types.ts

export type UserRole = 
  | "super_admin" 
  | "ADMIN" 
  | "MANAGER" 
  | "EMPLOYEE" 
  | "USER";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type RecentRepair = {
  id: string;
  repairNumber: string | null;
  status: string;
  priority: string;
  createdAt: string;
  customerName: string;
  deviceName: string;
};

export type ActivityItem = {
  id: string;
  action: string;
  entity: string | null;
  description: string | null;
  createdAt: string;
};

export type EmployeeWorkload = {
  id: string;
  name: string;
  repairs: number;
  active: number;
};

export type LowStockItem = {
  id: string;
  partName: string;
  quantity: number;
  minimumStock: number;
};

export type DashboardStats = {
  customers: number;
  devices: number;
  repairs: number;
  inProgressRepairs?: number;
  completedToday?: number;
  urgentRepairs?: number;
  pendingRequests: number;
  inventory: number;
  lowStock: number;
  invoices: number;
  notifications: number;
  payments: number;
  recentRepairs: RecentRepair[];
  recentActivity: ActivityItem[];
  employees: EmployeeWorkload[];
  lowStockItems: LowStockItem[];
};
export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};


export function isStaffRole(role: UserRole): boolean {
  return role === "super_admin" || role === "ADMIN" || role === "MANAGER" || role === "EMPLOYEE";
}

/**
 * Helper to check if a user has admin privileges.
 */
export function isAdminRole(role: UserRole): boolean {
  return role === "super_admin" || role === "ADMIN";
}