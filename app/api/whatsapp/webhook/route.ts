import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { LeadLimitError } from '@/lib/enforceLeadLimit'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'
import { insertLeads } from '@/modules/leads/lead.repository'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages
    const phoneNumberId = value?.metadata?.phone_number_id

    if (!messages || messages.length === 0) {
      console.warn('[WhatsApp Webhook] Invalid payload', {
        source: 'whatsapp',
        reason: 'no_messages',
      })
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    if (!phoneNumberId) {
      console.warn('[WhatsApp Webhook] Invalid payload', {
        source: 'whatsapp',
        reason: 'missing_phone_number_id',
      })
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('owner_id, phone_number_id, is_active')
      .eq('phone_number_id', phoneNumberId)
      .eq('is_active', true)
      .maybeSingle()

    if (connectionError || !connection?.owner_id) {
      console.warn('[WhatsApp Webhook] Missing connection mapping', {
        source: 'whatsapp',
        reason: 'missing_whatsapp_connection',
        phone_number_id: phoneNumberId,
        has_connection_error: !!connectionError,
      })
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    const tenant = await resolveTenantContext(connection.owner_id)
    const ownerId = tenant.writeOwnerId

    for (const message of messages) {
      if (message.type !== 'text') {
        console.log('[WhatsApp Webhook] Non-text message, skipping:', message.type)
        continue
      }

      const phone = message.from
      const text = message.text?.body || ''

      const { data: existing } = await supabaseAdmin
        .from('leads')
        .select('id')
        .in('owner_id', tenant.readOwnerIds)
        .eq('phone', phone)
        .eq('source', 'whatsapp')
        .limit(1)

      if (existing && existing.length > 0) {
        console.log('[WhatsApp Webhook] Lead already exists for phone:', phone)
        continue
      }

      const leadCode = 'WA-' + Date.now().toString().slice(-6)

      try {
        const { data: newLeads, error } = await insertLeads(
          [
            {
              owner_id: ownerId,
              lead_code: leadCode,
              full_name: 'WhatsApp Kullanıcısı',
              phone,
              source: 'whatsapp',
              note: text,
              status: 'new',
            },
          ],
          tenant.tenantId
        )

        if (error) {
          console.error('[WhatsApp Webhook] Lead insert error:', error)
        } else if (Array.isArray(newLeads) && newLeads.length > 0) {
          console.log('[WhatsApp Webhook] Lead created:', newLeads[0].id)
        } else {
          console.warn('[WhatsApp Webhook] No lead returned after insert', {
            source: 'whatsapp',
          })
        }
      } catch (err: unknown) {
        if (err instanceof LeadLimitError || (err instanceof Error && err.name === 'LeadLimitError')) {
          console.error('[WhatsApp Webhook] Lead rejected', {
            owner_id: tenant.tenantId,
            source: 'whatsapp',
            reason: 'lead_limit_exceeded',
          })
          continue
        }

        throw err
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err: unknown) {
    console.error('[WhatsApp Webhook] Unexpected error:', err)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}
