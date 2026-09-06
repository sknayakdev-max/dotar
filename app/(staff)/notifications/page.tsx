import { redirect } from "next/navigation";
import StaffModulePage from "@/components/dashboard/module-page";
import { getAuthenticatedUser } from "../dashboard/actions";

export default async function NotificationsPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");
  return <StaffModulePage user={user} kicker="TEAM UPDATES" title="Notifications" description="Keep track of reminders and updates that need attention." columns={["Notification", "Status"]} rows={[]} totalLabel="Notification center" />;
}