import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Meta'nın webhook'u doğrulaması için
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('WEBHOOK VERIFY:', { mode, token })

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('WEBHOOK DOĞRULANDI')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// Meta'dan gelen lead verilerini almak için
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('WEBHOOK DATA:', JSON.stringify(body))

    const entries = body.entry || []

    for (const entry of entries) {
      const changes = entry.changes || []

      for (const change of changes) {
        if (change.field === 'leadgen') {
          const leadId = change.value.leadgen_id
          const formId = change.value.form_id
          const adId = change.value.ad_id
          const pageId = entry.id

          console.log('YENİ LEAD:', { leadId, formId, adId, pageId })

          // Lead detaylarını Meta'dan çek
          await fetchAndSaveLead(leadId, pageId)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('WEBHOOK ERROR:', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

async function fetchAndSaveLead(leadId: string, pageId: string) {
  try {
    // Önce bu sayfaya ait token'ı bul
    const { data: connection } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!connection?.access_token) {
      console.log('TOKEN BULUNAMADI')
      return
    }

    // Meta'dan lead detaylarını çek
    const leadRes = await fetch(
      `https://graph.facebook.com/v18.0/${leadId}?access_token=${connection.access_token}`
    )
    const leadData = await leadRes.json()
    console.log('LEAD DATA:', JSON.stringify(leadData))

    if (!leadData.field_data) return

    // Form alanlarını düzenle
    const fields: Record<string, string> = {}
    for (const field of leadData.field_data) {
      fields[field.name] = field.values?.[0] || ''
    }

    // Veritabanına kaydet
    const { error } = await supabase.from('leads').insert({
      owner_id: connection.owner_id,
      first_name: fields['first_name'] || fields['ad'] || '',
      last_name: fields['last_name'] || fields['soyad'] || '',
      phone: fields['phone_number'] || fields['telefon'] || '',
      email: fields['email'] || fields['e_posta'] || '',
      source: 'meta',
      meta_lead_id: leadId,
      meta_form_id: leadData.form_id,
      meta_ad_id: leadData.ad_id,
      status: 'new',
      raw_data: leadData,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.log('DB KAYIT HATASI:', error)
    } else {
      console.log('LEAD KAYDEDİLDİ:', leadId)
    }
  } catch (error) {
    console.log('FETCH LEAD ERROR:', error)
  }
}