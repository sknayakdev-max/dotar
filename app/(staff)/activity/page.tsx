import { redirect } from "next/navigation";
import StaffModulePage from "@/components/dashboard/module-page";
import { getAuthenticatedUser } from "../dashboard/actions";

export default async function ActivityPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");
  return <StaffModulePage user={user} kicker="AUDIT TRAIL" title="Activity Logs" description="Review important changes made across the repair workspace." columns={["Activity", "User"]} rows={[]} totalLabel="Recent activity" />;
}