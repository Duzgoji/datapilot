import { NextRequest, NextResponse } from 'next/server'
import { LeadLimitError } from '@/lib/enforceLeadLimit'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'
import { findAssignableAgent } from '@/modules/leads/assignment.service'
import { insertLeads } from '@/modules/leads/lead.repository'

function getCanonicalCustomerId(tenant: Awaited<ReturnType<typeof resolveTenantContext>>) {
  return tenant.path === 'legacy_profile_fallback' ? null : tenant.tenantId
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Instagram DM payload yapısı
// Instagram webhook iki farklı format gönderebilir
const entries = body?.entry || []

// Test payload formatını da destekle
if (entries.length === 0 && body?.field === 'messages') {
  console.info('[Instagram Webhook] Test payload received', { source: 'instagram_webhook' })
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
    for (const entry of entries) {
        const pageId = entry.id
console.info('[Instagram Webhook] Entry received', { 
  source: 'instagram_webhook', 
  entry_id: pageId,
  body: JSON.stringify(body).slice(0, 500)
})
        const messagingEvents = entry.messaging || []

      if (!messagingEvents.length) continue

      // page_id ile meta_connections tablosundan owner_id bul
      const { data: connection } = await supabaseAdmin
        .from('meta_connections')
        .select('owner_id, access_token')
        .eq('page_id', pageId)
        .eq('is_active', true)
        .maybeSingle()

      if (!connection?.owner_id) {
        console.warn('[Instagram Webhook] No connection found for page', {
          source: 'instagram_webhook',
          page_id: pageId,
        })
        continue
      }

      const tenant = await resolveTenantContext(connection.owner_id)
      const ownerId = tenant.writeOwnerId
      const canonicalCustomerId = getCanonicalCustomerId(tenant)

      for (const event of messagingEvents) {
        // Sadece gelen mesajları işle (bot'un kendi gönderdiğini değil)
        if (!event.message || event.message.is_echo) continue

        const senderId = event.sender?.id
        const messageText = event.message?.text || ''
        const messageId = event.message?.mid || null

        if (!senderId) continue

        // Aynı Instagram kullanıcısından daha önce lead var mı?
        const { data: existingRows } = await supabaseAdmin
          .from('leads')
          .select('id, note')
          .in('owner_id', tenant.readOwnerIds)
          .eq('instagram_sender_id', senderId)
          .eq('source', 'instagram_dm')
          .limit(1)

        const existing = existingRows?.[0]

        if (existing?.id) {
          // Mevcut lead'e not ekle
          const nextNote = messageText
            ? [existing.note, messageText].filter(Boolean).join('\n\n').slice(-4000)
            : existing.note

          await supabaseAdmin
            .from('leads')
            .update({
              note: nextNote,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          console.info('[Instagram Webhook] Existing lead updated', {
            source: 'instagram_webhook',
            lead_id: existing.id,
            message_id: messageId,
          })
          continue
        }

        // Instagram kullanıcı adını çek
        let senderName = 'Instagram Kullanıcısı'
        try {
          const profileRes = await fetch(
            `https://graph.facebook.com/v18.0/${senderId}?fields=name&access_token=${connection.access_token}`
          )
          const profileData = await profileRes.json()
          if (profileData?.name) senderName = profileData.name
        } catch {
          // isim alınamazsa devam et
        }

        const assignedTo = await findAssignableAgent(tenant.tenantId)
        const leadCode = `IG-${String(Date.now()).slice(-6)}`

        try {
          const { data: newLeads, error } = await insertLeads(
            [
              {
                owner_id: ownerId,
                customer_id: canonicalCustomerId,
                assigned_to: assignedTo,
                lead_code: leadCode,
                full_name: senderName,
                phone: '',
                source: 'instagram_dm',
                note: messageText || null,
                status: 'new',
                instagram_sender_id: senderId,
              },
            ],
            tenant.tenantId
          )

          if (error) {
            console.error('[Instagram Webhook] Lead insert failed', {
              source: 'instagram_webhook',
              sender_id: senderId,
              message_id: messageId,
              message: error.message,
            })
          } else if (Array.isArray(newLeads) && newLeads.length > 0) {
            console.info('[Instagram Webhook] Lead created', {
              source: 'instagram_webhook',
              lead_id: newLeads[0].id,
              message_id: messageId,
              tenant_id: tenant.tenantId,
            })
          }
        } catch (error: unknown) {
          if (error instanceof LeadLimitError || (error instanceof Error && error.name === 'LeadLimitError')) {
            console.warn('[Instagram Webhook] Lead rejected - limit exceeded', {
              source: 'instagram_webhook',
              tenant_id: tenant.tenantId,
            })
            continue
          }

          console.error('[Instagram Webhook] Lead processing failed', {
            source: 'instagram_webhook',
            sender_id: senderId,
            message: error instanceof Error ? error.message : 'unknown_error',
          })
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error: unknown) {
    console.error('[Instagram Webhook] Unexpected error', {
      source: 'instagram_webhook',
      message: error instanceof Error ? error.message : 'unknown_error',
    })
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}