import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Tüm profillerin role değerlerini kontrol et
    const { data: allProfiles, error: allError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .order('created_at', { ascending: false })

    // Sadece advertiser olanlar
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, advertiser_clients(*), advertiser_subscriptions(*)')
      .eq('role', 'advertiser')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      data: data || [],
      error: error?.message || null,
      debug: {
        allProfilesCount: allProfiles?.length,
        allProfilesError: allError?.message,
        roleValues: allProfiles?.map(p => ({ email: p.email, role: p.role })),
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
