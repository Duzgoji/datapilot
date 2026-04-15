'use client'

import { supabase } from '@/lib/supabase/client'
import type { TenantResolution } from './resolveTenantId'

type TenantWriteContext = Pick<
  TenantResolution,
  'tenantId' | 'profileId' | 'path' | 'usedLegacy'
>

export async function fetchTenantContext(input: string): Promise<TenantResolution> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch('/api/tenant/resolve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ input }),
  })

  const json = (await res.json()) as { data?: TenantResolution; error?: string }
  if (!res.ok || !json.data) {
    throw new Error(json.error || 'Tenant cozumleme basarisiz')
  }

  return json.data
}

export function logTenantWriteUsage(
  tenant: TenantWriteContext,
  source: string,
  resource: string
) {
  const payload = {
    source,
    resource,
    tenant_id: tenant.tenantId,
    profile_id: tenant.profileId,
    path: tenant.path,
  }

  if (tenant.usedLegacy) {
    console.warn('[Tenant Write] Legacy fallback write used', payload)
    return
  }

  console.info('[Tenant Write] Canonical write used', payload)
}

export function getCanonicalCustomerId(tenant: Pick<TenantResolution, 'tenantId' | 'path'>) {
  return tenant.path === 'legacy_profile_fallback' ? null : tenant.tenantId
}
