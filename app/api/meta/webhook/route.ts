import { NextRequest, NextResponse } from 'next/server'
import { processMetaWebhook } from '@/modules/meta/metaWebhook.service'

// Meta webhook doğrulama
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

// Meta'dan gelen webhook verisini işle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    await processMetaWebhook(body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('WEBHOOK ERROR:', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}