import { supabaseAdmin } from '@/lib/supabase/admin'

export async function upsertLead(data: any) {
  return await supabaseAdmin
    .from('leads')
    .upsert(data, { onConflict: 'meta_lead_id' })
}