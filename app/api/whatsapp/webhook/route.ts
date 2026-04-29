import { NextRequest, NextResponse } from 'next/server'
import { LeadLimitError } from '@/lib/enforceLeadLimit'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'
import { findAssignableAgent } from '@/modules/leads/assignment.service'
import { insertLeads } from '@/modules/leads/lead.repository'

function normalizePhoneDigits(value: string | undefined | null) {
  return String(value || '').replace(/\D/g, '')
}

function buildPhoneVariants(input: string) {
  const digits = normalizePhoneDigits(input)
  if (!digits) return []

  const variants = new Set<string>([digits])

  if (digits.startsWith('90')) {
    variants.add(`0${digits.slice(2)}`)
    variants.add(`+${digits}`)
  }

  if (digits.startsWith('0')) {
    variants.add(`90${digits.slice(1)}`)
    variants.add(`+90${digits.slice(1)}`)
  }

  if (!digits.startsWith('0') && !digits.startsWith('90') && digits.length === 10) {
    variants.add(`0${digits}`)
    variants.add(`90${digits}`)
    variants.add(`+90${digits}`)
  }

  return Array.from(variants)
}

function getPhoneForStorage(input: string) {
  const digits = normalizePhoneDigits(input)
  if (!digits) return ''
  if (digits.startsWith('90') && digits.length === 12) return `0${digits.slice(2)}`
  if (!digits.startsWith('0') && digits.length === 10) return `0${digits}`
  return digits
}

function getCanonicalCustomerId(tenant: Awaited<ReturnType<typeof resolveTenantContext>>) {
  return tenant.path === 'legacy_profile_fallback' ? null : tenant.tenantId
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payloads = (body?.entry || []).flatMap((entry: any) =>
      (entry?.changes || []).map((change: any) => ({
        messages: change?.value?.messages || [],
        phoneNumberId: change?.value?.metadata?.phone_number_id || null,
      }))
    )

    if (payloads.length === 0) {
      console.warn('[WhatsApp Webhook] Ignored payload', {
        source: 'whatsapp_webhook',
        reason: 'no_changes',
      })
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    for (const payload of payloads) {
      const messages = Array.isArray(payload.messages) ? payload.messages : []
      const phoneNumberId = payload.phoneNumberId

      if (!messages.length) {
        console.warn('[WhatsApp Webhook] Ignored payload', {
          source: 'whatsapp_webhook',
          reason: 'no_messages',
        })
        continue
      }

      if (!phoneNumberId) {
        console.warn('[WhatsApp Webhook] Ignored payload', {
          source: 'whatsapp_webhook',
          reason: 'missing_phone_number_id',
        })
        continue
      }

      const { data: connection, error: connectionError } = await supabaseAdmin
        .from('whatsapp_connections')
        .select('owner_id, phone_number_id, is_active, access_token')
        .eq('phone_number_id', phoneNumberId)
        .eq('is_active', true)
        .maybeSingle()

      if (connectionError || !connection?.owner_id) {
        console.warn('[WhatsApp Webhook] Missing connection mapping', {
          source: 'whatsapp_webhook',
          reason: 'missing_whatsapp_connection',
          phone_number_id: phoneNumberId,
          has_connection_error: !!connectionError,
        })
        continue
      }

      const tenant = await resolveTenantContext(connection.owner_id)
      const ownerId = tenant.writeOwnerId
      const canonicalCustomerId = getCanonicalCustomerId(tenant)

      for (const message of messages) {
        if (message.type !== 'text') {
          console.info('[WhatsApp Webhook] Non-text message skipped', {
            source: 'whatsapp_webhook',
            message_type: message.type,
            phone_number_id: phoneNumberId,
        })
        continue
      }

      const rawPhone = message.from
      const storagePhone = getPhoneForStorage(rawPhone)
      const variants = buildPhoneVariants(rawPhone)
      const text = String(message.text?.body || '').trim()
      const messageId = message.id || null

      if (!storagePhone) {
        console.warn('[WhatsApp Webhook] Missing sender phone', {
          source: 'whatsapp_webhook',
          reason: 'missing_sender_phone',
          phone_number_id: phoneNumberId,
        })
        continue
      }

      const { data: existingRows, error: existingError } = await supabaseAdmin
        .from('leads')
        .select('id, note, full_name')
        .in('owner_id', tenant.readOwnerIds)
        .in('phone', variants)
        .eq('source', 'whatsapp')
        .limit(1)

      if (existingError) {
        console.error('[WhatsApp Webhook] Existing lead lookup failed', {
          source: 'whatsapp_webhook',
          phone_number_id: phoneNumberId,
          message: existingError.message,
        })
        continue
      }

      const existing = existingRows?.[0]

      if (existing?.id) {
        const nextNote = text
          ? [existing.note, text].filter(Boolean).join('\n\n').slice(-4000)
          : existing.note

        const { error: updateError } = await supabaseAdmin
          .from('leads')
          .update({
            phone: storagePhone,
            note: nextNote,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('[WhatsApp Webhook] Existing lead update failed', {
            source: 'whatsapp_webhook',
            lead_id: existing.id,
            message_id: messageId,
            message: updateError.message,
          })
        } else {
          console.info('[WhatsApp Webhook] Existing lead updated', {
            source: 'whatsapp_webhook',
            lead_id: existing.id,
            message_id: messageId,
          })
        }
        continue
      }

      const assignedTo = await findAssignableAgent(tenant.tenantId)
      const leadCode = `WA-${String(Date.now()).slice(-6)}`

        try {
          const { data: newLeads, error } = await insertLeads(
            [
              {
                owner_id: ownerId,
                customer_id: canonicalCustomerId,
                assigned_to: assignedTo,
                lead_code: leadCode,
                full_name: 'WhatsApp Kullanıcısı',
                phone: storagePhone,
                source: 'whatsapp',
                note: text || null,
                status: 'new',
              },
            ],
            tenant.tenantId
          )

          if (error) {
            console.error('[WhatsApp Webhook] Lead insert failed', {
              source: 'whatsapp_webhook',
              phone_number_id: phoneNumberId,
              message_id: messageId,
              message: error.message,
            })
          } else if (Array.isArray(newLeads) && newLeads.length > 0) {
            console.info('[WhatsApp Webhook] Lead created', {
              source: 'whatsapp_webhook',
              lead_id: newLeads[0].id,
              message_id: messageId,
              tenant_id: tenant.tenantId,
              assigned_to: assignedTo,
            })
          }
        } catch (error: unknown) {
          if (error instanceof LeadLimitError || (error instanceof Error && error.name === 'LeadLimitError')) {
            console.warn('[WhatsApp Webhook] Lead rejected', {
              source: 'whatsapp_webhook',
              reason: 'lead_limit_exceeded',
              tenant_id: tenant.tenantId,
              phone_number_id: phoneNumberId,
            })
            continue
          }

          console.error('[WhatsApp Webhook] Lead processing failed', {
            source: 'whatsapp_webhook',
            phone_number_id: phoneNumberId,
            message_id: messageId,
            message: error instanceof Error ? error.message : 'unknown_error',
          })
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error: unknown) {
    console.error('[WhatsApp Webhook] Unexpected error', {
      source: 'whatsapp_webhook',
      message: error instanceof Error ? error.message : 'unknown_error',
    })
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}
