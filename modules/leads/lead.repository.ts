import { supabaseAdmin } from '@/lib/supabase/admin'
import { enforceLeadLimit, LeadLimitError } from '@/lib/enforceLeadLimit'

export async function upsertLead(data: any) {
  // Meta webhook'tan gelen leadler meta_lead_id ile upsert edilir.
  // Aynı meta_lead_id varsa güncelleme sayılır, limit tüketilmez.
  const isUpdate = !!data.meta_lead_id

  if (!isUpdate) {
    await enforceLeadLimit(data.owner_id, 1)
  } else {
    // Mevcut lead var mı kontrol et
    const { data: existing } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('meta_lead_id', data.meta_lead_id)
      .maybeSingle()

    if (!existing) {
      // Yeni lead — limit kontrolü yap
      await enforceLeadLimit(data.owner_id, 1)
    }
    // Varsa güncelleme — limit tüketme
  }

  return await supabaseAdmin
    .from('leads')
    .upsert(data, { onConflict: 'meta_lead_id' })
}

// Bulk insert için ayrı fonksiyon
export async function insertLeads(leads: any[], ownerId: string) {
  await enforceLeadLimit(ownerId, leads.length)
  return await supabaseAdmin
    .from('leads')
    .insert(leads)
    .select('id')
}
