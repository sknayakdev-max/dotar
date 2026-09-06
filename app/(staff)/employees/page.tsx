import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../dashboard/actions";
import { getEmployeesAction } from "./actions";
import EmployeesClient from "./employees-client";

export default async function EmployeesPage() {
  const user = await getAuthenticatedUser();
  if (!user || !["super_admin", "admin", "manager"].includes(String(user.role).toLowerCase())) redirect("/");
  const result = await getEmployeesAction();
  return <EmployeesClient user={user} initialEmployees={result.data} initialError={result.error} />;
}