# Roles

## Overview

The codebase contains the following role values:

- `super_admin`
- `superadmin`
- `advertiser`
- `customer`
- `manager`
- `agent`
- `team`

`superadmin` and `super_admin` are both mapped to the super admin area in middleware. `team` is routed to the same panel as `agent`.

## Route Structure

Visible route groups:

- `/super-admin`
- `/advertiser`
- `/advertiser/customers/[customerId]`
- `/customer`
- `/manager`
- `/agent`
- `/login`
- `/register`

## Access Table

| Role | Access Scope |
| --- | --- |
| `super_admin` | full system |
| `advertiser` | multiple customers |
| `customer` | own workspace |
| `manager` | team-level access |
| `agent` / `team` | assigned leads only |

## Access Control Approach

### Middleware

[`middleware.ts`](../middleware.ts) protects the main role-prefixed areas:

- `/super-admin`
- `/advertiser`
- `/customer`
- `/manager`
- `/agent`

It:

- reads the current session through Supabase SSR cookies
- loads the current user role from `profiles`
- redirects users to their role home when they hit a route outside their allowed area

### Server checks

Additional server-side checks are visible for advertiser workspaces:

- [`lib/server/auth.ts`](../lib/server/auth.ts)
- [`app/advertiser/customers/[customerId]/layout.tsx`](../app/advertiser/customers/[customerId]/layout.tsx)

These checks verify that:

- super admins can access any advertiser customer workspace
- advertisers must have a matching `advertiser_clients` row for the target `customer_id`

### Supabase RLS

Supabase Row Level Security policies are not defined in this repository, so RLS usage cannot be verified from code alone. Because many browser-side queries hit tenant tables directly, production safety likely depends on database policy configuration outside this repo.

## Role Details

## `super_admin`

What they can access:

- platform-wide administrative interface
- customer and advertiser management
- subscription and invoice management
- advertiser synchronization endpoints

Routes used:

- `/super-admin`
- API endpoints such as `/api/get-advertisers` and `/api/sync-advertisers`

## `advertiser`

What they can access:

- advertiser dashboard
- linked customer workspaces
- advertiser subscription data
- advertiser invoices and commission-related views

Routes used:

- `/advertiser`
- `/advertiser/customers`
- `/advertiser/customers/[customerId]`
- nested customer workspace routes such as `finance`, `leads`, `meta`, `whatsapp`, and `settings`

## `customer`

What they can access:

- primary tenant workspace
- branch management
- team member management
- lead pipeline and reporting
- Meta and WhatsApp connection screens

Routes used:

- `/customer`
- `/customer/analytics`
- `/customer/upload`

## `manager`

What they can access:

- branch-scoped operational panel
- leads for the manager’s branch
- branch team visibility
- status updates and lead assignment actions

Routes used:

- `/manager`

## `agent` / `team`

What they can access:

- assigned leads
- notifications
- personal pipeline execution screens

Routes used:

- `/agent`

## Notes and Uncertainties

- The code uses both `agent` and `team`; both are routed to `/agent`.
- The repository does not expose a full permission matrix beyond route checks and selected server guards, so actions not explicitly visible here are intentionally not documented as allowed.
