"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "../dashboard/actions";

export async function updateProfileNameAction(name: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { error: "You must be signed in." };

    const trimmedName = name.trim();
    if (!trimmedName) return { error: "Name is required." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmedName })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, name: trimmedName };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update profile." };
  }
}