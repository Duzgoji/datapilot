import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enforceLeadLimit } from '@/lib/enforceLeadLimit'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'

type LeadInput = Record<string, unknown>

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { leads?: LeadInput[]; owner_id?: string }
    const { leads, owner_id } = body

    if (!owner_id || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'owner_id gerekli' }, { status: 400 })
    }

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

    const tenant = await resolveTenantContext(owner_id)
    if (user.id !== tenant.profileId) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    }

    await enforceLeadLimit(tenant.tenantId, leads.length)

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leads.map((lead) => ({ ...lead, owner_id: tenant.writeOwnerId })))
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'LeadLimitError') {
      return NextResponse.json({ error: err.message, code: 'LEAD_LIMIT_EXCEEDED' }, { status: 429 })
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
