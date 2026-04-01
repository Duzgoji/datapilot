import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
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
