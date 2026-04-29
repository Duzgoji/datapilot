import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
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

    const ownerInput = request.nextUrl.searchParams.get('owner_id')?.trim()
    if (!ownerInput) {
      return NextResponse.json({ error: 'owner_id gerekli' }, { status: 400 })
    }

    const tenant = await resolveTenantContext(ownerInput)
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

    const { data: rows, error: connError } = await supabaseAdmin
      .from('meta_connections')
      .select('owner_id, access_token, page_id, selected_ad_account_id, selected_ad_account_name, ad_account_id, is_active')
      .in('owner_id', tenant.readOwnerIds)
      .eq('is_active', true)

    if (connError) {
      return NextResponse.json({ error: connError.message }, { status: 500 })
    }

    const connection =
      rows?.find((row) => row.owner_id === tenant.tenantId) ||
      rows?.find((row) => row.owner_id === tenant.profileId) ||
      rows?.[0] ||
      null

    if (!connection?.access_token) {
      return NextResponse.json({ error: 'Aktif Meta baglantisi bulunamadi' }, { status: 404 })
    }

    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name&access_token=${connection.access_token}`
    )
    const pagesJson = await pagesRes.json()

    if (!pagesRes.ok) {
      return NextResponse.json(
        {
          error: pagesJson?.error?.message || 'Meta sayfalari alinamadi',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      data: {
        pages: Array.isArray(pagesJson?.data) ? pagesJson.data : [],
        connection: {
          page_id: connection.page_id || null,
          ad_account_id: connection.ad_account_id || connection.selected_ad_account_id || null,
          selected_ad_account_id: connection.selected_ad_account_id || null,
          selected_ad_account_name: connection.selected_ad_account_name || null,
          is_active: connection.is_active ?? false,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
