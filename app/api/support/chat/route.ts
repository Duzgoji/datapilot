import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `Sen DataPilot'un müşteri destek asistanısın. DataPilot, Meta reklamlarından lead toplayan, ekip yönetimi ve AI analitik sunan bir SaaS platformdur. 
        
Fiyatlar:
- Starter: ₺990/ay (3 kullanıcı, 1 şube, 500 lead/ay)
- Pro: ₺2.490/ay (15 kullanıcı, 5 şube, sınırsız lead)
- Enterprise: Özel fiyat (sınırsız her şey)

Her pakette 14 gün ücretsiz deneme var.

Kısa, samimi ve yardımsever cevaplar ver. Türkçe konuş.`,
        messages: [{ role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    const reply = data.content?.[0]?.text || 'Üzgünüm, şu an cevap veremiyorum.'

    return NextResponse.json({ reply })
  } catch (error) {
    return NextResponse.json({ reply: 'Bir hata oluştu, lütfen tekrar deneyin.' }, { status: 500 })
  }
}