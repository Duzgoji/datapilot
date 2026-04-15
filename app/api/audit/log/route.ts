import { NextRequest, NextResponse } from 'next/server'

import { listAuditEvents, logAuditEvent } from '@/lib/audit/logAuditEvent'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getAuthorizedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return { error: 'Yetkisiz', status: 401 as const }
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return { error: 'Gecersiz token', status: 401 as const }
  }

  return { user }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthorizedUser(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = (await req.json()) as {
      action?: string
      entityType?: string
      entityId?: string | null
      tenantId?: string | null
      metadata?: Record<string, unknown> | null
    }

    const result = await logAuditEvent({
      action: body.action || '',
      entityType: body.entityType || '',
      entityId: body.entityId ?? null,
      userId: auth.user.id,
      tenantId: body.tenantId ?? null,
      metadata: body.metadata ?? {},
    })

    return NextResponse.json({ success: result.ok, skipped: result.skipped })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthorizedUser(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Bu islem icin yetkiniz yok.' }, { status: 403 })
  }

  const auditLogs = await listAuditEvents()
  return NextResponse.json({ data: auditLogs })
}
