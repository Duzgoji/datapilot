import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

    let targetOwnerIds: string[] = []

    if (isCron) {
      const { data: connections } = await supabaseAdmin
        .from('meta_connections')
        .select('owner_id, access_token, ad_account_id, selected_ad_account_id')
        .not('access_token', 'is', null)

      targetOwnerIds = (connections || [])
        .filter((connection) => connection.ad_account_id || connection.selected_ad_account_id)
        .map((connection) => connection.owner_id)
    } else {
      const body = await req.json().catch(() => ({}))
      if (body.owner_id) targetOwnerIds = [body.owner_id]
    }

    if (targetOwnerIds.length === 0) {
      return NextResponse.json({ message: 'Senkronize edilecek bağlantı yok' }, { status: 200 })
    }

    const results: Record<string, any> = {}

    for (const ownerId of targetOwnerIds) {
      try {
        const { data: conn } = await supabaseAdmin
          .from('meta_connections')
          .select('access_token, ad_account_id, selected_ad_account_id')
          .eq('owner_id', ownerId)
          .single()

        const effectiveAdAccountId = conn?.ad_account_id || conn?.selected_ad_account_id

        if (!conn?.access_token || !effectiveAdAccountId) {
          results[ownerId] = { error: 'Meta bağlantısı eksik' }
          continue
        }

        const cleanAccountId = effectiveAdAccountId.replace(/^act_/, '')
        // Eski hesap verilerini temizle
        await supabaseAdmin
        .from('ad_spend')
        .delete()
        .eq('owner_id', ownerId)
        .neq('ad_account_id', cleanAccountId)

        // Kampanyaları çek
        const campaignsRes = await fetch(
          `https://graph.facebook.com/v18.0/act_${cleanAccountId}/campaigns?fields=id,name,status&access_token=${conn.access_token}`
        )
        const campaignsData = await campaignsRes.json()
        const campaigns = campaignsData.data || []

        // Insights çek (son 90 gün)
        const since = new Date()
        since.setDate(since.getDate() - 90)
        const sinceStr = since.toISOString().split('T')[0]
        const untilStr = new Date().toISOString().split('T')[0]

        const fields = 'campaign_id,campaign_name,spend,impressions,clicks,date_start'
        const url = `https://graph.facebook.com/v18.0/act_${cleanAccountId}/insights?fields=${fields}&time_range={"since":"${sinceStr}","until":"${untilStr}"}&time_increment=1&level=campaign&access_token=${conn.access_token}`

        const res = await fetch(url)
        const json = await res.json()

        if (json.error) {
          results[ownerId] = { error: json.error.message }
          continue
        }

        const insightData = json.data || []

        // Harcama verisi yoksa kampanya listesini kaydet
        if (insightData.length === 0 && campaigns.length > 0) {
          const campRows = campaigns.map((c: any) => ({
            owner_id: ownerId,
            ad_account_id: cleanAccountId,
            campaign_id: c.id,
            campaign_name: c.name,
            date: untilStr,
            spend: 0,
            impressions: 0,
            clicks: 0,
            synced_at: new Date().toISOString(),
          }))
          await supabaseAdmin.from('ad_spend').upsert(campRows, { onConflict: 'owner_id,campaign_id,date' })
          results[ownerId] = { synced: campRows.length, message: 'Kampanyalar eklendi (harcama yok)' }
          continue
        }

        if (insightData.length === 0) {
          results[ownerId] = { synced: 0, message: 'Veri yok' }
          continue
        }

        const rows = insightData.map((item: any) => ({
          owner_id: ownerId,
          ad_account_id: cleanAccountId,
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

        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error: any) {
        results[ownerId] = { error: error.message }
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}