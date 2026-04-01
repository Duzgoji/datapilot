import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const ROLE_HOME: Record<string, string> = {
  superadmin: '/super-admin',
  super_admin: '/super-admin',
  advertiser: '/advertiser',
  customer: '/customer',
  manager: '/manager',
  agent: '/agent',
  team: '/agent',
}

const ROUTE_ACCESS: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/super-admin', roles: ['superadmin', 'super_admin'] },
  { prefix: '/advertiser', roles: ['advertiser'] },
  { prefix: '/customer', roles: ['customer'] },
  { prefix: '/manager', roles: ['manager'] },
  // Keep existing protected route behavior for agents/teams.
  { prefix: '/agent', roles: ['agent', 'team'] },
]

function redirectTo(path: string, request: NextRequest, fromResponse: NextResponse) {
  const res = NextResponse.redirect(new URL(path, request.url))
  fromResponse.cookies.getAll().forEach((c) => {
    res.cookies.set(c.name, c.value)
  })
  return res
}

function getRequiredRoles(pathname: string): string[] | null {
  const match = ROUTE_ACCESS.find((item) => pathname.startsWith(item.prefix))
  return match ? match.roles : null
}

function extractAdvertiserCustomerId(pathname: string): string | null {
  if (!pathname.startsWith('/advertiser/customers/')) return null

  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < 3) return null

  const customerId = parts[2]
  return customerId || null
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const { pathname } = request.nextUrl
  const requiredRoles = getRequiredRoles(pathname)
  if (!requiredRoles) return response

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return redirectTo('/login', request, response)
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirectTo('/login', request, response)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role || user.user_metadata?.role) as string | undefined
  if (!role) {
    return redirectTo('/login', request, response)
  }

  if (!requiredRoles.includes(role)) {
    return redirectTo(ROLE_HOME[role] || '/login', request, response)
  }

  const customerId = extractAdvertiserCustomerId(pathname)
  if (
    customerId &&
    role !== 'superadmin' &&
    role !== 'super_admin'
  ) {
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('customer_id', customerId)
      .maybeSingle()

    if (membershipError || !membership) {
      return redirectTo('/advertiser/customers', request, response)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/advertiser/:path*',
    '/agent/:path*',
    '/manager/:path*',
    '/super-admin/:path*',
  ],
}
