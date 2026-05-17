import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Geçersiz token.' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()

    if (!callerProfile || !['super_admin', 'customer'].includes(callerProfile.role)) {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 })
    }

    const { email, password, full_name, role, commission_rate, owner_id } = await req.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: role || 'team' }
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const userId = data.user.id

    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email,
      full_name,
      role: role || 'team',
      is_active: true
    })

    await supabaseAdmin.from('team_members').insert({
      user_id: userId,
      owner_id: owner_id || user.id,
      role: role || 'agent',
      commission_rate: parseFloat(commission_rate) || 0,
      branch_id: null,
      is_active: true
    })

    return NextResponse.json({ userId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bilinmeyen hata' }, { status: 500 })
  }
}