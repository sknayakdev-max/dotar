import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "../dashboard/actions";
import {
  getRepairsAction,
  getRepairFormDataAction,
} from "./actions";

import RepairsClient from "./repairs-client";

export default async function RepairsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth");
  }

  const role = String(user.role).toLowerCase();

  if (!role || role === "user") {
    redirect("/");
  }

  const [repairsResult, formDataResult] =
    await Promise.all([
      getRepairsAction(),
      getRepairFormDataAction(),
    ]);

  return (
    <RepairsClient
      user={user}
      initialRepairs={repairsResult.data}
      initialCustomers={formDataResult.customers}
      initialDevices={formDataResult.devices}
      initialEmployees={formDataResult.employees}
      initialError={
        repairsResult.error ||
        formDataResult.error
      }
    />
  );
}