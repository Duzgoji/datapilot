import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const ownerId = formData.get('owner_id') as string

    if (!file || !ownerId) {
      return NextResponse.json({ error: 'Dosya veya owner_id eksik' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Excel'i parse et
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(bytes, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[]

    console.log('EXCEL SATIR SAYISI:', rows.length)
    console.log('İLK SATIR:', JSON.stringify(rows[0]))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Excel dosyası boş' }, { status: 400 })
    }

    // Her satırı lead olarak kaydet
    const leads = rows.map((row) => {
      // Türkçe ve İngilizce kolon isimlerini destekle
      return {
        owner_id: ownerId,
        first_name:
          row['Ad'] || row['ad'] || row['first_name'] || row['İsim'] || row['isim'] || '',
        last_name:
          row['Soyad'] || row['soyad'] || row['last_name'] || row['Soyadı'] || row['soyadı'] || '',
        phone:
          row['Telefon'] || row['telefon'] || row['phone'] || row['GSM'] || row['gsm'] || '',
        email:
          row['Email'] || row['email'] || row['E-posta'] || row['e-posta'] || row['Mail'] || '',
        source: 'excel',
        status: 'new',
        notes: row['Notlar'] || row['notlar'] || row['Not'] || row['not'] || '',
        created_at: new Date().toISOString(),
      }
    })

    // Veritabanına toplu kaydet
    const { data, error } = await supabase.from('leads').insert(leads).select()

    if (error) {
      console.log('DB HATASI:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${leads.length} lead başarıyla yüklendi`,
      count: leads.length,
      data,
    })
  } catch (error) {
    console.log('UPLOAD HATASI:', error)
    return NextResponse.json({ error: 'Dosya işlenemedi' }, { status: 500 })
  }
}