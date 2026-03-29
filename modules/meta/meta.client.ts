export async function fetchMetaLead(leadId: string, accessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${leadId}?access_token=${accessToken}`
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Meta API error: ${res.status} - ${errorText}`)
  }

  return res.json()
}