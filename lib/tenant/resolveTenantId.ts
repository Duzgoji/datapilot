import 'server-only'

import { supabaseAdmin } from '@/lib/supabase/admin'

type ResolutionPath = 'customer_id' | 'profile_owner_id' | 'legacy_profile_fallback'

export type TenantResolution = {
  input: string
  tenantId: string
  profileId: string
  readOwnerIds: string[]
  writeOwnerId: string
  path: ResolutionPath
  usedLegacy: boolean
}

function logTenantResolution(resolution: TenantResolution) {
  const payload = {
    input: resolution.input,
    tenant_id: resolution.tenantId,
    profile_id: resolution.profileId,
    read_owner_ids: resolution.readOwnerIds,
    source: 'tenant_resolver',
    path: resolution.path,
  }

  if (resolution.usedLegacy) {
    console.warn('[Tenant Resolver] Legacy path used', payload)
    return
  }

  console.info('[Tenant Resolver] Canonical path used', payload)
}

export async function resolveTenantContext(input: string): Promise<TenantResolution> {
  const normalizedInput = input?.trim()
  if (!normalizedInput) {
    throw new Error('resolveTenantContext requires a non-empty input')
  }

  const { data: tenantById, error: tenantByIdError } = await supabaseAdmin
    .from('customers')
    .select('id, owner_id')
    .eq('id', normalizedInput)
    .limit(1)
    .maybeSingle()

  if (tenantByIdError) {
    console.error('[Tenant Resolver] Failed to resolve by customer id', {
      input: normalizedInput,
      source: 'tenant_resolver',
      reason: 'customer_lookup_failed',
      message: tenantByIdError.message,
    })
  }

  if (tenantById?.id && tenantById.owner_id) {
    const resolution: TenantResolution = {
      input: normalizedInput,
      tenantId: tenantById.id,
      profileId: tenantById.owner_id,
      readOwnerIds: [tenantById.id, tenantById.owner_id],
      writeOwnerId: tenantById.id,
      path: 'customer_id',
      usedLegacy: false,
    }
    logTenantResolution(resolution)
    return resolution
  }

  const { data: tenantByProfile, error: tenantByProfileError } = await supabaseAdmin
    .from('customers')
    .select('id, owner_id')
    .eq('owner_id', normalizedInput)
    .limit(1)
    .maybeSingle()

  if (tenantByProfileError) {
    console.error('[Tenant Resolver] Failed to resolve by profile owner id', {
      input: normalizedInput,
      source: 'tenant_resolver',
      reason: 'profile_lookup_failed',
      message: tenantByProfileError.message,
    })
  }

  if (tenantByProfile?.id && tenantByProfile.owner_id) {
    const resolution: TenantResolution = {
      input: normalizedInput,
      tenantId: tenantByProfile.id,
      profileId: tenantByProfile.owner_id,
      readOwnerIds: [tenantByProfile.id, tenantByProfile.owner_id],
      writeOwnerId: tenantByProfile.id,
      path: 'profile_owner_id',
      usedLegacy: true,
    }
    logTenantResolution(resolution)
    return resolution
  }

  const resolution: TenantResolution = {
    input: normalizedInput,
    tenantId: normalizedInput,
    profileId: normalizedInput,
    readOwnerIds: [normalizedInput],
    writeOwnerId: normalizedInput,
    path: 'legacy_profile_fallback',
    usedLegacy: true,
  }
  logTenantResolution(resolution)
  return resolution
}

export async function resolveTenantId(input: string): Promise<string> {
  const resolution = await resolveTenantContext(input)
  return resolution.tenantId
}

export async function getTenantOwnerIds(input: string): Promise<string[]> {
  const resolution = await resolveTenantContext(input)
  return resolution.readOwnerIds
}
