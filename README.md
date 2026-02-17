# AH Lead Router



Automated lead capture, qualification, routing, and conversion tracking for Analyst Hub's affiliate research brands.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8) ![Prisma](https://img.shields.io/badge/Prisma-5-2d3748) ![Vercel](https://img.shields.io/badge/Vercel-Ready-000)

## Overview

When prospects register for research access across AH's affiliate brands, this system automatically:

1. **Captures** the registration (via webhook or scheduled polling)
2. **Enriches** the lead with firmographic data (AUM, firm type, sector focus)
3. **Scores** the lead based on configurable criteria (0â100)
4. **Routes** the lead to the correct sales rep by territory or account ownership
5. **Notifies** the rep with full context
6. **Tracks** conversion through the full lifecycle (New â Routed â Contacted â Converted)
7. **Escalates** stale leads that haven't been acted on

### Affiliate Brands

| Brand | Sector |
|-------|--------|
| Cannonball | Adtech |
| Fermium | Chemicals |
| FFTT | Macro |
| GLJ | Solar/EV/Steel |
| HJones | Agriculture |
| IronAdvisor | Industrials |
| LightShed | Media/Telecom |
| Optimal | Consumer |
| Rubinson | Consumer |
| Sankey | Energy |
| Schneider | Energy |

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Vercel Postgres)

### 1. Clone and Install

```bash
git clone <repo-url>
cd ah-lead-router
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/ah_lead_router"
```

For **Vercel Postgres**, use the connection string from your Vercel dashboard.

### 3. Initialize Database

```bash
npx prisma db push
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Seed Demo Data

Open the app at `http://localhost:3000`. Click **"Seed Demo Data"** on the dashboard, or POST to the seed endpoint:

```bash
curl -X POST http://localhost:3000/api/demo/seed \
  -H "Content-Type: application/json" \
  -d '{"reset": true}'
```

This creates 4 sales reps, 4 territories, ~26 accounts, and ~18 leads at various lifecycle stages.

---

## Architecture

```
src/
âââ app/                    # Next.js App Router
â   âââ page.tsx            # Dashboard (summary stats, charts, stale alerts)
â   âââ leads/
â   â   âââ page.tsx        # Lead queue (filterable, sortable table)
â   â   âââ [id]/page.tsx   # Lead detail (full info, timeline, actions)
â   âââ territories/
â   â   âââ page.tsx        # Territory management
â   âââ api/
â       âââ leads/          # CRUD for leads
â       âââ webhook/        # Real-time lead ingestion
â       âââ cron/
â       â   âââ process-leads/    # Scheduled lead processing (every 15 min)
â       â   âââ stale-detection/  # Stale lead detection (daily 9 AM weekdays)
â       âââ demo/seed/      # Demo data seeding
â       âââ accounts/       # Account list + CSV import
â       âââ territories/    # Territory CRUD
â       âââ reps/           # Sales rep list
â       âââ stats/          # Dashboard statistics
âââ lib/
â   âââ clients/            # Abstraction layers (swap mock â real)
â   â   âââ crmClient.ts    # CRM API interface
â   â   âââ enrichmentClient.ts  # Firmographic enrichment
â   â   âââ notificationClient.ts # Email/Slack notifications
â   âââ services/
â   â   âââ leadService.ts       # Lead CRUD operations
â   â   âââ scoringService.ts    # Lead scoring engine
â   â   âââ routingService.ts    # Territory matching & routing pipeline
â   â   âââ conversionService.ts # Lifecycle tracking & metrics
â   âââ config/
â   â   âââ territories.ts  # Territory definitions
â   â   âââ brands.ts       # Affiliate brand matching
â   âââ db.ts               # Prisma client singleton
â   âââ types.ts            # Shared TypeScript types
âââ components/             # React UI components
```

### Processing Pipeline

```
Registration â Ingestion â Enrichment â Account Match â Territory Match â Score â Route â Notify
```

1. Lead arrives via **webhook** (`POST /api/webhook`) or **cron poll** (`GET /api/cron/process-leads`)
2. **Enrichment client** pulls firmographic data (AUM, firm type, location)
3. **Account matching** checks if the firm is already in the ~1,048 account list
4. **Territory engine** maps location â territory â sales rep
5. **Scoring engine** produces a 0â100 score based on weighted criteria
6. Lead is **routed** to the assigned rep and added to their CRM distribution list
7. Rep receives an **alert notification** with full context and a dashboard link

---

## Connecting the Real CRM API

All external integrations use abstraction layers with clearly defined interfaces. To connect your real CRM:

### 1. Implement the CRM Client

Edit `src/lib/clients/crmClient.ts`:

