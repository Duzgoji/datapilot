# Security

## Scope

This document covers only security measures that are directly visible in the repository. It intentionally avoids claiming controls that are not shown in code.

## Multi-Tenant Model

### `owner_id`

`owner_id` is used as the main tenant partition key in core tables such as:

- `subscriptions`
- `leads`
- `branches`
- `meta_connections`
- `whatsapp_connections`
- `invoices`

The customer workspace also uses `owner_id` as the filter basis for most customer-side data loading.

### Workspace isolation

Advertiser access to customer workspaces is guarded separately from role access.

Verified controls:

- `middleware.ts` restricts top-level route groups by role
- `lib/server/auth.ts` checks advertiser membership in `advertiser_clients`
- `app/advertiser/customers/[customerId]/layout.tsx` applies a server-side workspace guard for advertiser customer routes

This provides defense in depth for advertiser workspace access beyond client navigation.

## Server-Side Enforcement

### Lead limit enforcement

Lead plan enforcement is server-side in [`lib/enforceLeadLimit.ts`](../lib/enforceLeadLimit.ts).

Verified behavior:

- reads tenant plan from `subscriptions`
- counts monthly leads by `owner_id`
- blocks writes that would exceed the allowed monthly limit

Verified usage:

- `modules/leads/lead.repository.ts`
- `app/api/leads/route.ts`
- `app/api/whatsapp/webhook/route.ts` via the shared lead repository

Current verified statement:

- repository-backed server-side lead creation paths are protected by enforcement mechanisms such as `enforceLeadLimit`

Requested stronger wording note:

- the statement "All lead creation paths are protected by server-side enforcement to prevent client-side bypass of plan limits" does not fully match every visible lead creation path in the current codebase, so it is not stated here as a repository-wide guarantee

Important limitation:

- not every visible lead write path in the repository is proven to use this guard today
- client-driven and upload-based lead creation paths still need separate verification or hardening

## Supabase Usage

### Browser client

The application uses a browser Supabase client for many tenant-scoped reads and writes.

### Server-side SSR client

Server-side auth/session access is handled through `@supabase/ssr` in `lib/server/supabase.ts`.

### Service role usage

A service-role client is clearly used in:

- `lib/supabase/admin.ts`
- integration route handlers such as Meta callback, lead API, create-user, sync-advertisers, sync-ad-spend, and WhatsApp webhook

Because the service-role key bypasses ordinary client restrictions, these routes are especially security-sensitive.

### RLS

RLS policies are not present in this repository. As a result:

- RLS usage cannot be confirmed from code alone
- the presence, strictness, and coverage of tenant policies remain unknown here

## Integration Security

### Webhook verification

Visible verification steps:

- Meta webhook verification uses `META_WEBHOOK_VERIFY_TOKEN`
- WhatsApp webhook verification uses `WHATSAPP_VERIFY_TOKEN`

### Token handling

Visible token usage:

- Meta OAuth callback exchanges and stores access tokens in `meta_connections`
- WhatsApp connection UI stores access token values in `whatsapp_connections`
- ad spend sync uses stored Meta access tokens
- several internal APIs validate bearer tokens against Supabase auth before allowing sensitive actions

Examples of token-validated routes:

- `POST /api/leads`
- `POST /api/create-user`
- `GET /api/get-advertisers`
- `POST /api/sync-advertisers`

### Cron secret

`POST /api/sync-ad-spend` supports a cron-style authorization path using `CRON_SECRET`.

## What Is Not Verified Here

The following are not visible enough in this repository to document as confirmed controls:

- database RLS definitions
- audit logging beyond application-level tables
- encryption-at-rest specifics
- secret rotation practices
- webhook signature validation beyond verify-token style checks
