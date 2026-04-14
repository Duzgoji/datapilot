# Architecture

## Overview

DataPilot is organized around a Next.js App Router application with domain logic extracted into reusable modules and shared platform utilities collected under `lib`.

## Project Structure

```text
app/
  Route handlers, pages, layouts, and role-based UI surfaces

modules/
  Domain logic and integration workflows
  Example: lead assignment, lead normalization, Meta webhook processing

lib/
  Shared utilities and platform infrastructure
  Example: Supabase clients, auth helpers, plan limits, usage checks
```

## Layering

### Client layer

- Lives mostly in `app/` client components
- Handles UI, Supabase browser queries, forms, and role-specific pages

### Server layer

- Lives in Next.js route handlers and server utilities
- Handles auth-aware server logic, integration callbacks, webhook entry points, and workspace guards

### Repository layer

- Encapsulated where domain writes are centralized
- The clearest example is [`modules/leads/lead.repository.ts`](../modules/leads/lead.repository.ts), which applies lead-limit enforcement before persisting leads

## Domain Boundaries

- `modules` contains domain behavior such as assignment and normalization
- `lib` contains shared infrastructure such as Supabase clients, auth helpers, plan limits, and usage calculations

## High-Level Data Flow

The lead ingestion path visible in the codebase is:

```text
Meta / WhatsApp / Website-or-manual input
  -> Next.js API route or UI action
  -> validation / auth / plan-limit checks
  -> repository or direct persistence
  -> optional assignment
  -> pipeline tracking in lead status/history tables
```

More specifically for the modular server-side flow already present:

```text
Meta webhook
  -> /api/meta/webhook
  -> modules/meta/metaWebhook.service.ts
  -> modules/leads/metaLeadNormalizer.ts
  -> modules/leads/assignment.service.ts
  -> modules/leads/lead.repository.ts
  -> leads table
```

## Lead Limit Enforcement

Server-side plan enforcement is implemented in [`lib/enforceLeadLimit.ts`](../lib/enforceLeadLimit.ts).

Verified usage:

- `modules/leads/lead.repository.ts`
  - `upsertLead(...)`
  - `insertLeads(...)`
- `app/api/leads/route.ts`
  - bulk lead creation endpoint

Behavior visible in code:

- Reads the tenant plan from `subscriptions` by `owner_id`
- Resolves plan limits from `lib/planLimits.ts`
- Counts leads for the current UTC month
- Blocks inserts that exceed the monthly plan limit

## Workspace and Tenant Access

There are two distinct access layers visible in the code:

- Role routing via [`middleware.ts`](../middleware.ts)
- Advertiser workspace membership checks via [`lib/server/auth.ts`](../lib/server/auth.ts) and [`app/advertiser/customers/[customerId]/layout.tsx`](../app/advertiser/customers/[customerId]/layout.tsx)

For advertiser customer workspaces, access is checked against `advertiser_clients` using `advertiser_id` and `customer_id`.

## Notes

- The repository layer is only partially centralized today. Some UI pages still write to Supabase directly.
- Website lead capture is represented in the product model and source values, but a dedicated public website webhook/form ingestion route is not clearly separated in the current codebase.
