import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Gecersiz token' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { input?: string }
    const input = body.input?.trim()
    if (!input) {
      return NextResponse.json({ error: 'input gerekli' }, { status: 400 })
    }

    const tenant = await resolveTenantContext(input)

    if (user.id !== tenant.profileId && user.id !== tenant.input) {
      const [{ data: customerAccess }, { data: advertiserClientAccess }] = await Promise.all([
        supabaseAdmin
          .from('customers')
          .select('id')
          .eq('id', tenant.tenantId)
          .eq('advertiser_id', user.id)
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from('advertiser_clients')
          .select('customer_id')
          .eq('advertiser_id', user.id)
          .eq('customer_id', tenant.tenantId)
          .limit(1)
          .maybeSingle(),
      ])

      if (!customerAccess && !advertiserClientAccess) {
        return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
      }
    }

    return NextResponse.json({ data: tenant })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
