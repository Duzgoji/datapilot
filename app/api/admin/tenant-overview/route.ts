import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Yetkisiz erisim.' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Gecersiz token.' }, { status: 401 })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Bu islem icin yetkiniz yok.' }, { status: 403 })
    }

    const [{ data: customerTenants }, { data: metaConnections }, { data: whatsAppConnections }] =
      await Promise.all([
        supabaseAdmin
          .from('customers')
          .select('id, owner_id, name, advertiser_id, status'),
        supabaseAdmin
          .from('meta_connections')
          .select('owner_id, is_active, connected_at'),
        supabaseAdmin
          .from('whatsapp_connections')
          .select('owner_id, is_active, connected_at'),
      ])

    return NextResponse.json({
      data: {
        customerTenants: customerTenants || [],
        metaConnections: metaConnections || [],
        whatsAppConnections: whatsAppConnections || [],
      },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
