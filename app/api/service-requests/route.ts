import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Adjust this path to point to your existing Supabase client file:
import { supabase } from "@/lib/supabase/client"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      phone,
      email,
      deviceType,
      brand,
      model,
      problemDescription,
      preferredContact,
    } = body;

    // 1. Basic Validation
    if (
      typeof customerName !== "string" ||
      typeof phone !== "string" ||
      typeof deviceType !== "string" ||
      typeof problemDescription !== "string" ||
      !customerName.trim() ||
      !phone.trim() ||
      !problemDescription.trim()
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 2. Generate a custom tracking number
    const requestNumber = `REQ-${Date.now()}`;

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing." },
        { status: 500 }
      );
    }

    // 3. Insert into Supabase table
    const { data, error } = await admin
      .from("service_requests")
      .insert([
        {
          request_number: requestNumber,
          customer_name: customerName.trim(),
          phone: phone.trim(),
          email: typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null,
          device_type: deviceType,
          brand: typeof brand === "string" && brand.trim() ? brand.trim() : null,
          model: typeof model === "string" && model.trim() ? model.trim() : null,
          problem_description: problemDescription.trim(),
          preferred_contact: preferredContact || "PHONE",
          status: "PENDING_REVIEW",
          user_id: null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // 4. Return success to the frontend form
    return NextResponse.json(
      {
        success: true,
        request: {
          id: data.id,
          requestNumber: data.request_number,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
