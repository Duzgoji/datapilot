# DataPilot

DataPilot is a multi-tenant SaaS platform that helps businesses collect, manage, and convert leads from Meta Ads, WhatsApp, and websites in one unified workflow.

DataPilot is built for teams that need a single operational workspace for lead intake, assignment, follow-up, and pipeline visibility across multiple channels and tenants.

## Product Overview

DataPilot helps customer teams, advertisers, managers, and agents work from one system instead of fragmented inboxes and spreadsheets. The platform combines lead intake, role-based workspaces, tenant-aware data access, and operational views for pipeline and team activity.

## Key Features

- Multi-source lead collection across Meta, WhatsApp, and website/manual intake flows
- Agent assignment and team-based lead distribution
- Pipeline tracking from new lead to sale or cancellation
- Multi-tenant architecture using `owner_id` and workspace membership rules
- Plan-based lead limits enforced server-side

## How It Works

1. Leads are collected from Meta Ads, WhatsApp, or Website forms.
2. Data is normalized and validated, including server-side enforcement where implemented.
3. Leads are assigned to agents.
4. Leads are managed through a pipeline.

## Example Use Case

A clinic runs Meta Ads and receives leads via WhatsApp.

With DataPilot:

- all leads are collected in one place
- automatically assigned to agents
- tracked through a sales pipeline

## Tech Stack

- Next.js (App Router)
- TypeScript
- Supabase
- Tailwind CSS

## Quick Start

```bash
npm install
npm run dev
```

The local app runs at `http://localhost:3000`.

## Environment Variables

DataPilot relies on environment variables for Supabase, Meta, WhatsApp, and general application configuration.

- Copy `.env.example` to `.env.local`
- Fill in the required values for your environment
- See the docs for a verified overview of what each variable is used for

## Documentation

Project docs live in [`/docs`](./docs):

- [Architecture](./docs/architecture.md)
- [Roles](./docs/roles.md)
- [Database](./docs/database.md)
- [Integrations](./docs/integrations.md)
- [Security](./docs/security.md)

## Roadmap

- Harden public-facing integration documentation
- Expand lead source coverage beyond current integrations
- Continue refining tenant isolation and operational reporting
- Improve onboarding and platform administration flows
