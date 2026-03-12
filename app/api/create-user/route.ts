import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      email, password, full_name, company_name, sector, phone,
      plan, monthly_fee, per_branch_fee,
      branch_name, branch_city, commission_model
    } = body

    if (!email || !password || !full_name || !company_name) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 })
    }

    // 1. Kullanıcı oluştur (mevcut oturumu değiştirmez)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'customer' }
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const userId = data.user.id

    // 2. Profile upsert
    await supabaseAdmin.from('profiles').upsert({
      id: userId, email, full_name, role: 'customer',
      company_name, sector: sector || null, phone: phone || null, is_active: true
    })

    // 3. Subscription
    await supabaseAdmin.from('subscriptions').insert({
      owner_id: userId,
      plan: plan || 'trial',
      status: 'active',
      monthly_fee: parseFloat(monthly_fee) || 0,
      per_branch_fee: parseFloat(per_branch_fee) || 0,
    })

    // 4. İlk şube (opsiyonel)
    if (branch_name) {
      await supabaseAdmin.from('branches').insert({
        owner_id: userId,
        branch_name,
        city: branch_city || null,
        commission_model: commission_model || 'fixed_rate',
        is_active: true
      })
    }

    return NextResponse.json({ userId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bilinmeyen hata' }, { status: 500 })
  }
}
