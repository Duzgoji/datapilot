import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, advertiser_clients(*), advertiser_subscriptions(*)')
      .eq('role', 'advertiser')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
