"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import {
  getAuthenticatedUser,
} from "../dashboard/actions";

export type CustomerItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
};

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
};

async function requireStaff() {
  const user =
    await getAuthenticatedUser();

  if (!user) {
    throw new Error(
      "Unauthorized"
    );
  }

  const role =
    String(user.role).toLowerCase();

  if (
    !role ||
    role === "user"
  ) {
    throw new Error(
      "Unauthorized"
    );
  }

  return user;
}

export async function getCustomersAction(): Promise<{
  data: CustomerItem[];
  error?: string;
}> {
  try {
    await requireStaff();

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("customers")
      .select(`
        id,
        name,
        phone,
        email,
        address,
        city,
        notes,
        created_at
      `)
      .is(
        "deleted_at",
        null
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      return {
        data: [],
        error: error.message,
      };
    }

    return {
      data: (
        data || []
      ).map(
        (item: any) => ({
          id: item.id,
          name: item.name,
          phone: item.phone,
          email: item.email,
          address:
            item.address,
          city: item.city,
          notes: item.notes,
          createdAt:
            item.created_at,
        })
      ),
    };
  } catch (error) {
    return {
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load customers.",
    };
  }
}

export async function createCustomerAction(
  input: CustomerInput
) {
  try {
    await requireStaff();

    if (
      !input.name.trim() ||
      !input.phone.trim()
    ) {
      return {
        error:
          "Name and phone are required.",
      };
    }

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("customers")
      .insert({
        name:
          input.name.trim(),

        phone:
          input.phone.trim(),

        email:
          input.email?.trim() ||
          null,

        address:
          input.address?.trim() ||
          null,

        city:
          input.city?.trim() ||
          null,

        notes:
          input.notes?.trim() ||
          null,
      })
      .select(`
        id,
        name,
        phone,
        email,
        address,
        city,
        notes,
        created_at
      `)
      .single();

    if (error) {
      return {
        error: error.message,
      };
    }

    revalidatePath(
      "/customers"
    );

    return {
      success: true,
      customer: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        notes: data.notes,
        createdAt:
          data.created_at,
      } as CustomerItem,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create customer.",
    };
  }
}

export async function updateCustomerAction(
  id: string,
  input: CustomerInput
) {
  try {
    await requireStaff();

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("customers")
      .update({
        name:
          input.name.trim(),

        phone:
          input.phone.trim(),

        email:
          input.email?.trim() ||
          null,

        address:
          input.address?.trim() ||
          null,

        city:
          input.city?.trim() ||
          null,

        notes:
          input.notes?.trim() ||
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id
      )
      .select(`
        id,
        name,
        phone,
        email,
        address,
        city,
        notes,
        created_at
      `)
      .single();

    if (error) {
      return {
        error: error.message,
      };
    }

    revalidatePath(
      "/customers"
    );

    return {
      success: true,
      customer: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        notes: data.notes,
        createdAt:
          data.created_at,
      } as CustomerItem,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update customer.",
    };
  }
}

export async function deleteCustomerAction(
  id: string
) {
  try {
    const user =
      await requireStaff();

    const role =
      String(user.role).toLowerCase();

    if (
      role !== "admin" &&
      role !== "super_admin" &&
      role !== "manager"
    ) {
      return {
        error:
          "You do not have permission to delete customers.",
      };
    }

    const supabase =
      await createClient();

    /*
     * Soft delete because customers
     * are referenced by repairs,
     * devices, payments and invoices.
     */
    const { error } =
      await supabase
        .from("customers")
        .update({
          deleted_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          id
        );

    if (error) {
      return {
        error: error.message,
      };
    }

    revalidatePath(
      "/customers"
    );

    return {
      success: true,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete customer.",
    };
  }
}