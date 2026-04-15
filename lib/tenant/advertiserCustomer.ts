'use client'

import type { TenantResolution } from './resolveTenantId'
import { fetchTenantContext } from './client'

type AdvertiserCustomerLike = {
  id: string
  owner_id?: string | null
  name?: string | null
}

export async function resolveAdvertiserCustomerTenantContext(
  customer: AdvertiserCustomerLike
): Promise<TenantResolution> {
  try {
    return await fetchTenantContext(customer.id)
  } catch (error) {
    const fallbackOwnerId = customer.owner_id?.trim()
    if (!fallbackOwnerId) {
      throw error
    }

    console.warn('[Advertiser Tenant] Legacy fallback used', {
      source: 'advertiser_customer',
      reason: 'tenant_resolve_failed',
      customer_id: customer.id,
      owner_id: fallbackOwnerId,
    })

    return {
      input: customer.id,
      tenantId: customer.id,
      profileId: fallbackOwnerId,
      readOwnerIds: [customer.id, fallbackOwnerId],
      writeOwnerId: fallbackOwnerId,
      path: 'legacy_profile_fallback',
      usedLegacy: true,
    }
  }
}

export async function resolveAdvertiserCustomerTenantMap(
  customers: AdvertiserCustomerLike[]
): Promise<Record<string, TenantResolution>> {
  const entries = await Promise.all(
    customers.map(async (customer) => [customer.id, await resolveAdvertiserCustomerTenantContext(customer)] as const)
  )

  return Object.fromEntries(entries)
}

export function getAdvertiserCustomerOwnerIds(
  tenantMap: Record<string, TenantResolution>
): string[] {
  return Array.from(new Set(Object.values(tenantMap).flatMap((tenant) => tenant.readOwnerIds)))
}

export function findAdvertiserCustomerByInvoice(
  customers: AdvertiserCustomerLike[],
  tenantMap: Record<string, TenantResolution>,
  record: { customer_id?: string | null; owner_id?: string | null }
) {
  if (record.customer_id) {
    return customers.find((customer) => customer.id === record.customer_id) || null
  }

  if (!record.owner_id) {
    return null
  }

  const matchedCustomer =
    customers.find((customer) => tenantMap[customer.id]?.tenantId === record.owner_id) ||
    customers.find((customer) => tenantMap[customer.id]?.profileId === record.owner_id) ||
    null

  if (matchedCustomer) {
    console.info('[Advertiser Billing] Legacy invoice ownership fallback', {
      source: 'advertiser_billing',
      reason: 'invoice_owner_id_match',
      customer_id: matchedCustomer.id,
      owner_id: record.owner_id,
    })
  }

  return matchedCustomer
}
