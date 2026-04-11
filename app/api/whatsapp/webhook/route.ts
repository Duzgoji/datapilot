import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET: Webhook verification ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('[WhatsApp Webhook] Verification request:', { mode, token })

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  console.log('[WhatsApp Webhook] Verification failed')
  return new NextResponse('Forbidden', { status: 403 })
}

// ── POST: Incoming messages ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[WhatsApp Webhook] Incoming payload:', JSON.stringify(body, null, 2))

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      console.log('[WhatsApp Webhook] No messages found, skipping')
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    for (const message of messages) {
      if (message.type !== 'text') {
        console.log('[WhatsApp Webhook] Non-text message, skipping:', message.type)
        continue
      }

      const phone = message.from
      const text = message.text?.body || ''

      console.log('[WhatsApp Webhook] Message received:', { phone, text })

      // Duplicate check
      const { data: existing } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone', phone)
        .eq('source', 'whatsapp')
        .limit(1)

      if (existing && existing.length > 0) {
        console.log('[WhatsApp Webhook] Lead already exists for phone:', phone)
        continue
      }

      // Insert lead
      const leadCode = 'WA-' + Date.now().toString().slice(-6)
      const { data: newLead, error } = await supabaseAdmin
        .from('leads')
        .insert({
          lead_code: leadCode,
          full_name: 'WhatsApp Kullanıcısı',
          phone: phone,
          source: 'whatsapp',
          note: text,
          status: 'new',
        })
        .select()
        .single()

      if (error) {
        console.error('[WhatsApp Webhook] Lead insert error:', error)
      } else {
        console.log('[WhatsApp Webhook] Lead created:', newLead?.id)
      }
    }

    // Her zaman 200 dön — Meta aksi halde tekrar gönderir
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Unexpected error:', err)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}