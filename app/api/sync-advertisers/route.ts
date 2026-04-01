import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Auth'daki tüm kullanıcıları çek
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // role: 'advertiser' olan kullanıcıları filtrele
    const advertisers = users.filter(u => u.user_metadata?.role === 'advertiser')

    if (advertisers.length === 0) {
      return NextResponse.json({ message: 'Senkronize edilecek reklamcı bulunamadı', synced: 0 })
    }

    let synced = 0
    const errors: string[] = []

    for (const user of advertisers) {
      // Profiles tablosuna upsert et
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        role: 'advertiser',
        is_active: true,
      }, { onConflict: 'id', ignoreDuplicates: false })

      if (profileError) {
        errors.push(`${user.email}: ${profileError.message}`)
        continue
      }

      // advertiser_subscriptions yoksa oluştur
      const { data: existingSub } = await supabaseAdmin
        .from('advertiser_subscriptions')
        .select('id')
        .eq('advertiser_id', user.id)
        .single()

      if (!existingSub) {
        await supabaseAdmin.from('advertiser_subscriptions').insert({
          advertiser_id: user.id,
          monthly_fee: 0,
          per_client_fee: 0,
          status: 'active'
        })
      }

      synced++
    }

    return NextResponse.json({ ok: true, synced, errors })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
