"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "../dashboard/actions";

export type PaymentRepair = {
	id: string;
	repairNumber: string | null;
	customerId: string;
	customerName: string;
	deviceName: string;
	estimatedCost: number;
	paidAmount: number;
};

export type PaymentInput = {
	repairId: string;
	partsCost: number;
	gstRate: number;
	method: "CASH" | "UPI";
	transactionReference?: string;
	notes?: string;
};

type PaymentRow = {
	repair_id: string;
	amount: number | string | null;
};

type RepairRow = {
	id: string;
	repair_number: string | null;
	customer_id: string;
	estimated_cost: number | string | null;
	customers: { name: string }[] | null;
	devices: { name: string }[] | null;
};

async function requireStaff() {
	const user = await getAuthenticatedUser();
	if (!user || String(user.role).toLowerCase() === "user") {
		throw new Error("Unauthorized");
	}
	return user;
}

export async function getPaymentDataAction(): Promise<{
	repairs: PaymentRepair[];
	error?: string;
}> {
	try {
		await requireStaff();
		const supabase = await createClient();
		const [{ data: repairs, error: repairsError }, { data: payments, error: paymentsError }] = await Promise.all([
			supabase.from("repairs").select(`id, repair_number, customer_id, estimated_cost, customers (name), devices (name)`).in("status", ["RECEIVED", "IN_PROGRESS", "READY", "COMPLETED"]).order("created_at", { ascending: false }),
			supabase.from("payments").select("repair_id, amount").not("repair_id", "is", null),
		]);

		if (repairsError) return { repairs: [], error: repairsError.message };
		if (paymentsError) return { repairs: [], error: paymentsError.message };

		const paidByRepair = new Map<string, number>();
		(payments as PaymentRow[] || []).forEach((payment) => {
			paidByRepair.set(payment.repair_id, (paidByRepair.get(payment.repair_id) || 0) + Number(payment.amount || 0));
		});

		return {
			repairs: (repairs as RepairRow[] || []).map((repair) => ({
				id: repair.id,
				repairNumber: repair.repair_number,
				customerId: repair.customer_id,
				customerName: repair.customers?.[0]?.name || "Unknown customer",
				deviceName: repair.devices?.[0]?.name || "No device",
				estimatedCost: Number(repair.estimated_cost || 0),
				paidAmount: paidByRepair.get(repair.id) || 0,
			})),
		};
	} catch (error) {
		return { repairs: [], error: error instanceof Error ? error.message : "Failed to load payment data." };
	}
}

export async function recordPaymentAction(input: PaymentInput) {
	try {
		const user = await requireStaff();
		const supabase = await createClient();
		const partsCost = Math.max(0, Number(input.partsCost) || 0);
		const gstRate = Math.max(0, Number(input.gstRate) || 0);
		const { data: repair, error: repairError } = await supabase.from("repairs").select("id, customer_id, estimated_cost").eq("id", input.repairId).single();

		if (repairError || !repair) return { error: "The selected repair could not be found." };

		const laborCost = Math.max(0, Number(repair.estimated_cost) || 0);
		const subtotal = laborCost + partsCost;
		const tax = Number((subtotal * gstRate / 100).toFixed(2));
		const invoiceTotal = Number((subtotal + tax).toFixed(2));
		const { data: previousPayments, error: previousPaymentsError } = await supabase
			.from("payments")
			.select("amount")
			.eq("repair_id", repair.id)
			.eq("status", "COMPLETED");
		if (previousPaymentsError) return { error: previousPaymentsError.message };
		const paidAmount = (previousPayments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
		const total = Number(Math.max(0, invoiceTotal - paidAmount).toFixed(2));
		if (total <= 0) return { error: "Add a repair estimate or parts charge before taking payment." };
		if (input.method === "UPI" && !input.transactionReference?.trim()) return { error: "Enter the UPI transaction reference." };

		const { error: invoiceError } = await supabase.from("invoices").insert({
			repair_id: repair.id,
			customer_id: repair.customer_id,
			labor_cost: laborCost,
			parts_cost: partsCost,
			tax,
			total_amount: total,
			notes: input.notes?.trim() || null,
		});
		if (invoiceError) return { error: invoiceError.message };

		const { error: paymentError } = await supabase.from("payments").insert({
			repair_id: repair.id,
			customer_id: repair.customer_id,
			amount: total,
			method: input.method,
			status: "COMPLETED",
			transaction_reference: input.transactionReference?.trim() || null,
			notes: input.notes?.trim() || null,
			recorded_by: user.id,
		});
		if (paymentError) return { error: paymentError.message };

		revalidatePath("/payments");
		revalidatePath("/invoices");
		return { success: true, amount: total };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to record payment." };
	}
}
