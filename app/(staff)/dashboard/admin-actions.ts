// app/(staff)/dashboard/admin-actions.ts
'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "./actions";

export async function deleteAdminUserAction(targetUserId: string) {
  const user = await getAuthenticatedUser();

  if (!user || user.role !== "super_admin") {
    return { error: "Permission denied. Only Super Admin can delete admins." };
  }

  if (targetUserId === user.id) {
    return { error: "You cannot delete your own account." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", targetUserId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}