import { NextRequest, NextResponse } from 'next/server'
import { processMetaWebhook } from '@/modules/meta/metaWebhook.service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    await processMetaWebhook(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Meta Webhook] Processing failed', {
      source: 'meta_webhook',
      message: error instanceof Error ? error.message : 'unknown_error',
    })
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
