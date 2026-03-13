// app/api/sync-ad-spend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vercel cron veya manuel tetikleme için
export async function POST(req: NextRequest) {
  try {
    // Cron güvenlik kontrolü
    const authHeader = req.headers.get('authorization')
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
    
    // Manuel tetikleme için owner_id body'den gelir
    let targetOwnerIds: string[] = []

    if (isCron) {
      // Tüm aktif meta bağlantılarını çek
      const { data: connections } = await supabaseAdmin
        .from('meta_connections')
        .select('owner_id, access_token, ad_account_id')
        .not('access_token', 'is', null)
        .not('ad_account_id', 'is', null)
      
      targetOwnerIds = (connections || []).map(c => c.owner_id)
    } else {
      // Manuel: sadece istekte gelen owner_id
      const body = await req.json().catch(() => ({}))
      if (body.owner_id) targetOwnerIds = [body.owner_id]
    }

    if (targetOwnerIds.length === 0) {
      return NextResponse.json({ message: 'Senkronize edilecek bağlantı yok' }, { status: 200 })
    }

    const results: Record<string, any> = {}

    for (const ownerId of targetOwnerIds) {
      try {
        // Bu owner'ın meta bağlantısını al
        const { data: conn } = await supabaseAdmin
          .from('meta_connections')
          .select('access_token, ad_account_id')
          .eq('owner_id', ownerId)
          .single()

        if (!conn?.access_token || !conn?.ad_account_id) {
          results[ownerId] = { error: 'Meta bağlantısı eksik' }
          continue
        }

        // Son 30 günün verilerini çek
        const since = new Date()
        since.setDate(since.getDate() - 30)
        const sinceStr = since.toISOString().split('T')[0]
        const untilStr = new Date().toISOString().split('T')[0]

        const fields = 'campaign_id,campaign_name,spend,impressions,clicks,date_start'
        const url = `https://graph.facebook.com/v18.0/act_${conn.ad_account_id}/insights?fields=${fields}&time_range={"since":"${sinceStr}","until":"${untilStr}"}&time_increment=1&level=campaign&access_token=${conn.access_token}`

        const res = await fetch(url)
        const json = await res.json()

        if (json.error) {
          results[ownerId] = { error: json.error.message }
          continue
        }

        const insightData = json.data || []

        if (insightData.length === 0) {
          results[ownerId] = { synced: 0, message: 'Veri yok' }
          continue
        }

        // Supabase'e upsert
        const rows = insightData.map((item: any) => ({
          owner_id: ownerId,
          ad_account_id: conn.ad_account_id,
          campaign_id: item.campaign_id,
          campaign_name: item.campaign_name,
          date: item.date_start,
          spend: parseFloat(item.spend || '0'),
          impressions: parseInt(item.impressions || '0'),
          clicks: parseInt(item.clicks || '0'),
          synced_at: new Date().toISOString(),
        }))

        const { error: upsertError } = await supabaseAdmin
          .from('ad_spend')
          .upsert(rows, { onConflict: 'owner_id,campaign_id,date' })

        if (upsertError) {
          results[ownerId] = { error: upsertError.message }
        } else {
          results[ownerId] = { synced: rows.length }
        }

        // Meta API rate limit için kısa bekleme
        await new Promise(r => setTimeout(r, 200))

      } catch (err: any) {
        results[ownerId] = { error: err.message }
      }
    }

    return NextResponse.json({ ok: true, results })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Vercel cron GET ile de çağırabilir
export async function GET(req: NextRequest) {
  return POST(req)
}