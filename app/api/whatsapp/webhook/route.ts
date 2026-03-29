import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// WhatsApp webhook doğrulama
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('WHATSAPP WEBHOOK DOĞRULANDI')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// WhatsApp'tan gelen mesajları işle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('WHATSAPP WEBHOOK BODY:', JSON.stringify(body))

    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value?.messages?.length) {
      return NextResponse.json({ success: true })
    }

    const message = value.messages[0]
    const contact = value.contacts?.[0]
    const phoneNumber = message.from // +905xx...
    const displayName = contact?.profile?.name || phoneNumber
    const waId = contact?.wa_id || phoneNumber
    const businessPhoneId = value.metadata?.phone_number_id

    if (!businessPhoneId) {
      console.log('PHONE NUMBER ID YOK')
      return NextResponse.json({ success: true })
    }

    // WhatsApp bağlantısını bul
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('phone_number_id', businessPhoneId)
      .eq('is_active', true)
      .maybeSingle()

    if (!connection) {
      console.log('WHATSAPP CONNECTION BULUNAMADI:', businessPhoneId)
      return NextResponse.json({ success: true })
    }

    // Aynı numaradan lead zaten var mı kontrol et
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('owner_id', connection.owner_id)
      .eq('phone', phoneNumber)
      .maybeSingle()

    if (existingLead) {
      console.log('LEAD ZATEN VAR:', phoneNumber)
      return NextResponse.json({ success: true })
    }

    // Yeni lead oluştur
    const leadCode = 'WA-' + Date.now().toString().slice(-6)
    const { error } = await supabase.from('leads').insert({
      lead_code: leadCode,
      owner_id: connection.owner_id,
      full_name: displayName,
      phone: phoneNumber,
      source: 'whatsapp',
      status: 'new',
      note: message.text?.body ? `İlk mesaj: ${message.text.body}` : 'WhatsApp\'tan geldi',
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.log('LEAD OLUŞTURMA HATASI:', error)
    } else {
      console.log('WHATSAPP LEAD KAYDEDİLDİ:', phoneNumber)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('WHATSAPP WEBHOOK ERROR:', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}