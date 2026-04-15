'use client'

import { supabase } from '@/lib/supabase/client'

type ClientAuditEventInput = {
  action: string
  entityType: string
  entityId?: string | null
  tenantId?: string | null
  metadata?: Record<string, unknown> | null
}

export async function logClientAuditEvent(input: ClientAuditEventInput) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      console.warn('[Audit] Skipping client audit event without session', {
        source: 'audit_client',
        action: input.action,
        entity_type: input.entityType,
      })
      return
    }

    await fetch('/api/audit/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(input),
    })
  } catch (error) {
    console.warn('[Audit] Client audit request failed', {
      source: 'audit_client',
      action: input.action,
      entity_type: input.entityType,
      reason: error instanceof Error ? error.message : 'unknown_error',
    })
  }
}
