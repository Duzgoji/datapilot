import { createClient } from '@supabase/supabase-js'
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

function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url))
}

function extractAccessToken(request: NextRequest): string | null {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.includes('auth-token')) continue

    let value = cookie.value
    try {
      value = decodeURIComponent(value)
    } catch {
      // Use raw cookie value if decode fails.
    }

    try {
      const parsed = JSON.parse(value)
      if (typeof parsed === 'string') return parsed
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0]
      if (parsed && typeof parsed.access_token === 'string') return parsed.access_token
    } catch {
      if (value && value.split('.').length === 3) return value
    }
  }

  return null
}

function getRequiredRoles(pathname: string): string[] | null {
  const match = ROUTE_ACCESS.find((item) => pathname.startsWith(item.prefix))
  return match ? match.roles : null
}

function extractAdvertiserCustomerId(pathname: string): string | null {
  if (!pathname.startsWith('/advertiser/customers/')) return null

  const parts = pathname.split('/').filter(Boolean)
  // /advertiser/customers/:customerId(/...)
  if (parts.length < 3) return null

  const customerId = parts[2]
  return customerId || null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requiredRoles = getRequiredRoles(pathname)
  if (!requiredRoles) return NextResponse.next()

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return redirectTo('/login', request)
  }

  const accessToken = extractAccessToken(request)
  if (!accessToken) {
    return redirectTo('/login', request)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData } = await supabase.auth.getUser(accessToken)
  const user = authData?.user
  if (!user) {
    return redirectTo('/login', request)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return redirectTo('/login', request)
  }

  const role = profile?.role as string | undefined
  if (!role) {
    return redirectTo('/login', request)
  }

  if (!requiredRoles.includes(role)) {
    return redirectTo(ROLE_HOME[role] || '/login', request)
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
      return redirectTo('/advertiser/customers', request)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/advertiser/:path*',
    '/agent/:path*',
    '/manager/:path*',
    '/super-admin/:path*',
  ]
}