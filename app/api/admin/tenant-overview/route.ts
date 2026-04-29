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
          .select('owner_id, is_active, connected_at, token_expires_at, page_id, ad_account_id, selected_ad_account_id, selected_ad_account_name, access_token'),
        supabaseAdmin
          .from('whatsapp_connections')
          .select('owner_id, is_active, connected_at, phone_number_id, access_token'),
      ])

    const normalizedMetaConnections = (metaConnections || []).map((connection) => ({
      owner_id: connection.owner_id,
      is_active: connection.is_active,
      connected_at: connection.connected_at,
      token_expires_at: connection.token_expires_at || null,
      page_id: connection.page_id || null,
      ad_account_id: connection.ad_account_id || connection.selected_ad_account_id || null,
      selected_ad_account_name: connection.selected_ad_account_name || null,
      health: {
        token_present: !!connection.access_token,
        page_mapping_present: !!connection.page_id,
        ad_account_present: !!(connection.ad_account_id || connection.selected_ad_account_id),
      },
    }))

    const normalizedWhatsAppConnections = (whatsAppConnections || []).map((connection) => ({
      owner_id: connection.owner_id,
      is_active: connection.is_active,
      connected_at: connection.connected_at,
      phone_number_id: connection.phone_number_id || null,
      health: {
        token_present: !!connection.access_token,
        phone_number_mapping_present: !!connection.phone_number_id,
      },
    }))

    return NextResponse.json({
      data: {
        customerTenants: customerTenants || [],
        metaConnections: normalizedMetaConnections,
        whatsAppConnections: normalizedWhatsAppConnections,
      },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
