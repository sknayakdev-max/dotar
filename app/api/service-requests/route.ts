import { NextResponse } from "next/server";
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
    if (!customerName || !phone || !deviceType || !problemDescription) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 2. Generate a custom tracking number
    const requestNumber = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Insert into Supabase table
    const { data, error } = await supabase
      .from("service_requests")
      .insert([
        {
          request_number: requestNumber,
          customer_name: customerName,
          phone: phone,
          email: email || null,
          device_type: deviceType,
          brand: brand || null,
          model: model || null,
          problem_description: problemDescription,
          preferred_contact: preferredContact || "PHONE",
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