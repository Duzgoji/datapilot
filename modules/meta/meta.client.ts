export async function fetchMetaLead(leadId: string, accessToken: string) {
  const url = new URL(`https://graph.facebook.com/v18.0/${leadId}`)
  url.search = new URLSearchParams({
    fields: 'id,created_time,field_data,ad_id,form_id',
    access_token: accessToken,
  }).toString()

  const res = await fetch(url.toString(), { method: 'GET' })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Meta API error: ${res.status} - ${errorText}`)
  }

  return res.json()
}
