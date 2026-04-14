# Integrations

## Overview

This document covers the integration surfaces that are clearly visible in the current codebase.

## Meta Webhook

### Endpoints used

- `GET /api/meta/webhook`
- `POST /api/meta/webhook`
- `GET /api/meta/callback`

### Verified flow

1. `GET /api/meta/webhook` verifies the webhook using `META_WEBHOOK_VERIFY_TOKEN`.
2. `POST /api/meta/webhook` receives Meta webhook payloads.
3. The route calls `processMetaWebhook(...)` in `modules/meta/metaWebhook.service.ts`.
4. The service:
   - identifies the matching `meta_connections` row by `page_id`
   - fetches the lead payload from the Meta Graph API
   - normalizes lead fields through `normalizeMetaLead(...)`
   - finds an assignable agent through `findAssignableAgent(...)`
   - writes the lead through `upsertLead(...)`
5. `upsertLead(...)` applies server-side lead-limit enforcement before insert/upsert.

### OAuth connection flow

`GET /api/meta/callback` exchanges the authorization code for tokens, fetches ad accounts, and upserts a `meta_connections` row for the workspace owner.

## WhatsApp Webhook

### Endpoints used

- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`

### Verified flow

1. `GET /api/whatsapp/webhook` verifies the webhook using `WHATSAPP_VERIFY_TOKEN`.
2. `POST /api/whatsapp/webhook` receives WhatsApp payloads.
3. The route extracts incoming text messages from the webhook body.
4. It checks whether a `leads` row already exists for the same phone with `source = 'whatsapp'`.
5. If not, it inserts a new lead with:
   - generated `lead_code`
   - default `full_name`
   - `phone`
   - `note` from message text
   - `source = 'whatsapp'`
   - `status = 'new'`

Current implementation notes:

- the route resolves `owner_id` from an active `whatsapp_connections` record using `phone_number_id`
- duplicate checking is scoped by `owner_id`, `phone`, and `source`
- lead insertion now goes through the shared repository path, which applies server-side limit enforcement

## API Endpoints

Visible endpoints relevant to lead intake and external integration:

- `POST /api/whatsapp/webhook`
- `GET /api/meta/webhook`
- `POST /api/meta/webhook`
- `POST /api/leads`
- `POST /api/create-user`
- `GET /api/get-advertisers`
- `POST /api/sync-advertisers`
- `POST /api/sync-ad-spend`

Requested endpoint mismatch:

- the requested list included `POST /api/leads/create`
- the current codebase exposes [`app/api/leads/route.ts`](../app/api/leads/route.ts), which maps to `POST /api/leads`

### Sample lead creation request

The current `POST /api/leads` route expects an `owner_id` plus a `leads` array.

```json
{
  "owner_id": "tenant-owner-id",
  "leads": [
    {
      "full_name": "John Doe",
      "phone": "+905551234567",
      "email": "john@example.com",
      "source": "website",
      "note": "Interested in your service"
    }
  ]
}
```

## Error Handling

- If lead limit is exceeded:
  - the system does not create the lead
  - the webhook still returns HTTP 200 to prevent retry loops
- If validation or mapping fails:
  - the request is safely ignored

## How Incoming Data Becomes a Lead

### Meta

- incoming webhook event identifies a Meta lead
- DataPilot fetches the lead payload from Meta
- the payload is normalized into a consistent internal shape
- the system resolves `owner_id` from `meta_connections`
- the system optionally assigns an agent
- the lead is persisted

### WhatsApp

- incoming webhook event is parsed for text messages
- the workspace is resolved from `whatsapp_connections.phone_number_id`
- the sender phone becomes the lead identifier for duplicate checks
- the message body is stored as lead note content
- the lead is inserted through the shared lead repository path so server-side limit checks are applied

### Direct / manual / bulk creation

Other visible creation paths:

- `POST /api/leads` for authenticated tenant-owned inserts
- customer UI manual lead creation in `app/customer/page.tsx`
- Excel upload flow via `POST /api/upload`

## Normalization

The clearest normalization step is the Meta normalizer in [`modules/leads/metaLeadNormalizer.ts`](../modules/leads/metaLeadNormalizer.ts).

It maps multiple possible field names into a common shape:

- `full_name`
- `phone`
- `email`
- `raw_data`

Examples of accepted field aliases include:

- `full_name`, `ad_soyad`, `isim_soyisim`, `name`
- `phone_number`, `telefon`
- `email`, `e_posta`

## Notes

- Website lead intake is represented in lead source values and product flows, but a dedicated public website webhook/form handler is not clearly isolated in the current integration layer.
- `POST /api/sync-ad-spend` syncs Meta ad spend into `ad_spend`; it supports a cron secret flow and a manual `owner_id` body flow.
