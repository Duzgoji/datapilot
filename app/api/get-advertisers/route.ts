import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Geçersiz token.' }, { status: 401 })
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
    }

    const { data: advertisers, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'advertiser')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!advertisers || advertisers.length === 0) return NextResponse.json({ data: [] })

    const ids = advertisers.map(a => a.id)

    const [{ data: clients }, { data: subs }] = await Promise.all([
      supabaseAdmin.from('advertiser_clients').select('*').in('advertiser_id', ids),
      supabaseAdmin.from('advertiser_subscriptions').select('*').in('advertiser_id', ids),
    ])

    const data = advertisers.map(a => ({
      ...a,
      advertiser_clients: clients?.filter(c => c.advertiser_id === a.id) || [],
      advertiser_subscriptions: subs?.filter(s => s.advertiser_id === a.id) || [],
    }))

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
