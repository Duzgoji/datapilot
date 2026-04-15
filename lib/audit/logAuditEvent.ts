import 'server-only'

import { supabaseAdmin } from '@/lib/supabase/admin'

export type AuditLogRow = {
  id?: string
  action: string
  entity_type: string
  entity_id?: string | null
  user_id?: string | null
  tenant_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
}

export type AuditEventInput = {
  action: string
  entityType: string
  entityId?: string | null
  userId?: string | null
  tenantId?: string | null
  metadata?: Record<string, unknown> | null
}

export async function logAuditEvent(input: AuditEventInput) {
  if (!input.action || !input.entityType) {
    console.warn('[Audit] Skipped invalid audit event', {
      source: 'audit_logger',
      reason: 'missing_required_fields',
      action: input.action,
      entity_type: input.entityType,
    })
    return { ok: false, skipped: true as const }
  }

  const row: AuditLogRow = {
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    user_id: input.userId ?? null,
    tenant_id: input.tenantId ?? null,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
  }

  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert(row)

    if (error) {
      console.warn('[Audit] Failed to persist audit event', {
        source: 'audit_logger',
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        tenant_id: row.tenant_id,
        reason: error.message,
      })
      return { ok: false, skipped: true as const }
    }

    return { ok: true as const, skipped: false as const }
  } catch (error) {
    console.warn('[Audit] Unexpected audit logging failure', {
      source: 'audit_logger',
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      tenant_id: row.tenant_id,
      reason: error instanceof Error ? error.message : 'unknown_error',
    })
    return { ok: false, skipped: true as const }
  }
}

export async function listAuditEvents(limit = 100) {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('[Audit] Failed to list audit events', {
        source: 'audit_logger',
        reason: error.message,
      })
      return [] as AuditLogRow[]
    }

    return (data || []) as AuditLogRow[]
  } catch (error) {
    console.warn('[Audit] Unexpected audit list failure', {
      source: 'audit_logger',
      reason: error instanceof Error ? error.message : 'unknown_error',
    })
    return [] as AuditLogRow[]
  }
}
