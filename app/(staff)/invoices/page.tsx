import { redirect } from "next/navigation";
import StaffModulePage, { type ModuleRow } from "@/components/dashboard/module-page";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "../dashboard/actions";

export default async function InvoicesPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");
  const { data, error } = await (await createClient()).from("invoices").select("id, invoice_number, total_amount, issued_at, customers(name)").order("issued_at", { ascending: false });
  const rows: ModuleRow[] = (data || []).map((item: any) => ({ id: item.id, primary: item.invoice_number || "Draft invoice", secondary: item.customers?.name || "Unknown customer", values: [new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(item.total_amount || 0)), new Date(item.issued_at).toLocaleDateString("en-IN"), "Issued"], status: "Issued" }));
  return <StaffModulePage user={user} kicker="BILLING" title="Invoices" description="Review repair invoices and the amounts issued to customers." columns={["Invoice", "Total", "Issued", "Status"]} rows={rows} totalLabel="Issued invoices" actionLabel="Take payment" actionHref="/payments" error={error?.message} />;
}