import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enforceLeadLimit, LeadLimitError } from '@/lib/enforceLeadLimit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leads, owner_id } = body  // leads: array (bulk veya tekli)

    if (!owner_id) {
      return NextResponse.json({ error: 'owner_id gerekli' }, { status: 400 })
    }

    // ── AUTH KONTROLÜ ──
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    // Sadece kendi leads'ini ekleyebilir
    if (user.id !== owner_id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    }

    // ── SERVER-SIDE LİMİT KONTROLÜ ──
    await enforceLeadLimit(owner_id, leads.length)

    // ── INSERT ──
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leads.map((l: any) => ({ ...l, owner_id })))
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })

  } catch (err: any) {
    if (err.name === 'LeadLimitError') {
      return NextResponse.json({ error: err.message, code: 'LEAD_LIMIT_EXCEEDED' }, { status: 429 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}