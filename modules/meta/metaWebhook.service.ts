import { LeadLimitError } from '@/lib/enforceLeadLimit'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'
import { findAssignableAgent } from '@/modules/leads/assignment.service'
import { upsertLead } from '@/modules/leads/lead.repository'
import { normalizeMetaLead } from '@/modules/leads/metaLeadNormalizer'
import { fetchMetaLead } from '@/modules/meta/meta.client'

type MetaLeadField = {
  name: string
  values: string[]
}

type MetaLeadPayload = {
  field_data?: MetaLeadField[]
}

type MetaWebhookBody = {
  entry?: Array<{
    id?: string
    changes?: Array<{
      field?: string
      value?: {
        leadgen_id?: string
      }
    }>
  }>
}

function getCanonicalCustomerId(tenant: Awaited<ReturnType<typeof resolveTenantContext>>) {
  return tenant.path === 'legacy_profile_fallback' ? null : tenant.tenantId
}

export async function processMetaWebhook(body: MetaWebhookBody) {
  const entries = body.entry || []

  for (const entry of entries) {
    const pageId = entry.id
    const changes = entry.changes || []

    for (const change of changes) {
      if (change.field !== 'leadgen') continue

      const leadId = change?.value?.leadgen_id
      if (!leadId || !pageId) continue

      const { data: connection, error: connectionError } = await supabaseAdmin
        .from('meta_connections')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_active', true)
        .single()

      if (connectionError || !connection?.access_token) {
        console.warn('[Meta Webhook] Active connection not found', {
          source: 'meta_webhook',
          page_id: pageId,
          reason: 'missing_active_connection',
          has_connection_error: !!connectionError,
        })
        continue
      }

      let leadData: MetaLeadPayload | null = null

      if (String(leadId).startsWith('TEST_')) {
        leadData = {
          field_data: [
            { name: 'full_name', values: ['Test Kullanici'] },
            { name: 'phone_number', values: ['05550000000'] },
            { name: 'email', values: ['test@example.com'] },
          ],
        }
      } else {
        leadData = await fetchMetaLead(leadId, connection.access_token)
      }

      if (!leadData?.field_data) {
        console.warn('[Meta Webhook] Lead payload missing field_data', {
          source: 'meta_webhook',
          lead_id: leadId,
          page_id: pageId,
        })
        continue
      }

      if (!connection.owner_id) {
        throw new Error('owner_id bulunamadi: meta_connections kaydini kontrol et')
      }

      const normalized = normalizeMetaLead(leadData)
      const tenant = await resolveTenantContext(connection.owner_id)
      const assignedTo = await findAssignableAgent(tenant.tenantId)
      const canonicalCustomerId = getCanonicalCustomerId(tenant)

      try {
        const { error: upsertError } = await upsertLead({
          owner_id: tenant.writeOwnerId,
          customer_id: canonicalCustomerId,
          assigned_to: assignedTo,
          full_name: normalized.full_name || 'Meta Lead',
          phone: normalized.phone,
          email: normalized.email,
          source: 'meta_form',
          meta_lead_id: leadId,
          lead_code: `MT-${String(leadId).slice(-8)}`,
          note: 'Meta form leadi',
          status: 'new',
          created_at: new Date().toISOString(),
        })

        if (upsertError) {
          console.error('[Meta Webhook] Lead upsert failed', {
            source: 'meta_webhook',
            lead_id: leadId,
            tenant_id: tenant.tenantId,
            message: upsertError.message,
          })
        } else {
          console.info('[Meta Webhook] Lead saved', {
            source: 'meta_webhook',
            lead_id: leadId,
            tenant_id: tenant.tenantId,
            assigned_to: assignedTo,
          })
        }
      } catch (error: unknown) {
        if (error instanceof LeadLimitError || (error instanceof Error && error.name === 'LeadLimitError')) {
          console.warn('[Meta Webhook] Lead rejected', {
            source: 'meta_webhook',
            reason: 'lead_limit_exceeded',
            tenant_id: tenant.tenantId,
            lead_id: leadId,
          })
          continue
        }

        throw error
      }
    }
  }
}
