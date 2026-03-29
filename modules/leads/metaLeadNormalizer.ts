export function normalizeMetaLead(leadData: any) {
  const fields: Record<string, string> = {}

  for (const field of leadData.field_data || []) {
    const key = String(field.name || '').toLowerCase()
    fields[key] = field.values?.[0] || ''
  }

  const firstName = fields['first_name'] || fields['ad'] || ''
  const lastName = fields['last_name'] || fields['soyad'] || ''
  const fullNameFromSingleField =
    fields['full_name'] ||
    fields['ad_soyad'] ||
    fields['isim_soyisim'] ||
    fields['name'] ||
    ''

  const full_name =
    fullNameFromSingleField || `${firstName} ${lastName}`.trim()

  return {
    full_name,
    phone: fields['phone_number'] || fields['telefon'] || '',
    email: fields['email'] || fields['e_posta'] || '',
    raw_data: leadData,
  }
}