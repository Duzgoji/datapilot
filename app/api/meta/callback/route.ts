import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAuditEvent } from '@/lib/audit/logAuditEvent'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/customer?error=meta_auth_failed`)
  }

  let ownerId = state
  let returnPath = '/customer'
  try {
    if (state.includes('|')) {
      const parts = state.split('|')
      ownerId = parts[0]
      returnPath = parts.slice(1).join('|')
    }
  } catch {
    ownerId = state
  }

  try {
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.search = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_META_APP_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_META_REDIRECT_URI!,
      client_secret: process.env.META_APP_SECRET!,
      code,
    }).toString()

    const tokenRes = await fetch(tokenUrl.toString(), { method: 'GET' })
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Meta Callback] Token exchange failed', {
        source: 'meta_callback',
        owner_id: ownerId,
        status: tokenRes.status,
        has_access_token: !!tokenData?.access_token,
      })
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}${returnPath}?error=token_failed`)
    }

    const longTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longTokenUrl.search = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.NEXT_PUBLIC_META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: tokenData.access_token,
    }).toString()

    const longTokenRes = await fetch(longTokenUrl.toString(), { method: 'GET' })
    const longTokenData = await longTokenRes.json()
    const accessToken = longTokenData.access_token || tokenData.access_token
    const expiresIn = longTokenData.expires_in || tokenData.expires_in || 5184000

    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
    )
    const adAccountsData = await adAccountsRes.json()

    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name&access_token=${accessToken}`
    )
    const pagesData = await pagesRes.json()

    const adAccounts = Array.isArray(adAccountsData?.data) ? adAccountsData.data : []
    const pages = Array.isArray(pagesData?.data) ? pagesData.data : []
    const firstAdAccount = adAccounts.length === 1 ? adAccounts[0] : null
    const firstPage = pages.length === 1 ? pages[0] : null

    await supabase.from('meta_connections').delete().eq('owner_id', ownerId)
    await supabase.from('meta_connections').upsert({
      owner_id: ownerId,
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      ad_accounts: adAccounts,
      ad_account_id: firstAdAccount?.id || null,
      selected_ad_account_id: firstAdAccount?.id || null,
      selected_ad_account_name: firstAdAccount?.name || null,
      page_id: firstPage?.id || null,
      connected_at: new Date().toISOString(),
      is_active: true,
    })

    await logAuditEvent({
      action: 'integration_connected',
      entityType: 'integration',
      entityId: ownerId,
      userId: null,
      tenantId: ownerId,
      metadata: {
        provider: 'meta',
        source: 'meta_callback',
        return_path: returnPath,
      },
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}${returnPath}?meta=connected`)
  } catch (error) {
    console.error('[Meta Callback] Unexpected error', {
      source: 'meta_callback',
      owner_id: ownerId,
      message: error instanceof Error ? error.message : 'unknown_error',
    })
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}${returnPath}?error=meta_failed`)
  }
}
