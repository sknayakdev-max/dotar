// components/dashboard/delete-admin-button.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminUserAction } from "@/app/(staff)/dashboard/admin-actions";

export default function DeleteAdminButton({ adminId }: { adminId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this admin account?")) return;

    startTransition(async () => {
      const res = await deleteAdminUserAction(adminId);
      if (res?.error) {
        alert(res.error);
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      <Trash2 size={14} />
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}