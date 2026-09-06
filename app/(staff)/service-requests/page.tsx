export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "../dashboard/actions";
import {
  getServiceRequestsAction,
} from "./actions";

import ServiceRequestsClient from "./service-requests-client";

export default async function ServiceRequestsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const role = String(user.role).toLowerCase();

  if (!role || role === "user") {
    redirect("/");
  }

  const result = await getServiceRequestsAction();

  return (
    <ServiceRequestsClient
      user={user}
      initialRequests={result.data}
      initialError={result.error}
    />
  );
}
