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
      id: userId, email, full_name, role: body.role || 'customer',
      company_name, sector: sector || null, phone: phone || null, is_active: true
    })

    // 3b. Eğer advertiser için müşteri ekleme ise — customers tablosuna yaz
    if (body.advertiser_id) {
      const { data: customerData } = await supabaseAdmin.from('customers').insert({
        name: company_name,
        owner_id: userId,
        advertiser_id: body.advertiser_id,
        created_by: body.created_by || null,
        status: 'active'
      }).select().single()

      if (customerData) {
        // advertiser_clients
        const { data: clientData } = await supabaseAdmin.from('advertiser_clients').insert({
          advertiser_id: body.advertiser_id,
          client_id: userId,
          customer_id: customerData.id,
          commission_model: body.commission_model || 'fixed',
          monthly_fee: parseFloat(body.commission_monthly_fee) || 0,
          commission_rate: parseFloat(body.commission_rate) || 0,
        }).select().single()

        // customer_finance — otomatik oluştur
        await supabaseAdmin.from('customer_finance').insert({
          customer_id: customerData.id,
          service_fee: parseFloat(body.commission_monthly_fee) || 0,
          ad_budget: 0,
          commission_rate: parseFloat(body.commission_rate) || 0,
          notes: null,
        })

        return NextResponse.json({ 
          userId, 
          customerId: customerData.id,
          clientId: clientData?.id 
        })
      }
    }
    // 3. Eğer advertiser ise advertiser_subscriptions oluştur
    if (body.role === 'advertiser') {
      await supabaseAdmin.from('advertiser_subscriptions').insert({
        advertiser_id: userId,
        monthly_fee: parseFloat(body.adv_monthly_fee) || 0,
        per_client_fee: parseFloat(body.adv_per_client_fee) || 0,
        status: 'active'
      })
      return NextResponse.json({ userId })
    }

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
