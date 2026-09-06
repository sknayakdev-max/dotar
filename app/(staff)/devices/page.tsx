import { redirect } from "next/navigation";
import StaffModulePage, { type ModuleRow } from "@/components/dashboard/module-page";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "../dashboard/actions";

export default async function DevicesPage() {
  const user = await getAuthenticatedUser();
  if (!user || String(user.role).toLowerCase() === "user") redirect("/");
  const { data, error } = await (await createClient()).from("devices").select("id, name, device_type, brand, model, serial_number, customers(name)").order("created_at", { ascending: false });
  const rows: ModuleRow[] = (data || []).map((item: any) => ({ id: item.id, primary: item.name, secondary: [item.brand, item.model].filter(Boolean).join(" "), values: [item.customers?.name || "No customer", item.device_type || "Device", item.serial_number || "—"] }));
  return <StaffModulePage user={user} kicker="DEVICE REGISTER" title="Devices" description="Keep customer devices and identifiers ready for every repair." columns={["Device", "Customer", "Type", "Serial number"]} rows={rows} totalLabel="Registered devices" actionLabel="Add device" actionHref="/devices" error={error?.message} />;
}
