import { redirect } from "next/navigation";
import StaffModulePage, { type ModuleRow } from "@/components/dashboard/module-page";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "../dashboard/actions";

export default async function EmployeesPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");
  const { data, error } = await (await createClient()).from("profiles").select("id, full_name, email, role").order("full_name");
  const rows: ModuleRow[] = (data || []).map((item: any) => ({ id: item.id, primary: item.full_name || item.email || "Staff member", secondary: item.email, values: [item.role || "STAFF", "Active"] }));
  return <StaffModulePage user={user} kicker="TEAM MANAGEMENT" title="Employees" description="See your repair team and their access roles at a glance." columns={["Employee", "Role", "Status"]} rows={rows} totalLabel="Team members" actionLabel="Add employee" actionHref="/employees" error={error?.message} />;
}