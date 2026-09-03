// app/actions/auth.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";

export async function loginAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message || "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile?.role as UserRole) || "USER";

  if (role === "USER") {
    redirect("/");
  } else {
    redirect("/dashboard");
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}