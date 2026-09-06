import { redirect } from "next/navigation";
import StaffModulePage from "@/components/dashboard/module-page";
import { getAuthenticatedUser } from "../dashboard/actions";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");
  return <StaffModulePage user={user} kicker="WORKSPACE SETTINGS" title="Settings" description="Workspace configuration will be managed here." columns={["Setting", "Value"]} rows={[]} totalLabel="Configuration" />;
}