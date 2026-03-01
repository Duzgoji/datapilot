import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // owner_id

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/customer?error=meta_auth_failed`)
  }

  try {
    // Code'u access token'a çevir
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.NEXT_PUBLIC_META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_META_REDIRECT_URI!)}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/customer?error=token_failed`)
    }

    // Long-lived token al
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${process.env.NEXT_PUBLIC_META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
    )
    const longTokenData = await longTokenRes.json()

    // Reklam hesaplarını çek
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id&access_token=${longTokenData.access_token}`
    )
    const adAccountsData = await adAccountsRes.json()

    // Token'ı Supabase'e kaydet
    await supabase.from('meta_connections').upsert({
      owner_id: state,
      access_token: longTokenData.access_token,
      token_expires_at: new Date(Date.now() + (longTokenData.expires_in || 5184000) * 1000).toISOString(),
      ad_accounts: adAccountsData.data || [],
      connected_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'owner_id' })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/customer?meta=connected`)
  } catch (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/customer?error=meta_failed`)
  }
}