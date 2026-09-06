"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { getAuthenticatedUser } from "../dashboard/actions";

export type InventoryItem = {
	id: string;
	name: string;
	category: string | null;
	brand: string | null;
	sku: string | null;
	quantity: number;
	minimumStock: number;
	purchasePrice: number;
	sellingPrice: number;
	supplier: string | null;
	location: string | null;
	createdAt: string;
};

export type InventoryInput = {
	name: string;
	category?: string;
	brand?: string;
	sku?: string;
	quantity: number;
	minimumStock: number;
	purchasePrice: number;
	sellingPrice: number;
	supplier?: string;
	location?: string;
};

async function requireStaff() {
	const user = await getAuthenticatedUser();

	if (!user || String(user.role).toLowerCase() === "user") {
		throw new Error("Unauthorized");
	}

	return user;
}

function mapItem(item: any): InventoryItem {
	return {
		id: item.id,
		name: item.name,
		category: item.category,
		brand: item.brand,
		sku: item.sku,
		quantity: item.quantity,
		minimumStock: item.minimum_stock,
		purchasePrice: Number(item.purchase_price),
		sellingPrice: Number(item.selling_price),
		supplier: item.supplier,
		location: item.location,
		createdAt: item.created_at,
	};
}

export async function getInventoryAction(): Promise<{
	data: InventoryItem[];
	error?: string;
}> {
	try {
		await requireStaff();
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("inventory_items")
			.select("*")
			.is("deleted_at", null)
			.order("name", { ascending: true });

		if (error) return { data: [], error: error.message };
		return { data: (data || []).map(mapItem) };
	} catch (error) {
		return {
			data: [],
			error: error instanceof Error ? error.message : "Failed to load inventory.",
		};
	}
}

function normalizeInput(input: InventoryInput) {
	return {
		name: input.name.trim(),
		category: input.category?.trim() || null,
		brand: input.brand?.trim() || null,
		sku: input.sku?.trim() || null,
		quantity: Math.max(0, Math.trunc(Number(input.quantity) || 0)),
		minimum_stock: Math.max(0, Math.trunc(Number(input.minimumStock) || 0)),
		purchase_price: Math.max(0, Number(input.purchasePrice) || 0),
		selling_price: Math.max(0, Number(input.sellingPrice) || 0),
		supplier: input.supplier?.trim() || null,
		location: input.location?.trim() || null,
	};
}

export async function createInventoryAction(input: InventoryInput) {
	try {
		await requireStaff();
		const values = normalizeInput(input);
		if (!values.name) return { error: "Part name is required." };

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("inventory_items")
			.insert(values)
			.select("*")
			.single();

		if (error) return { error: error.message };
		revalidatePath("/inventory");
		return { success: true, item: mapItem(data) };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to add part." };
	}
}

export async function updateInventoryAction(id: string, input: InventoryInput) {
	try {
		await requireStaff();
		const values = normalizeInput(input);
		if (!values.name) return { error: "Part name is required." };

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("inventory_items")
			.update(values)
			.eq("id", id)
			.select("*")
			.single();

		if (error) return { error: error.message };
		revalidatePath("/inventory");
		return { success: true, item: mapItem(data) };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to update part." };
	}
}

export async function deleteInventoryAction(id: string) {
	try {
		await requireStaff();
		const supabase = await createClient();
		const { error } = await supabase
			.from("inventory_items")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", id);

		if (error) return { error: error.message };
		revalidatePath("/inventory");
		return { success: true };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to remove part." };
	}
}
