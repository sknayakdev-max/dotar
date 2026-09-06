import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../dashboard/actions";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");
  return <SettingsClient user={user} />;
}