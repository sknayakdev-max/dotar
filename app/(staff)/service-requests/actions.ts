"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import {
  getAuthenticatedUser,
} from "../dashboard/actions";

export type ServiceRequestItem = {
  id: string;
  requestNumber: string | null;
  customerName: string;
  phone: string;
  email: string | null;
  deviceType: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  problemDescription: string;
  additionalNotes: string | null;
  preferredContact: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
};

export type ServiceRequestInput = {
  customerName: string;
  phone: string;
  email?: string;
  deviceType: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  problemDescription: string;
  additionalNotes?: string;
  preferredContact?: string;
};

async function requireStaff() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const role = String(user.role).toLowerCase();

  if (!role || role === "user") {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getServiceRequestsAction(): Promise<{
  data: ServiceRequestItem[];
  error?: string;
}> {
  try {
    await requireStaff();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("service_requests")
      .select(`
        id,
        request_number,
        customer_name,
        phone,
        email,
        device_type,
        brand,
        model,
        serial_number,
        problem_description,
        additional_notes,
        preferred_contact,
        status,
        review_notes,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      return {
        data: [],
        error: error.message,
      };
    }

    return {
      data: (data || []).map(
        (item) => ({
          id: item.id,
          requestNumber:
            item.request_number,
          customerName:
            item.customer_name,
          phone:
            item.phone,
          email:
            item.email,
          deviceType:
            item.device_type,
          brand:
            item.brand,
          model:
            item.model,
          serialNumber:
            item.serial_number,
          problemDescription:
            item.problem_description,
          additionalNotes:
            item.additional_notes,
          preferredContact:
            item.preferred_contact,
          status:
            item.status,
          reviewNotes:
            item.review_notes,
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
          : "Failed to load service requests.",
    };
  }
}

export async function createServiceRequestAction(
  input: ServiceRequestInput
) {
  try {
    const user =
      await requireStaff();

    const supabase =
      await createClient();

    const requestNumber =
      `SR-${Date.now()}`;

    const { data: createdRequest, error } =
      await supabase
        .from("service_requests")
        .insert({
          request_number:
            requestNumber,

          customer_name:
            input.customerName,

          phone:
            input.phone,

          email:
            input.email || null,

          device_type:
            input.deviceType,

          brand:
            input.brand || null,

          model:
            input.model || null,

          serial_number:
            input.serialNumber ||
            null,

          problem_description:
            input.problemDescription,

          additional_notes:
            input.additionalNotes ||
            null,

          preferred_contact:
            input.preferredContact ||
            "PHONE",

          status:
            "PENDING_REVIEW",

          user_id:
            user.id,
        })
        .select("id, request_number, customer_name, phone, email, device_type, brand, model, serial_number, problem_description, additional_notes, preferred_contact, status, review_notes, created_at")
        .single();

    if (error) {
      return {
        error: error.message,
      };
    }

    revalidatePath(
      "/service-requests"
    );

    return {
      success: true,
      request: {
        id: createdRequest.id,
        requestNumber: createdRequest.request_number,
        customerName: createdRequest.customer_name,
        phone: createdRequest.phone,
        email: createdRequest.email,
        deviceType: createdRequest.device_type,
        brand: createdRequest.brand,
        model: createdRequest.model,
        serialNumber: createdRequest.serial_number,
        problemDescription: createdRequest.problem_description,
        additionalNotes: createdRequest.additional_notes,
        preferredContact: createdRequest.preferred_contact,
        status: createdRequest.status,
        reviewNotes: createdRequest.review_notes,
        createdAt: createdRequest.created_at,
      } satisfies ServiceRequestItem,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create request.",
    };
  }
}

export async function updateServiceRequestStatusAction(
  id: string,
  status: string,
  reviewNotes?: string
) {
  try {
    await requireStaff();

    const supabase =
      await createClient();

    const { error } =
      await supabase
        .from("service_requests")
        .update({
          status,
          review_notes:
            reviewNotes || null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
      return {
        error: error.message,
      };
    }

    revalidatePath(
      "/service-requests"
    );

    return {
      success: true,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update request.",
    };
  }
}

export async function deleteServiceRequestAction(
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
          "You do not have permission to delete requests.",
      };
    }

    const supabase =
      await createClient();

    const { error } =
      await supabase
        .from("service_requests")
        .delete()
        .eq("id", id);

    if (error) {
      return {
        error: error.message,
      };
    }

    revalidatePath(
      "/service-requests"
    );

    return {
      success: true,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete request.",
    };
  }
}