```typescript
class RealCrmClient implements CrmClient {
  constructor(private apiUrl: string, private apiKey: string) {}

  async fetchNewRegistrations(since?: Date): Promise<CrmRegistration[]> {
    const res = await fetch(`${this.apiUrl}/registrations?since=${since?.toISOString()}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return res.json();
  }

  // ... implement other methods
}
```

### 2. Update the Factory

In the `getCrmClient()` function, replace the mock:

```typescript
export function getCrmClient(): CrmClient {
  if (process.env.CRM_API_URL && process.env.CRM_API_KEY) {
    return new RealCrmClient(process.env.CRM_API_URL, process.env.CRM_API_KEY);
  }
  return new MockCrmClient();
}
```

### 3. Set Environment Variables

```
CRM_API_URL=https://your-crm.com/api/v1
CRM_API_KEY=your-api-key
```

The same pattern applies to `enrichmentClient.ts` (BigDough) and `notificationClient.ts` (SendGrid/Slack).

---

## Importing the Account List

### CSV Upload

Prepare a CSV with these columns:

```csv
firm_name,domain,rep_owner,territory,status,city,state,country,firm_type,aum,products
Logos Global Management,logosglobal.com,Ted McCool,Midwest,active,Chicago,IL,US,hedge_fund,3200,FFTT;Sankey
```

Upload via the API:

```bash
curl -X POST http://localhost:3000/api/accounts/upload \
  -F "file=@accounts.csv"
```

### JSON Import

```bash
curl -X POST http://localhost:3000/api/accounts/import \
  -H "Content-Type: application/json" \
  -d '{"accounts": [{"firmName": "Acme Capital", "domain": "acmecap.com", ...}]}'
```

---

## Territory Configuration

Territories are defined in `src/lib/config/territories.ts` and managed via the database.

### Default Setup

| Territory | Regions | Rep |
|-----------|---------|-----|
| Midwest + Canada + West Coast | IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI, CA, OR, WA, AK, HI, + all Canadian provinces | Ted McCool |
| East Coast | CT, DE, DC, ME, MD, MA, NH, NJ, NY, PA, RI, VT | Sarah Chen |
| Southeast | AL, AR, FL, GA, KY, LA, MS, NC, SC, TN, VA, WV | Marcus Johnson |
| Mountain / Central | AZ, CO, ID, MT, NM, NV, UT, WY, TX, OK | Lisa Rodriguez |

### Editing Territories

Use the Territory Management page in the UI, or update via API:

```bash
curl -X PUT http://localhost:3000/api/territories \
  -H "Content-Type: application/json" \
  -d '{"territoryId": "...", "repId": "..."}'
```

---

## Lead Scoring

Scoring is configured in `src/lib/services/scoringService.ts`. Default weights:

| Factor | Criteria | Points |
|--------|----------|--------|
| Existing Account | Known firm in account list | +25 |
| Firm Type | Hedge fund/Pension: 20, AM/Endowment: 18, Family office: 15 | 0â20 |
| AUM Tier | $10B+: 25, $5B+: 20, $1B+: 15, $500M+: 10 | 0â25 |
| Registration Type | Trial: 15, Sample report: 12, Webinar: 10, Newsletter: 5 | 3â15 |
| Territory Match | Has matching territory: 15, No match: 5 | 5â15 |

**Max score: 100**. Labels: Hot (75+), Warm (50â74), Cool (25â49), Cold (0â24).
 
---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | â (required) |
| `LEAD_SOURCE` | `"webhook"` or `"cron"` | `"cron"` |
| `CRM_API_URL` | CRM API base URL | Placeholder |
| `CRM_API_KEY` | CRM API key | Placeholder |
| `ENRICHMENT_PROVIDER` | `"bigdough"` or `"none"` | `"bigdough"` |
| `ENRICHMENT_API_KEY` | Enrichment provider API key | Placeholder |
| `STALE_THRESHOLD_DAYS` | Days before a lead is marked stale | `5` |
| `NOTIFICATION_CHANNEL` | `"email"`, `"slack"`, or `"both"` | `"email"` |
| `SALES_LEADERSHIP_EMAIL` | Email for daily digest | â |
| `CRON_SECRET` | Secret for authenticating cron jobs | â |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app | `http://localhost:3000` |

---

## Deploying to Vercel

1. Push the repository to GitHub
2. Import the project in Vercel
3. Add a **Vercel Postgres** database from the Storage tab
4. Set environment variables in the Vercel dashboard
5. Deploy â Prisma migrations run automatically via `postinstall`

The `vercel.json` configures two cron jobs:
- **Process leads**: every 15 minutes
- **Stale detection**: daily at 9 AM weekdays

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leads` | List leads (filterable, paginated) |
| `POST` | `/api/leads` | Create and process a new lead |
| `GET` | `/api/leads/:id` | Get lead detail with timeline |
| `PATCH` | `/api/leads/:id` | Update status, add note, reassign |
| `POST` | `/api/webhook` | Receive real-time registration webhook |
| `GET` | `/api/cron/process-leads` | Process unrouted leads (cron) |
| `GET` | `/api/cron/stale-detection` | Detect and flag stale leads (cron) |
| `GET` | `/api/stats` | Dashboard statistics |
| `GET` | `/api/territories` | List territories |
| `PUT` | `/api/territories` | Update territory assignment |
| `GET` | `/api/accounts` | List accounts |
| `POST` | `/api/accounts/import` | Import accounts (JSON) |
| `POST` | `/api/accounts/upload` | Import accounts (CSV) |
| `GET` | `/api/reps` | List sales reps |
| `POST` | `/api/demo/seed` | Seed demo data |
