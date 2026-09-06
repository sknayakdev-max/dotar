"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "../dashboard/actions";

export type DeviceInput = {
	customerId: string;
	name: string;
	deviceType?: string;
	brand?: string;
	model?: string;
	serialNumber?: string;
	imei?: string;
	condition?: string;
	notes?: string;
};

export type CreatedDevice = {
	id: string;
	name: string;
	customerId: string;
};

export async function createDeviceAction(input: DeviceInput): Promise<{
	device?: CreatedDevice;
	error?: string;
}> {
	try {
		const user = await getAuthenticatedUser();
		if (!user || String(user.role).toLowerCase() === "user") {
			throw new Error("Unauthorized");
		}

		if (!input.customerId || !input.name.trim()) {
			return { error: "Customer and device name are required." };
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("devices")
			.insert({
				customer_id: input.customerId,
				name: input.name.trim(),
				device_type: input.deviceType?.trim() || null,
				brand: input.brand?.trim() || null,
				model: input.model?.trim() || null,
				serial_number: input.serialNumber?.trim() || null,
				imei: input.imei?.trim() || null,
				condition: input.condition?.trim() || null,
				notes: input.notes?.trim() || null,
			})
			.select("id, name, customer_id")
			.single();

		if (error) return { error: error.message };

		revalidatePath("/devices");
		revalidatePath("/repairs");
		return {
			device: {
				id: data.id,
				name: data.name,
				customerId: data.customer_id,
			},
		};
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to create device." };
	}
}
