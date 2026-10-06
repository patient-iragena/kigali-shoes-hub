import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
 
// Only this account may use the admin area.
// Customers can also sign in with Google on the storefront, so being
// "logged in" must NOT be enough to count as admin.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'patientira79@gmail.com').toLowerCase()
 
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
 
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // FIX: explicit type, required by the production build's TypeScript check
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
 
  // getUser() re-validates the session with Supabase (safer than trusting the cookie alone)
  const {
    data: { user },
  } = await supabase.auth.getUser()
 
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL
  const { pathname } = request.nextUrl
 
  // 1. Login page is public. If the owner is already signed in, go to the dashboard.
  if (pathname === '/admin/login') {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return supabaseResponse
  }
 
  // 2. Everything else under /admin requires the owner account.
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (!isAdmin) {
      // Signed in, but not the owner (e.g. a customer who used Google sign-in)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
 
  return supabaseResponse
}
 
export const config = {
  matcher: ['/admin/:path*'],
}