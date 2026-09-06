"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

import { getAuthenticatedUser } from "../dashboard/actions";

export type EmployeeItem = {
	id: string;
	name: string;
	email: string;
	role: string;
	status: "ACTIVE" | "SUSPENDED";
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
		const { data: usersData, error: usersError } = await admin.auth.admin.listUsers();
		if (usersError) return { data: [], error: usersError.message };
		const authUsers = new Map(usersData.users.map((authUser) => [authUser.id, authUser]));
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
				status: authUsers.get(item.id)?.banned_until && new Date(authUsers.get(item.id)!.banned_until as string) > new Date() ? "SUSPENDED" : "ACTIVE",
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
		let temporaryPassword: string | undefined;

		if (!userId) {
			temporaryPassword = `FixDesk-${randomBytes(9).toString("base64url")}`;
			const { data, error } = await admin.auth.admin.createUser({
				email,
				password: temporaryPassword,
				email_confirm: true,
				user_metadata: { full_name: name, role: input.role.toLowerCase() },
			});
			if (error || !data.user) return { error: error?.message || "Failed to create employee account." };
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
			temporaryPassword,
			employee: {
				id: userId,
				name,
				email,
				role: input.role,
				status: "ACTIVE",
				createdAt: new Date().toISOString(),
			} as EmployeeItem,
		};
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to invite employee." };
	}
}

async function getManageableEmployee(id: string) {
	const { user: manager, role: managerRole } = await requireEmployeeManager();
	if (id === manager.id) throw new Error("You cannot manage your own account here.");
	const admin = createAdminClient();
	if (!admin) throw new Error("Supabase admin configuration is missing.");
	const { data: profile, error } = await admin.from("profiles").select("id, email, full_name, role").eq("id", id).single();
	if (error || !profile) throw new Error("Employee not found.");
	if (!allowedRolesFor(managerRole).includes(String(profile.role).toUpperCase() as EmployeeInput["role"])) {
		throw new Error("You cannot manage this employee.");
	}
	return { admin, profile };
}

export async function updateEmployeeAction(id: string, input: EmployeeInput) {
	try {
		const { admin, profile } = await getManageableEmployee(id);
		if (!input.name.trim() || !input.email.trim()) return { error: "Name and email are required." };
		const { role: managerRole } = await requireEmployeeManager();
		if (!allowedRolesFor(managerRole).includes(input.role)) return { error: "You cannot assign this role." };
		const name = input.name.trim();
		const email = input.email.trim().toLowerCase();
		const { error: authError } = await admin.auth.admin.updateUserById(id, {
			email,
			email_confirm: true,
			user_metadata: { full_name: name, role: input.role.toLowerCase() },
		});
		if (authError) return { error: authError.message };
		const { error: profileError } = await admin.from("profiles").update({ email, full_name: name, role: input.role.toLowerCase() }).eq("id", id);
		if (profileError) return { error: profileError.message };
		revalidatePath("/employees");
		return { success: true, employee: { id, name, email, role: input.role, status: "ACTIVE" as const, createdAt: null } satisfies EmployeeItem, previousEmail: profile.email };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to update employee." };
	}
}

export async function suspendEmployeeAction(id: string, suspended: boolean) {
	try {
		const { admin } = await getManageableEmployee(id);
		const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: suspended ? "876000h" : "none" });
		if (error) return { error: error.message };
		revalidatePath("/employees");
		return { success: true, status: suspended ? "SUSPENDED" as const : "ACTIVE" as const };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to update employee access." };
	}
}

export async function deleteEmployeeAction(id: string) {
	try {
		const { admin } = await getManageableEmployee(id);
		const { error } = await admin.auth.admin.deleteUser(id);
		if (error) return { error: error.message };
		const { error: profileError } = await admin.from("profiles").delete().eq("id", id);
		if (profileError) return { error: profileError.message };
		revalidatePath("/employees");
		return { success: true };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to delete employee." };
	}
}
