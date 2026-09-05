export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

import {
  getAuthenticatedUser,
  getDashboardStatsAction,
} from "./actions";

import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const role = String(user.role).toLowerCase();

  if (!role || role === "user") {
    redirect("/");
  }

  const result = await getDashboardStatsAction();

  return (
    <DashboardClient
      user={user}
      initialStats={result.data}
      initialError={result.error}
    />
  );
}
