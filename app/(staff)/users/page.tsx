import { redirect } from "next/navigation";
import StaffModulePage from "@/components/dashboard/module-page";
import { getAuthenticatedUser } from "../dashboard/actions";

export default async function UsersPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");
  return <StaffModulePage user={user} kicker="ACCESS CONTROL" title="Users" description="Manage the people who can access FixDesk." columns={["User", "Role"]} rows={[]} totalLabel="Access directory" />;
}