"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getAuthenticatedUser } from "../dashboard/actions";

export type EmployeeItem = {
	id: string;
	name: string;
	email: string;
	role: string;
	createdAt: string | null;
};

export type EmployeeInput = {
	name: string;
	email: string;
	role: "ADMIN" | "MANAGER" | "EMPLOYEE";
};

function allowedRolesFor(role: string): EmployeeInput["role"][] {
	if (role === "super_admin") return ["ADMIN", "MANAGER", "EMPLOYEE"];
	if (role === "admin") return ["MANAGER", "EMPLOYEE"];
	if (role === "manager") return ["EMPLOYEE"];
	return [];
}

function createAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !serviceRoleKey) return null;

	return createSupabaseClient(url, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}

async function requireEmployeeManager() {
	const user = await getAuthenticatedUser();
	const role = String(user?.role || "").toLowerCase();
	if (!user || allowedRolesFor(role).length === 0) {
		throw new Error("You do not have permission to manage employee roles.");
	}
	return { user, role };
}

export async function getEmployeesAction(): Promise<{
	data: EmployeeItem[];
	error?: string;
}> {
	try {
		await requireEmployeeManager();
		const admin = createAdminClient();
		if (!admin) return { data: [], error: "Supabase admin configuration is missing." };
		const { data, error } = await admin
			.from("profiles")
			.select("id, full_name, email, role, created_at")
			.in("role", [
				"super_admin",
				"SUPER_ADMIN",
				"admin",
				"ADMIN",
				"manager",
				"MANAGER",
				"employee",
				"EMPLOYEE",
			])
			.order("created_at", { ascending: false });

		if (error) return { data: [], error: error.message };
		return {
			data: (data || []).map((item) => ({
				id: item.id,
				name: item.full_name || item.email,
				email: item.email,
				role: item.role,
				createdAt: item.created_at,
			})),
		};
	} catch (error) {
		return { data: [], error: error instanceof Error ? error.message : "Failed to load employees." };
	}
}

export async function inviteEmployeeAction(input: EmployeeInput) {
	try {
		const { role: managerRole } = await requireEmployeeManager();
		if (!allowedRolesFor(managerRole).includes(input.role)) {
			return { error: "You cannot assign this role." };
		}
		const name = input.name.trim();
		const email = input.email.trim().toLowerCase();
		if (!name || !email) return { error: "Name and email are required." };

		const admin = createAdminClient();
		if (!admin) return { error: "Supabase admin configuration is missing." };
		const { data: usersData, error: usersError } = await admin.auth.admin.listUsers();
		if (usersError) return { error: usersError.message };
		const existingUser = usersData.users.find((user) => user.email?.toLowerCase() === email);
		let userId = existingUser?.id;

		if (!userId) {
			const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
				data: { full_name: name, role: input.role.toLowerCase() },
			});
			if (error || !data.user) return { error: error?.message || "Failed to invite employee." };
			userId = data.user.id;
		}

		const { error: profileError } = await admin.from("profiles").upsert({
			id: userId,
			email,
			full_name: name,
			role: input.role.toLowerCase(),
		});
		if (profileError) return { error: profileError.message };

		revalidatePath("/employees");
		return {
			success: true,
			employee: {
				id: userId,
				name,
				email,
				role: input.role,
				createdAt: new Date().toISOString(),
			} as EmployeeItem,
		};
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to invite employee." };
	}
}
