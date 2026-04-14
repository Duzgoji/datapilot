import { findAssignableAgent } from '@/modules/leads/assignment.service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchMetaLead } from '@/modules/meta/meta.client'
import { normalizeMetaLead } from '@/modules/leads/metaLeadNormalizer'
import { upsertLead } from '@/modules/leads/lead.repository'

export async function processMetaWebhook(body: any) {
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
        console.log('AKTİF META CONNECTION BULUNAMADI:', { pageId, connectionError })
        continue
      }

      console.log('META CONNECTION FOUND:', {
      pageId,
      ownerId: connection.owner_id,
      hasAccessToken: !!connection.access_token,
      leadId,
     })

      let leadData: any

      if (String(leadId).startsWith('TEST_')) {
        console.log('TEST MODE AKTİF: Sahte lead verisi kullanılacak')

        leadData = {
          field_data: [
            { name: 'full_name', values: ['Test Kullanıcı'] },
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
        throw new Error('owner_id bulunamadı: meta_connections kaydını kontrol et')
      }

      console.log('OWNER ID DEBUG:', connection.owner_id)

      const assignedTo = await findAssignableAgent(connection.owner_id)

      console.log('ASSIGNABLE AGENT:', assignedTo)

   try {
  const { error: upsertError } = await upsertLead({
    owner_id: connection.owner_id,
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
    console.log('LEAD KAYDEDİLDİ / GÜNCELLENDİ:', leadId)
  }
} catch (err: any) {
  if (err.name === 'LeadLimitError') {
    console.warn(`[Meta Webhook] Lead limit aşıldı, owner: ${connection.owner_id}`)
    continue
  }
  throw err
}
    
    }
  }
}