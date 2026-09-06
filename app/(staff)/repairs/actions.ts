"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "../dashboard/actions";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/* =========================================================
   TYPES
========================================================= */

export type RepairItem = {
  id: string;

  repairNumber: string | null;

  customerId: string;
  customerName: string;

  deviceId: string | null;
  deviceName: string;

  assignedToId: string | null;
  assignedToName: string;

  status: string;
  priority: string;

  problemDescription: string | null;
  diagnosis: string | null;

  initialCondition: string | null;
  accessoriesReceived: string | null;

  estimatedCost: number;
  advancePayment: number;

  expectedCompletionDate: string | null;

  customerNotes: string | null;
  internalNotes: string | null;

  createdAt: string;
  updatedAt: string;
};

export type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

export type DeviceOption = {
  id: string;
  name: string;
  customerId: string | null;
};

export type EmployeeOption = {
  id: string;
  name: string;
  role: string;
};

export type RepairFormData = {
  customers: CustomerOption[];
  devices: DeviceOption[];
  employees: EmployeeOption[];
};

export type RepairForm = {
  repairNumber: string;

  customerId: string;
  deviceId: string;
  assignedToId: string;

  problemDescription: string;
  diagnosis: string;

  initialCondition: string;
  accessoriesReceived: string;

  priority: string;
  status: string;

  estimatedCost: string;
  advancePayment: string;

  expectedCompletionDate: string;

  customerNotes: string;
  internalNotes: string;
};

/* =========================================================
   HELPERS
========================================================= */

function emptyFormData(): RepairFormData {
  return {
    customers: [],
    devices: [],
    employees: [],
  };
}

function normalizeRole(
  role: unknown
) {
  return role
    ? String(role).toLowerCase()
    : "";
}

function isAllowedRole(
  role: unknown
) {
  const normalized =
    normalizeRole(role);

  return (
    normalized !== "" &&
    normalized !== "user"
  );
}

function mapRepair(
  repair: any,
  employeeMap?: Map<string, string>
): RepairItem {
  const assignedToId =
    repair.assigned_to_id || null;

  return {
    id: repair.id,

    repairNumber:
      repair.repair_number || null,

    customerId:
      repair.customer_id,

    customerName:
      repair.customers?.name ||
      "Unknown customer",

    deviceId:
      repair.device_id || null,

    deviceName:
      repair.devices?.name ||
      "No device",

    assignedToId,

    assignedToName:
      assignedToId
        ? employeeMap?.get(
            assignedToId
          ) || "Unassigned"
        : "Unassigned",

    status:
      repair.status ||
      "RECEIVED",

    priority:
      repair.priority ||
      "NORMAL",

    problemDescription:
      repair.problem_description ||
      null,

    diagnosis:
      repair.diagnosis ||
      null,

    initialCondition:
      repair.initial_condition ||
      null,

    accessoriesReceived:
      repair.accessories_received ||
      null,

    estimatedCost:
      Number(
        repair.estimated_cost || 0
      ),

    advancePayment:
      Number(
        repair.advance_payment || 0
      ),

    expectedCompletionDate:
      repair.expected_completion_date ||
      null,

    customerNotes:
      repair.customer_notes ||
      null,

    internalNotes:
      repair.internal_notes ||
      null,

    createdAt:
      repair.created_at,

    updatedAt:
      repair.updated_at,
  };
}

/* =========================================================
   GET REPAIRS
========================================================= */

