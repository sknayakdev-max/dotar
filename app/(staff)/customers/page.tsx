export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

import {
  getAuthenticatedUser,
} from "../dashboard/actions";

import {
  getCustomersAction,
} from "./actions";

import CustomersClient from "./customers-client";

export default async function CustomersPage() {
  const user =
    await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const role =
    String(user.role).toLowerCase();

  if (!role || role === "user") {
    redirect("/");
  }

  const result =
    await getCustomersAction();

  return (
    <CustomersClient
      user={user}
      initialCustomers={result.data}
      initialError={result.error}
    />
  );
}
