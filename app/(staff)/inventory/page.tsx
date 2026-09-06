export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "../dashboard/actions";
import { getInventoryAction } from "./actions";
import InventoryClient from "./inventory-client";

export default async function InventoryPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");

  const result = await getInventoryAction();
  return <InventoryClient user={user} initialItems={result.data} initialError={result.error} />;
}
