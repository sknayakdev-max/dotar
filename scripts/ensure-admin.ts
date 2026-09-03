import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Service role key is REQUIRED for administrative user creation
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

const adminEmail = process.env.SUPER_ADMIN_EMAIL;
const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
const adminName = process.env.SUPER_ADMIN_NAME || "Super Admin";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error("❌ Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function ensureAdminUser(): Promise<void> {
  console.log(`🔍 Checking if Super Admin (${adminEmail}) exists...`);

  try {
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingAdmin = data.users.find(
      (u) => u.email?.toLowerCase() === adminEmail?.toLowerCase()
    );

    if (existingAdmin) {
      console.log(`✅ Super Admin (${adminEmail}) exists. Launching app...`);
      return; // Return cleanly instead of process.exit(0)
    }

    console.log(`⚙️ Super Admin not found. Creating account for ${adminName}...`);

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: "super_admin",
      },
    });

    if (createError) throw createError;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: newUser.user.id,
      email: adminEmail,
      full_name: adminName,
      role: "super_admin",
    });

    if (profileError) {
      console.warn(`⚠️ Created Auth user, but failed to insert into profiles: ${profileError.message}`);
    }

    console.log(`🎉 Super Admin (${newUser.user.email}) created! Launching app...`);
    return; // Return cleanly instead of process.exit(0)
  } catch (error: any) {
    console.error("❌ Error running admin script:", error.message || error);
    process.exit(1);
  }
}

ensureAdminUser();