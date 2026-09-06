import { redirect } from "next/navigation";
import StaffModulePage, { type ModuleRow } from "@/components/dashboard/module-page";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "../dashboard/actions";

export default async function ReportsPage() {
	const user = await getAuthenticatedUser();
	if (!user || String(user.role).toLowerCase() === "user") redirect("/");
	const client = await createClient();
	const [repairs, payments, inventory] = await Promise.all([
		client.from("repairs").select("id, status, estimated_cost"),
		client.from("payments").select("id, amount, method, paid_at"),
		client.from("inventory_items").select("id, quantity, minimum_stock").is("deleted_at", null),
	]);
	const rows: ModuleRow[] = [
		{ id: "repairs", primary: "Repair performance", secondary: "Current repair workload", values: [`${repairs.data?.length || 0} jobs`, "Operations"] },
		{ id: "payments", primary: "Payment collection", secondary: "Cash and UPI receipts", values: [new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((payments.data || []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)), `${payments.data?.length || 0} payments`] },
		{ id: "inventory", primary: "Stock health", secondary: "Parts at or below minimum", values: [`${(inventory.data || []).filter((item: any) => item.quantity <= item.minimum_stock).length} low stock`, `${inventory.data?.length || 0} parts`] },
	];
	return <StaffModulePage user={user} kicker="BUSINESS INSIGHTS" title="Reports" description="A compact view of repairs, payments, and stock health." columns={["Report", "Result", "Scope"]} rows={rows} totalLabel="Live summaries" actionLabel="View payments" actionHref="/payments" />;
}
