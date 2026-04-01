import 'server-only'

import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './supabase'

/** Matches middleware.ts ROLE_HOME for redirect targets. */
const ROLE_HOME: Record<string, string> = {
  superadmin: '/super-admin',
  super_admin: '/super-admin',
  advertiser: '/advertiser',
  customer: '/customer',
  manager: '/manager',
  agent: '/agent',
  team: '/agent',
}

export type CurrentUserProfile = {
  id: string
  role: string
  email?: string | null
  full_name?: string | null
  company_name?: string | null
  [key: string]: unknown
}

/**
 * Returns the current Supabase user from the server session, or null if unauthenticated.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}

/**
 * Loads the row from `profiles` for the current session user.
 * Returns null if there is no session or no profile row.
 */
export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null
  return profile as CurrentUserProfile
}

/**
 * Ensures the user is signed in and their profile role is one of `allowedRoles`.
 * Otherwise redirects to the role home or `/login`.
 */
export async function requireRole(allowedRoles: string[]): Promise<void> {
  const profile = await getCurrentUserProfile()
  if (!profile?.role) {
    redirect('/login')
  }
  if (!allowedRoles.includes(profile.role)) {
    redirect(ROLE_HOME[profile.role] ?? '/login')
  }
}

/**
 * Advertiser customer workspace guard (mirrors middleware workspace check).
 * - superadmin / super_admin: always allowed
 * - advertiser: must have a row in workspace_members for this customer
 * - any other role: redirected to that role's home
 */
export async function requireAdvertiserWorkspaceAccess(
  customerId: string
): Promise<void> {
  const profile = await getCurrentUserProfile()
  if (!profile?.role) {
    redirect('/login')
  }

  const role = profile.role
  if (role === 'superadmin' || role === 'super_admin') {
    return
  }

  if (role !== 'advertiser') {
    redirect(ROLE_HOME[role] ?? '/login')
  }

  const supabase = await createServerSupabaseClient()
  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('user_id', profile.id)
    .eq('customer_id', customerId)
    .maybeSingle()

  if (error || !membership) {
    redirect('/advertiser/customers')
  }
}
