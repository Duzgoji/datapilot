import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { summary } = await request.json()

    const prompt = `Sen bir satış ve pazarlama analistisin. Aşağıdaki verilere bakarak Türkçe, anlaşılır ve actionable (uygulanabilir) bir analiz raporu yaz.

VERİLER:
- Toplam Lead: ${summary.toplamLead}
- Toplam Satış: ${summary.toplamSatis}
- Dönüşüm Oranı: ${summary.donusumOrani}
- Toplam Ciro: ${summary.toplamCiro}

Aylık Trend:
${JSON.stringify(summary.aylikVeri, null, 2)}

Kaynak Dağılımı:
${JSON.stringify(summary.kaynakDagilimi, null, 2)}

Satışçı Performansı:
${JSON.stringify(summary.satisciPerformansi, null, 2)}

Durum Dağılımı:
${JSON.stringify(summary.durumDagilimi, null, 2)}

Lütfen şu başlıkları içeren bir rapor yaz:
1. Genel Değerlendirme
2. Güçlü Yönler
3. Dikkat Edilmesi Gereken Noktalar
4. Öneriler

Raporu kısa, net ve uygulanabilir tut. Madde madde yaz.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const report = data.content?.[0]?.text || 'Rapor oluşturulamadı.'

    return NextResponse.json({ report })
  } catch (error) {
    console.log('RAPOR HATASI:', error)
    return NextResponse.json({ error: 'Rapor oluşturulamadı' }, { status: 500 })
  }
}