export async function getRepairsAction(): Promise<{
  data: RepairItem[];
  error?: string;
}> {
  try {
    const user =
      await getAuthenticatedUser();

    if (
      !user ||
      !isAllowedRole(user.role)
    ) {
      return {
        data: [],
        error:
          "Unauthorized access",
      };
    }

    const supabase =
      await createClient();

    const role =
      normalizeRole(user.role);

    /* -------------------------------------------------------
       IMPORTANT:
       DO NOT use:

       profiles!assigned_to_id

       because there is no FK relationship between
       repairs.assigned_to_id and profiles.id.
    ------------------------------------------------------- */

    let query = supabase
      .from("repairs")
      .select(`
        id,
        repair_number,
        customer_id,
        device_id,
        assigned_to_id,
        status,
        priority,
        problem_description,
        diagnosis,
        initial_condition,
        accessories_received,
        estimated_cost,
        advance_payment,
        expected_completion_date,
        customer_notes,
        internal_notes,
        created_at,
        updated_at,
        customers (
          id,
          name
        ),
        devices (
          id,
          name
        )
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    /*
     * Employees only see their assigned repairs.
     */
    if (role === "employee") {
      query = query.eq(
        "assigned_to_id",
        user.id
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Error fetching repairs:",
        error
      );

      return {
        data: [],
        error: error.message,
      };
    }

    const repairRows =
      data || [];

    /* -------------------------------------------------------
       GET ASSIGNED EMPLOYEE IDS
    ------------------------------------------------------- */

    const employeeIds =
      Array.from(
        new Set(
          repairRows
            .map(
              (repair: any) =>
                repair.assigned_to_id
            )
            .filter(Boolean)
        )
      );

    const employeeMap =
      new Map<string, string>();

    /* -------------------------------------------------------
       GET EMPLOYEE PROFILES SEPARATELY
    ------------------------------------------------------- */

    if (
      employeeIds.length > 0
    ) {
      const {
        data: employees,
        error:
          employeeError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name"
        )
        .in(
          "id",
          employeeIds
        );

      if (employeeError) {
        console.error(
          "Error fetching employees:",
          employeeError
        );
      } else {
        for (
          const employee of
            employees || []
        ) {
          employeeMap.set(
            employee.id,
            employee.full_name ||
              "Employee"
          );
        }
      }
    }

    /* -------------------------------------------------------
       MAP REPAIRS
    ------------------------------------------------------- */

    return {
      data: repairRows.map(
        (repair: any) =>
          mapRepair(
            repair,
            employeeMap
          )
      ),
    };
  } catch (error) {
    console.error(
      "Repairs action error:",
      error
    );

    return {
      data: [],
      error:
        "Failed to fetch repairs",
    };
  }
}

/* =========================================================
   GET FORM DATA
========================================================= */

export async function getRepairFormDataAction(): Promise<{
  customers: CustomerOption[];
  devices: DeviceOption[];
  employees: EmployeeOption[];
  error?: string;
}> {
  try {
    const user =
      await getAuthenticatedUser();

    if (
      !user ||
      !isAllowedRole(user.role)
    ) {
      return {
        ...emptyFormData(),
        error:
          "Unauthorized access",
      };
    }

    const supabase =
      await createClient();
    const profileClient =
      createAdminClient() || supabase;

    const [
      customersResult,
      devicesResult,
      employeesResult,
    ] = await Promise.all([
      /* Customers */
      supabase
        .from("customers")
        .select(
          "id, name, phone"
        )
        .order("name", {
          ascending: true,
        }),

      /* Devices */
      supabase
        .from("devices")
        .select(
          "id, name, customer_id"
        )
        .order("name", {
          ascending: true,
        }),

      /* Employees */
      profileClient
        .from("profiles")
        .select(
          "id, full_name, role"
        )
        .in("role", [
          "SUPER_ADMIN",
          "super_admin",
          "ADMIN",
          "admin",
          "MANAGER",
          "manager",
          "EMPLOYEE",
          "employee",
        ])
        .order("full_name", {
          ascending: true,
        }),
    ]);

    if (
      customersResult.error
    ) {
      console.error(
        "Customer form data error:",
        customersResult.error
      );
    }

    if (
      devicesResult.error
    ) {
      console.error(
        "Device form data error:",
        devicesResult.error
      );
    }

    if (
      employeesResult.error
    ) {
      console.error(
        "Employee form data error:",
        employeesResult.error
      );
    }

    return {
      customers:
        (
          customersResult.data ||
          []
        ).map(
          (customer: any) => ({
            id: customer.id,
            name:
              customer.name,
            phone:
              customer.phone ||
              null,
          })
        ),

      devices:
        (
          devicesResult.data ||
          []
        ).map(
          (device: any) => ({
            id: device.id,
            name:
              device.name,
            customerId:
              device.customer_id ||
              null,
          })
        ),

      employees:
        (
          employeesResult.data ||
          []
        ).map(
          (employee: any) => ({
            id: employee.id,
            name:
              employee.full_name ||
              "Employee",
            role:
              String(employee.role || "EMPLOYEE").toUpperCase(),
          })
        ),
    };
  } catch (error) {
    console.error(
      "Repair form data error:",
      error
    );

    return {
      ...emptyFormData(),
      error:
        "Failed to load repair form data",
    };
  }
}

/* =========================================================
   CREATE REPAIR
========================================================= */

export async function createRepairAction(
  form: RepairForm
): Promise<{
  repair?: RepairItem;
  error?: string;
}> {
  try {
    const user =
      await getAuthenticatedUser();

    if (
      !user ||
      !isAllowedRole(user.role)
    ) {
      return {
        error:
          "Unauthorized access",
      };
    }

    if (
      !form.customerId
    ) {
      return {
        error:
          "Please select a customer.",
      };
    }

    if (
      !form.problemDescription.trim()
    ) {
      return {
        error:
          "Problem description is required.",
      };
    }

    const supabase =
      await createClient();

    const insertData: Record<
      string,
      unknown
    > = {
      customer_id:
        form.customerId,

      device_id:
        form.deviceId || null,

      assigned_to_id:
        form.assignedToId || null,

      status:
        form.status ||
        "RECEIVED",

      priority:
        form.priority ||
        "NORMAL",

      problem_description:
        form.problemDescription.trim(),

      diagnosis:
        form.diagnosis.trim() ||
        null,

      initial_condition:
        form.initialCondition.trim() ||
        null,

      accessories_received:
        form.accessoriesReceived.trim() ||
        null,

      estimated_cost:
        Number(
          form.estimatedCost
        ) || 0,

      advance_payment:
        Number(
          form.advancePayment
        ) || 0,

      expected_completion_date:
        form.expectedCompletionDate ||
        null,

      customer_notes:
        form.customerNotes.trim() ||
        null,

      internal_notes:
        form.internalNotes.trim() ||
        null,
    };

    if (
      form.repairNumber.trim()
    ) {
      insertData.repair_number =
        form.repairNumber.trim();
    }

    const {
      data,
      error,
    } = await supabase
      .from("repairs")
      .insert(
        insertData
      )
      .select(`
        id,
        repair_number,
        customer_id,
        device_id,
        assigned_to_id,
        status,
        priority,
        problem_description,
        diagnosis,
        initial_condition,
        accessories_received,
        estimated_cost,
        advance_payment,
        expected_completion_date,
        customer_notes,
        internal_notes,
        created_at,
        updated_at,
        customers (
          id,
          name
        ),
        devices (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error(
        "Create repair error:",
        error
      );

      return {
        error:
          error.message,
      };
    }

    /* Get assigned employee name */
    const employeeMap =
      new Map<string, string>();

    if (
      data?.assigned_to_id
    ) {
      const {
        data: employee,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name"
        )
        .eq(
          "id",
          data.assigned_to_id
        )
        .maybeSingle();

      if (employee) {
        employeeMap.set(
          employee.id,
          employee.full_name ||
            "Employee"
        );
      }
    }

    revalidatePath(
      "/repairs"
    );

    revalidatePath(
      "/staff/repairs"
    );

    revalidatePath(
      "/staff/dashboard"
    );

    return {
      repair: mapRepair(
        data,
        employeeMap
      ),
    };
  } catch (error) {
    console.error(
      "Create repair error:",
      error
    );

    return {
      error:
        "Failed to create repair",
    };
  }
}

/* =========================================================
   UPDATE REPAIR
========================================================= */

export async function updateRepairAction(
  id: string,
  form: RepairForm
): Promise<{
  repair?: RepairItem;
  error?: string;
}> {
  try {
    const user =
      await getAuthenticatedUser();

    if (
      !user ||
      !isAllowedRole(user.role)
    ) {
      return {
        error:
          "Unauthorized access",
      };
    }

    if (!id) {
      return {
        error:
          "Repair ID is required.",
      };
    }

    if (
      !form.customerId
    ) {
      return {
        error:
          "Please select a customer.",
      };
    }

    if (
      !form.problemDescription.trim()
    ) {
      return {
        error:
          "Problem description is required.",
      };
    }

    const supabase =
      await createClient();

    const updateData: Record<
      string,
      unknown
    > = {
      customer_id:
        form.customerId,

      device_id:
        form.deviceId || null,

      assigned_to_id:
        form.assignedToId || null,

      status:
        form.status ||
        "RECEIVED",

      priority:
        form.priority ||
        "NORMAL",

      problem_description:
        form.problemDescription.trim(),

      diagnosis:
        form.diagnosis.trim() ||
        null,

      initial_condition:
        form.initialCondition.trim() ||
        null,

      accessories_received:
        form.accessoriesReceived.trim() ||
        null,

      estimated_cost:
        Number(
          form.estimatedCost
        ) || 0,

      advance_payment:
        Number(
          form.advancePayment
        ) || 0,

      expected_completion_date:
        form.expectedCompletionDate ||
        null,

      customer_notes:
        form.customerNotes.trim() ||
        null,

      internal_notes:
        form.internalNotes.trim() ||
        null,

      updated_at:
        new Date().toISOString(),
    };

    if (
      form.repairNumber.trim()
    ) {
      updateData.repair_number =
        form.repairNumber.trim();
    }

    const {
      data,
      error,
    } = await supabase
      .from("repairs")
      .update(
        updateData
      )
      .eq(
        "id",
        id
      )
      .select(`
        id,
        repair_number,
        customer_id,
        device_id,
        assigned_to_id,
        status,
        priority,
        problem_description,
        diagnosis,
        initial_condition,
        accessories_received,
        estimated_cost,
        advance_payment,
        expected_completion_date,
        customer_notes,
        internal_notes,
        created_at,
        updated_at,
        customers (
          id,
          name
        ),
        devices (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error(
        "Update repair error:",
        error
      );

      return {
        error:
          error.message,
      };
    }

    /* Get assigned employee */
    const employeeMap =
      new Map<string, string>();

    if (
      data?.assigned_to_id
    ) {
      const {
        data: employee,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name"
        )
        .eq(
          "id",
          data.assigned_to_id
        )
        .maybeSingle();

      if (employee) {
        employeeMap.set(
          employee.id,
          employee.full_name ||
            "Employee"
        );
      }
    }

    revalidatePath(
      "/repairs"
    );

    revalidatePath(
      "/staff/repairs"
    );

    revalidatePath(
      "/staff/dashboard"
    );

    return {
      repair: mapRepair(
        data,
        employeeMap
      ),
    };
  } catch (error) {
    console.error(
      "Update repair error:",
      error
    );

    return {
      error:
        "Failed to update repair",
    };
  }
}

/* =========================================================
   DELETE REPAIR
========================================================= */

export async function deleteRepairAction(
  id: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const user =
      await getAuthenticatedUser();

    if (
      !user ||
      !isAllowedRole(user.role)
    ) {
      return {
        error:
          "Unauthorized access",
      };
    }

    if (!id) {
      return {
        error:
          "Repair ID is required.",
      };
    }

    const supabase =
      await createClient();

    const {
      error,
    } = await supabase
      .from("repairs")
      .delete()
      .eq(
        "id",
        id
      );

    if (error) {
      console.error(
        "Delete repair error:",
        error
      );

      return {
        error:
          error.message,
      };
    }

    revalidatePath(
      "/repairs"
    );

    revalidatePath(
      "/staff/repairs"
    );

    revalidatePath(
      "/staff/dashboard"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Delete repair error:",
      error
    );

    return {
      error:
        "Failed to delete repair",
    };
  }
}