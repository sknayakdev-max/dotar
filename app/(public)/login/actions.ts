// app/(public)/login/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message || 'Invalid credentials' };
  }

  // Debug step: Fetch role
  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  console.log('🔍 DEBUG LOGIN ROLE:', profile?.role, 'Fetch Error:', profileErr);

  // Hardcode redirect to force test
  console.log('🚀 Executing redirect to /dashboard...');
  redirect('/dashboard');
}