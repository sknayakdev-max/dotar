import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value }) => response.cookies.set(name, value))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const role = (user?.app_metadata?.role || user?.user_metadata?.role || 'staff').toLowerCase()
  const isStaffRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (isStaffRoute && !['staff', 'admin', 'super_admin'].includes(role)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}