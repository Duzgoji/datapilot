# Database

## Overview

This document lists the tables explicitly requested for review and describes only what is visible in the current codebase. When relationships or purpose are not clear from source usage, that uncertainty is stated directly.

## Tenant Model

### `owner_id`

`owner_id` is the primary tenant anchor visible across the codebase.
It is the primary tenant isolation key across most tables.

Confirmed examples:

- `subscriptions.owner_id`
- `leads.owner_id`
- `branches.owner_id`
- `team_members.owner_id` in assignment flow
- `meta_connections.owner_id`
- `whatsapp_connections.owner_id`
- `invoices.owner_id`
- `customers.owner_id`

In practice, `owner_id` appears to represent the primary owning profile or user for a tenant workspace. For advertiser-managed customer workspaces, `owner_id` is also used to connect integrations and operational records back to the customer owner.

Exact ownership semantics may vary and are not fully explicit in the current codebase.

### Tenant isolation

Visible isolation patterns:

- customer pages query tenant data by the signed-in user id as `owner_id`
- lead limits are enforced by `owner_id`
- advertiser workspace access is checked through `advertiser_clients`
- advertiser customer routes add an extra server-side membership check

Important limitation:

- the codebase does not include database migrations or RLS policies, so full tenant isolation cannot be proven from application code alone

## `profiles`

Purpose:

- identity/profile table for authenticated users
- stores role and account-level profile information

Visible key fields:

- `id`
- `email`
- `full_name`
- `role`
- `company_name`
- `phone`
- `sector`
- `is_active`
- `logo_url`

Visible relationships:

- joined from `customers.owner_id` via `customers_owner_id_fkey`
- joined from `team_members` to show member identity
- joined from `lead_history` and `lead_activities` for actor display

## `subscriptions`

Purpose:

- subscription and plan record for customer tenants

Visible key fields:

- `owner_id`
- `plan`
- `status`
- `monthly_fee`
- `per_branch_fee`

Visible relationships:

- linked to customer tenants through `owner_id`

## `leads`

Purpose:

- central lead record for pipeline management

Visible key fields:

- `id`
- `owner_id`
- `customer_id`
- `branch_id`
- `assigned_to`
- `full_name`
- `phone`
- `email`
- `source`
- `status`
- `meta_lead_id`
- `lead_code`
- `procedure_amount`
- `note`
- `created_at`
- `updated_at`

Visible relationships:

- can belong to a customer workspace through `customer_id`
- can be assigned to a team member/user through `assigned_to`
- can belong to a branch through `branch_id`
- used by `lead_history` and `lead_activities`

## `branches`

Purpose:

- branch-level subdivision for a customer tenant

Visible key fields:

- `id`
- `owner_id`
- `branch_name`
- `city`
- `contact_name`
- `contact_email`
- `commission_model`
- `commission_value`
- `invite_code`
- `is_active`

Visible relationships:

- `team_members.branch_id` points to branches
- leads can reference `branch_id`

## `team_members`

Purpose:

- team membership and assignment mapping

Visible key fields:

- `id`
- `user_id`
- `branch_id`
- `owner_id`
- `role`
- `commission_rate`
- `is_active`

Visible relationships:

- references user/profile identity through `user_id`
- references branches through `branch_id`
- used for lead assignment rotation

## `meta_connections`

Purpose:

- stores Meta integration connection data per owner workspace

Visible key fields:

- `owner_id`
- `page_id`
- `access_token`
- `token_expires_at`
- `ad_accounts`
- `ad_account_id`
- `selected_ad_account_id`
- `selected_ad_account_name`
- `connected_at`
- `is_active`

Visible relationships:

- tied to a tenant through `owner_id`
- used by Meta webhook processing and ad spend sync

## `whatsapp_connections`

Purpose:

- stores WhatsApp Business connection settings per owner workspace

Visible key fields:

- `owner_id`
- `phone_number_id`
- `access_token`
- `connected_at`
- `is_active`

Visible relationships:

- tied to a tenant through `owner_id`

## `notifications`

Purpose:

- in-app notifications for customers and agents

Visible key fields:

- `id`
- `user_id`
- `type`
- `title`
- `body`
- `link`
- `is_read`
- `created_at`

Visible relationships:

- tied to a user through `user_id`

## `lead_history`

Purpose:

- status change history for leads

Visible key fields:

- `lead_id`
- `changed_by`
- `old_status`
- `new_status`
- `note`
- `created_at`

Visible relationships:

- `lead_id` points to a lead
- `changed_by` joins to `profiles`

## `lead_activities`

Purpose:

- free-form lead activity log, currently used for notes and timeline items

Visible key fields:

- `lead_id`
- `user_id`
- `type`
- `content`
- `created_at`

Visible relationships:

- `lead_id` points to a lead
- `user_id` joins to `profiles`

## `invoices`

Purpose:

- invoice records for both direct customers and advertisers

Visible key fields:

- `id`
- `owner_id`
- `customer_id`
- `branch_count`
- `per_branch_fee`
- `total_amount`
- `status`
- `due_date`
- `paid_at`
- `created_at`

Visible relationships:

- `owner_id` ties the invoice to the billed tenant or advertiser
- `customer_id` is used for advertiser customer invoice views

## `commission_payments`

Purpose:

- tracks commission payments made to team members

Visible key fields:

- `team_member_id`
- `owner_id`
- `amount`
- `note`
- `created_by`
- `paid_at`

Visible relationships:

- tied to a tenant through `owner_id`
- appears to reference `team_members` through `team_member_id`

## `advertiser_clients`

Purpose:

- links advertisers to customer workspaces they manage

Visible key fields:

- `id`
- `advertiser_id`
- `client_id`
- `customer_id`
- `commission_model`
- `monthly_fee`
- `commission_rate`

Visible relationships:

- links advertiser access to a `customer_id`
- used by server workspace access checks

## `advertiser_subscriptions`

Purpose:

- billing/subscription record for advertiser accounts

Visible key fields:

- `advertiser_id`
- `monthly_fee`
- `per_client_fee`
- `status`

Visible relationships:

- tied to advertiser profiles through `advertiser_id`

## `customers`

Purpose:

- advertiser-facing customer workspace record

Visible key fields:

- `id`
- `name`
- `owner_id`
- `advertiser_id`
- `created_by`
- `status`
- `created_at`

Visible relationships:

- `owner_id` joins to `profiles`
- `advertiser_id` groups records under an advertiser
- `advertiser_clients.customer_id` references this table
- `leads.customer_id` and `invoices.customer_id` are used in advertiser workspace views

## `profiles` vs `customers`

This distinction is visible enough to describe at a high level:

- `profiles` stores user identity and role data for authenticated accounts
- `customers` stores advertiser-managed customer workspace records

What is clearly visible:

- a customer user can exist in `profiles`
- when an advertiser creates a customer through `/api/create-user`, the code creates:
  - a Supabase auth user
  - a `profiles` row
  - a `customers` row
  - an `advertiser_clients` row

What remains unclear:

- whether every `customer` role profile must always have a matching `customers` row in all onboarding paths
- whether `customers` is intended to be strictly an advertiser workspace table or also a universal tenant registry

Because of that, any stricter business rule would be a guess and is intentionally omitted.

## Additional Observed Tables

The following tables are also referenced in the codebase but were not part of the required list:

- `ad_spend`
- `customer_finance`
- `invitations`

They are not expanded here because this document is scoped to the requested table set.
