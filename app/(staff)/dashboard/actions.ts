// app/(staff)/dashboard/actions.ts

"server-only";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type {
  DashboardStats,
  User,
  UserRole,
  AdminUserItem,
} from "@/lib/types";

import { isAdminRole } from "@/lib/types";

/* =========================================================
   EMPTY DASHBOARD STATS
========================================================= */

const emptyStats: DashboardStats = {
  customers: 0,
  devices: 0,
  repairs: 0,
  inProgressRepairs: 0,
  completedToday: 0,
  urgentRepairs: 0,
  pendingRequests: 0,
  inventory: 0,
  lowStock: 0,
  invoices: 0,
  notifications: 0,
  payments: 0,
  recentRepairs: [],
  recentActivity: [],
  employees: [],
  lowStockItems: [],
};

/* =========================================================
   AUTHENTICATED USER
========================================================= */

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, role"
      )
      .eq("id", authUser.id)
      .single();

    if (profileError) {
      console.error(
        "Error fetching profile from database:",
        profileError
      );
    }

    const dbRole = profile?.role
      ? String(profile.role).toLowerCase()
      : "user";

    return {
      id: authUser.id,

      email:
        authUser.email ||
        profile?.email ||
        "",

      name:
        profile?.full_name ||
        authUser.email ||
        "Staff Member",

      role: dbRole as UserRole,
    };
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return null;
  }
}

/* =========================================================
   DASHBOARD STATS
========================================================= */

