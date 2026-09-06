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

export async function updatePasswordAction(currentPassword: string, newPassword: string, confirmPassword: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { error: "You must be signed in." };
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: "All password fields are required." };
    }
    if (newPassword.length < 8) {
      return { error: "The new password must be at least 8 characters." };
    }
    if (newPassword !== confirmPassword) {
      return { error: "The new passwords do not match." };
    }
    if (currentPassword === newPassword) {
      return { error: "The new password must be different from the current password." };
    }

    const supabase = await createClient();
    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verificationError) return { error: "Current password is incorrect." };

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) return { error: updateError.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update password." };
  }
}