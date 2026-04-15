import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'
import { findAssignableAgent } from '@/modules/leads/assignment.service'
import { normalizeMetaLead } from '@/modules/leads/metaLeadNormalizer'
import { fetchMetaLead } from '@/modules/meta/meta.client'
import { upsertLead } from '@/modules/leads/lead.repository'

type MetaLeadField = {
  name: string
  values: string[]
}

type MetaLeadPayload = {
  field_data?: MetaLeadField[]
}

export async function processMetaWebhook(body: { entry?: Array<{ id?: string; changes?: Array<{ field?: string; value?: { leadgen_id?: string } }> }> }) {
  const entries = body.entry || []

  for (const entry of entries) {
    const pageId = entry.id
    const changes = entry.changes || []

    for (const change of changes) {
      if (change.field !== 'leadgen') continue

      const leadId = change?.value?.leadgen_id
      if (!leadId) continue

      const { data: connection, error: connectionError } = await supabaseAdmin
        .from('meta_connections')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_active', true)
        .single()

      if (connectionError || !connection?.access_token) {
        console.log('AKTIF META CONNECTION BULUNAMADI:', { pageId, connectionError })
        continue
      }

      console.log('META CONNECTION FOUND:', {
        pageId,
        ownerId: connection.owner_id,
        hasAccessToken: !!connection.access_token,
        leadId,
      })

      let leadData: MetaLeadPayload | null = null

      if (String(leadId).startsWith('TEST_')) {
        console.log('TEST MODE AKTIF: Sahte lead verisi kullanilacak')

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

      console.log('META LEAD FETCH SUCCESS:', {
        leadId,
        hasFieldData: !!leadData?.field_data,
      })

      if (!leadData?.field_data) {
        console.log('LEAD DATA field_data YOK:', leadId)
        continue
      }

      const normalized = normalizeMetaLead(leadData)

      if (!connection.owner_id) {
        throw new Error('owner_id bulunamadi: meta_connections kaydini kontrol et')
      }

      const tenant = await resolveTenantContext(connection.owner_id)

      console.log('OWNER ID DEBUG:', {
        rawOwnerId: connection.owner_id,
        tenantId: tenant.tenantId,
        profileId: tenant.profileId,
      })

      const assignedTo = await findAssignableAgent(tenant.tenantId)

      console.log('ASSIGNABLE AGENT:', assignedTo)

      try {
        const { error: upsertError } = await upsertLead({
          owner_id: tenant.writeOwnerId,
          assigned_to: assignedTo,
          full_name: normalized.full_name,
          phone: normalized.phone,
          email: normalized.email,
          source: 'meta',
          meta_lead_id: leadId,
          status: 'new',
          created_at: new Date().toISOString(),
        })

        if (upsertError) {
          console.log('LEAD UPSERT HATASI:', upsertError)
        } else {
          console.log('LEAD KAYDEDILDI / GUNCELLENDI:', leadId)
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'LeadLimitError') {
          console.warn(`[Meta Webhook] Lead limit asildi, owner: ${tenant.tenantId}`)
          continue
        }
        throw err
      }
    }
  }
}
