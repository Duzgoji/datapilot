import { logAuditEvent } from '@/lib/audit/logAuditEvent'
import { enforceLeadLimit } from '@/lib/enforceLeadLimit'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function upsertLead(data: any) {
  // Meta webhook'tan gelen leadler meta_lead_id ile upsert edilir.
  // Ayni meta_lead_id varsa guncelleme sayilir, limit tuketilmez.
  const isUpdate = !!data.meta_lead_id
  let shouldLogCreate = !isUpdate

  if (!isUpdate) {
    await enforceLeadLimit(data.owner_id, 1)
  } else {
    const { data: existing } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('meta_lead_id', data.meta_lead_id)
      .maybeSingle()

    if (!existing) {
      await enforceLeadLimit(data.owner_id, 1)
      shouldLogCreate = true
    } else {
      shouldLogCreate = false
    }
  }

  const result = await supabaseAdmin
    .from('leads')
    .upsert(data, { onConflict: 'meta_lead_id' })
    .select('id, owner_id, customer_id, source')

  if (shouldLogCreate && Array.isArray(result.data)) {
    for (const lead of result.data) {
      await logAuditEvent({
        action: 'lead_created',
        entityType: 'lead',
        entityId: lead.id,
        userId: null,
        tenantId: lead.customer_id || lead.owner_id || data.owner_id || null,
        metadata: {
          source: lead.source || data.source || 'repository',
          owner_id: lead.owner_id || data.owner_id || null,
          customer_id: lead.customer_id || null,
        },
      })
    }
  }

  return result
}

export async function insertLeads(leads: any[], ownerId: string) {
  await enforceLeadLimit(ownerId, leads.length)

  const result = await supabaseAdmin
    .from('leads')
    .insert(leads)
    .select('id, owner_id, customer_id, source')

  if (Array.isArray(result.data)) {
    for (const lead of result.data) {
      await logAuditEvent({
        action: 'lead_created',
        entityType: 'lead',
        entityId: lead.id,
        userId: null,
        tenantId: lead.customer_id || lead.owner_id || ownerId,
        metadata: {
          source: lead.source || 'repository',
          owner_id: lead.owner_id || ownerId,
          customer_id: lead.customer_id || null,
        },
      })
    }
  }

  return result
}
