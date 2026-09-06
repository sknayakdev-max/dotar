<<<<<<< Updated upstream
=======
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "../dashboard/actions";
import { getPaymentDataAction } from "./actions";
import PaymentsClient from "./payments-client";

export default async function PaymentsPage() {
	const user = await getAuthenticatedUser();
	if (!user || String(user.role).toLowerCase() === "user") redirect("/");

	const result = await getPaymentDataAction();
	return <PaymentsClient user={user} initialRepairs={result.repairs} initialError={result.error} />;
}
>>>>>>> Stashed changes