export async function getDashboardStatsAction(): Promise<{
  data: DashboardStats;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const user =
      await getAuthenticatedUser();

    const normalizedRole = user?.role
      ? String(user.role).toLowerCase()
      : "";

    /*
     * Block normal users.
     */
    if (
      !user ||
      normalizedRole === "user" ||
      normalizedRole === ""
    ) {
      return {
        data: emptyStats,
        error: "Unauthorized access",
      };
    }

    /*
     * Start of today.
     */
    const startOfTodayISO =
      new Date(
        new Date().setHours(
          0,
          0,
          0,
          0
        )
      ).toISOString();

    /* =====================================================
       EMPLOYEE DASHBOARD
    ===================================================== */

    if (
      normalizedRole === "employee" ||
      normalizedRole === "staff"
    ) {
      const [
        assignedRes,
        inProgressRes,
        completedTodayRes,
        urgentRes,
        recentRepairsRes,
      ] = await Promise.all([

        /*
         * Assigned repairs
         */
        supabase
          .from("repairs")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "assigned_to_id",
            user.id
          )
          .neq(
            "status",
            "COMPLETED"
          ),

        /*
         * In progress
         */
        supabase
          .from("repairs")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "assigned_to_id",
            user.id
          )
          .eq(
            "status",
            "IN_PROGRESS"
          ),

        /*
         * Completed today
         */
        supabase
          .from("repairs")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "assigned_to_id",
            user.id
          )
          .eq(
            "status",
            "COMPLETED"
          )
          .gte(
            "updated_at",
            startOfTodayISO
          ),

        /*
         * Urgent repairs
         */
        supabase
          .from("repairs")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "assigned_to_id",
            user.id
          )
          .eq(
            "priority",
            "URGENT"
          )
          .neq(
            "status",
            "COMPLETED"
          ),

        /*
         * Recent repairs
         */
        supabase
          .from("repairs")
          .select(
            `
              id,
              repair_number,
              status,
              priority,
              created_at,
              customers(name),
              devices(name)
            `
          )
          .eq(
            "assigned_to_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(5),
      ]);

      return {
        data: {
          ...emptyStats,

          repairs:
            assignedRes.count || 0,

          inProgressRepairs:
            inProgressRes.count || 0,

          completedToday:
            completedTodayRes.count || 0,

          urgentRepairs:
            urgentRes.count || 0,

          recentRepairs:
            (recentRepairsRes.data || [])
              .map((repair: any) => ({
                id: repair.id,

                repairNumber:
                  repair.repair_number ??
                  repair.id,

                status:
                  repair.status,

                priority:
                  repair.priority,

                createdAt:
                  repair.created_at,

                customerName:
                  repair.customers?.name ||
                  "Unknown",

                deviceName:
                  repair.devices?.name ||
                  "Unknown",
              })),
        },
      };
    }

    /* =====================================================
       ADMIN / MANAGER DASHBOARD
    ===================================================== */

    const [
      customersRes,
      repairsRes,
      pendingRequestsRes,
      paymentsRes,
      recentRepairsRes,
      recentActivityRes,
      lowStockRes,
      employeesRes,
    ] = await Promise.all([

      /*
       * Customers
       */
      supabase
        .from("customers")
        .select("*", {
          count: "exact",
          head: true,
        }),

      /*
       * Active repairs
       */
      supabase
        .from("repairs")
        .select("*", {
          count: "exact",
          head: true,
        })
        .neq(
          "status",
          "COMPLETED"
        ),

      /*
       * Pending service requests
       */
      supabase
        .from("service_requests")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "PENDING"
        ),

      /*
       * Today's payments
       */
      supabase
        .from("payments")
        .select("amount")
        .eq(
          "status",
          "COMPLETED"
        )
        .gte(
          "created_at",
          startOfTodayISO
        ),

      /*
       * Recent repairs
       */
      supabase
        .from("repairs")
        .select(
          `
            id,
            repair_number,
            status,
            priority,
            created_at,
            customers(name),
            devices(name)
          `
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(5),

      /*
       * Recent activity
       */
      supabase
        .from("activity_logs")
        .select(
          `
            id,
            action,
            entity,
            description,
            created_at
          `
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(5),

      /*
       * Inventory
       */
      supabase
        .from("inventory_items")
        .select(
          `
            id,
            name,
            quantity,
            minimum_stock
          `
        )
        .limit(20),

      /*
       * Employees
       */
      supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            repairs:repairs!assigned_to_id(status)
          `
        )
        .in(
          "role",
          [
            "EMPLOYEE",
            "employee",
            "STAFF",
            "staff",
          ]
        ),
    ]);

    /* =====================================================
       PAYMENTS
    ===================================================== */

    const totalPayments =
      (paymentsRes.data || [])
        .reduce(
          (
            total,
            payment
          ) =>
            total +
            Number(
              payment.amount || 0
            ),
          0
        );

    /* =====================================================
       LOW STOCK
    ===================================================== */

    const lowStockItems =
      (lowStockRes.data || [])
        .filter(
          (item) =>
            item.quantity <=
            item.minimum_stock
        )
        .slice(0, 5);

    /* =====================================================
       RETURN DASHBOARD
    ===================================================== */

    return {
      data: {

        ...emptyStats,

        customers:
          customersRes.count || 0,

        repairs:
          repairsRes.count || 0,

        pendingRequests:
          pendingRequestsRes.count || 0,

        payments:
          totalPayments,

        lowStock:
          lowStockItems.length,

        recentRepairs:
          (
            recentRepairsRes.data || []
          ).map(
            (repair: any) => ({
              id: repair.id,

              repairNumber:
                repair.repair_number ??
                repair.id,

              status:
                repair.status,

              priority:
                repair.priority,

              createdAt:
                repair.created_at,

              customerName:
                repair.customers?.name ||
                "Unknown",

              deviceName:
                repair.devices?.name ||
                "Unknown",
            })
          ),

        recentActivity:
          (
            recentActivityRes.data ||
            []
          ).map(
            (activity: any) => ({
              id: activity.id,

              action:
                activity.action,

              entity:
                activity.entity,

              description:
                activity.description,

              createdAt:
                activity.created_at,
            })
          ),

        lowStockItems:
          lowStockItems.map(
            (item) => ({
              id: item.id,

              partName:
                item.name,

              quantity:
                item.quantity,

              minimumStock:
                item.minimum_stock,
            })
          ),

        employees:
          (
            employeesRes.data ||
            []
          ).map(
            (employee: any) => {

              const repairs =
                employee.repairs ||
                [];

              const openRepairs =
                repairs.filter(
                  (repair: any) =>
                    repair.status !==
                    "COMPLETED"
                );

              return {
                id:
                  employee.id,

                name:
                  employee.full_name ||
                  "Employee",

                repairs:
                  openRepairs.length,

                active:
                  openRepairs.filter(
                    (repair: any) =>
                      repair.status ===
                      "IN_PROGRESS"
                  ).length,
              };
            }
          ),
      },
    };
  } catch (error) {
    console.error(
      "Dashboard action error:",
      error
    );

    return {
      data: emptyStats,
      error:
        "Failed to fetch dashboard stats",
    };
  }
}

/* =========================================================
   ADMIN USERS
========================================================= */

export async function getAdminUsersAction(): Promise<
  AdminUserItem[]
> {
  const user =
    await getAuthenticatedUser();

  if (
    !user ||
    !isAdminRole(user.role)
  ) {
    return [];
  }

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        email,
        role,
        created_at
      `
    )
    .in(
      "role",
      [
        "admin",
        "super_admin",
        "manager",
        "ADMIN",
        "SUPER_ADMIN",
        "MANAGER",
      ]
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      "Error fetching admin profiles:",
      error
    );

    return [];
  }

  return (
    data || []
  ).map(
    (item: any) => ({
      id:
        item.id,

      name:
        item.full_name ||
        "Admin",

      email:
        item.email,

      role:
        item.role as UserRole,

      createdAt:
        item.created_at,
    })
  );
}

/* =========================================================
   DELETE ADMIN USER
========================================================= */

export async function deleteAdminUserAction(
  targetUserId: string
) {
  const user =
    await getAuthenticatedUser();

  const normalizedRole =
    user?.role
      ? String(
          user.role
        ).toLowerCase()
      : "";

  /*
   * Only Super Admin
   */
  if (
    !user ||
    normalizedRole !==
      "super_admin"
  ) {
    return {
      error:
        "Permission denied. Only Super Admin can delete admins.",
    };
  }

  /*
   * Prevent self-delete
   */
  if (
    targetUserId ===
    user.id
  ) {
    return {
      error:
        "You cannot delete your own account.",
    };
  }

  const supabase =
    await createClient();

  const {
    error,
  } = await supabase
    .from("profiles")
    .delete()
    .eq(
      "id",
      targetUserId
    );

  if (error) {
    return {
      error:
        error.message,
    };
  }

  revalidatePath(
    "/staff/dashboard"
  );

  return {
    success: true,
  };
}