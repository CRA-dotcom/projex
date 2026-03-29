# Projex Platform Guide

> Deliverable Engine for Service Control (DESC)
> Multi-tenant SaaS platform for automated financial projection and professional deliverable generation.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles](#2-user-roles)
3. [Feature Guide](#3-feature-guide)
4. [Template System](#4-template-system)
5. [Configuration](#5-configuration)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Cron Jobs](#8-cron-jobs)

---

## 1. Platform Overview

### What is Projex

Projex is an automated projection and deliverable engine built for multidisciplinary consulting firms. It replaces the manual process of distributing a client's annual budget across services, generating quotations, contracts, and monthly deliverables -- delegating generation to AI and orchestration to automated workflows.

The goal: **zero human intervention** from the moment a client contracts a service to receiving their deliverable.

### Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 15 (App Router), React 19 | Server-rendered UI with Turbopack |
| Styling | Tailwind CSS 4, shadcn/ui | Design system and component library |
| Backend | Convex | Database, server functions, file storage, cron scheduling |
| Auth | Clerk Organizations | Multi-tenant authentication with org roles |
| AI | Claude API (Sonnet) via `@anthropic-ai/sdk` | Deliverable generation and quality auditing |
| Charts | Recharts | Dashboard visualizations |
| Email | Resend | Transactional email notifications |
| PDF | jspdf + html2canvas-pro | Client-side HTML-to-PDF conversion |
| Deploy | Railway (Nixpacks) or Docker | Production hosting |

### Architecture

Projex follows a **multi-tenant, config-driven** architecture:

- **Multi-tenant isolation**: Every database table includes an `orgId` field. All queries and mutations filter by the authenticated user's organization ID, ensuring complete data separation between tenants.
- **Config-driven engine**: The projection engine accepts an `EngineConfig` object per organization, allowing each tenant to operate in different calculation modes (weighted vs. fixed) and commission modes (proportional vs. fixed monthly).
- **Template-based generation**: Documents (quotations, contracts, deliverables) are generated from HTML templates with variable resolution. Templates support a priority chain: org+service-specific > org+generic > platform+service-specific > platform+generic.
- **AI pipeline**: Deliverables use a creator-auditor pattern. The AI creator generates content, then the AI auditor validates quality. Rejected deliverables are automatically regenerated (up to 3 retries).

### Project Structure

```
src/
  app/
    (auth)/           # Sign-in pages
    (dashboard)/      # Main app pages (clients, projections, invoicing, etc.)
    platform/         # Super Admin panel (/platform)
    q/                # Public questionnaire access (no login required)
  components/         # React components (layout, projections, clients, UI)
  lib/                # Client-side utilities
  middleware.ts       # Clerk auth middleware

convex/
  schema.ts           # Complete database schema (13 tables)
  auth.config.ts      # Clerk JWT provider config
  crons.ts            # Scheduled job definitions
  lib/
    authHelpers.ts    # Auth utilities (requireAuth, getOrgId, requireSuperAdmin)
    projectionEngine.ts  # Pure projection calculation functions
    validators.ts     # RFC validation, industry list
  functions/
    clients/          # Client CRUD
    projections/      # Projection creation, recalculation, status
    projectionServices/  # Service allocation queries/mutations
    monthlyAssignments/  # Assignment tracking, billing queries
    services/         # Service catalog, seed data
    questionnaires/   # Questionnaire generation, public access
    quotations/       # Quotation generation, lifecycle
    contracts/        # Contract generation, lifecycle
    deliverables/     # AI generation, auditing, delivery
    deliverableTemplates/  # Template CRUD, seeding
    dashboard/        # Financial summary, alerts, document cycle
    organizations/    # Org management
    orgConfigs/       # Per-org calculation settings
    orgBranding/      # Per-org branding (logo, colors, fonts)
    email/            # Resend email sending
    cron/             # Overdue check, monthly review
    storage/          # File upload mutations
```

---

## 2. User Roles

Projex implements three distinct roles with progressively broader access.

### Super Admin

| Aspect | Detail |
|--------|--------|
| Access route | `/platform` |
| Identification | `publicMetadata.role === "super_admin"` in Clerk |
| Can see | All organizations, all data across tenants |
| Can do | Manage organizations (create, activate, suspend), configure org settings (calculation modes, feature flags), manage branding (logo, colors, fonts), manage the global service catalog, create/edit/deactivate templates |

The Super Admin role is verified via the `requireSuperAdmin()` helper, which checks for the `super_admin` value in the user's Clerk `publicMetadata.role` or custom JWT `metadata.role` claim.

### Org Admin (`org:admin`)

| Aspect | Detail |
|--------|--------|
| Access route | `/` (dashboard) |
| Identification | Clerk org role `org:admin` |
| Can see | All clients, projections, and documents within their organization |
| Can do | Create/edit/archive clients, create/recalculate projections, manage quotation and contract lifecycles, generate and deliver deliverables, view dashboard, manage invoicing, configure services (subject to feature flags) |

### Ejecutivo (`org:member`)

| Aspect | Detail |
|--------|--------|
| Access route | `/` (dashboard) |
| Identification | Clerk org role `org:member` |
| Can see | Only clients assigned to them (`assignedTo === identity.subject`) |
| Can do | Same operations as Org Admin but restricted to assigned clients only. Dashboard data, alerts, and client summaries are all filtered to show only their assigned clients. |

Role-based filtering is enforced at the Convex query level. The `org:member` check appears in `clients/queries.ts`, `dashboard/queries.ts` (clientSummary, alerts), and related functions.

---

## 3. Feature Guide

### Client Management

**Routes**: `/clientes`, `/clientes/nuevo`, `/clientes/[id]`, `/clientes/[id]/editar`

**Create a Client**: Navigate to `/clientes/nuevo`. Required fields:
- **Nombre** (company name)
- **RFC** (Mexican tax ID) -- validated against the pattern `^[A-ZN&]{3,4}\d{6}[A-Z0-9]{3}$` for both personas morales (12 chars) and personas fisicas (13 chars)
- **Industria** -- predefined list: Manufactura, Comercio, Servicios, Construccion, Tecnologia, Alimentos y Bebidas, Salud, Educacion, Transporte y Logistica, Inmobiliaria, Agricultura, Energia, Financiera, Otro
- **Facturacion Anual** (annual revenue)
- **Frecuencia de Facturacion** -- semanal, quincenal, or mensual

**Edit**: Partial updates supported. RFC is auto-uppercased on save.

**Archive**: Soft delete via `isArchived` flag. Archived clients are hidden from the default list but can be restored. Use the `includeArchived` filter to see them.

**Role-based visibility**: Ejecutivos (`org:member`) see only clients where `assignedTo` matches their Clerk `subject`. Admins see all clients in the org.

**Search and filters**: The client list supports text search (by name or RFC) and industry filtering.

### Projection Engine

**Route**: `/proyecciones/nueva` (wizard), `/proyecciones/[id]` (detail/matrix view)

The projection engine replicates the logic of the original Excel calculator, distributing a client's annual budget across multiple services with monthly seasonality adjustments.

**4-Step Wizard**:

| Step | Name | What happens |
|------|------|-------------|
| 1 | Basic Data | Enter annual sales, total budget, commission rate, select client and fiscal year |
| 2 | Monthly Sales | Enter 12 monthly sales figures. The system calculates FE (Factor de Estacionalidad) for each month |
| 3 | Service Configuration | Select which services are active, set percentage allocation per service. Shows benchmarks (min/max) |
| 4 | Review | Preview the full projection matrix before saving |

**FE Seasonality Factors**:
```
FE = Monthly Sales / (Annual Sales / 12)
```
- FE > 1 = high season (month gets more budget)
- FE < 1 = low season (month gets less budget)
- FE = 1 = even distribution

If seasonality is disabled in the org config, all FE factors are forced to 1.

**9 Default Services**:

| Service | Type | Min % | Max % | Default % | isCommission |
|---------|------|-------|-------|-----------|-------------|
| Legal | base | 1% | 3% | 2% | No |
| Contable | base | 2% | 4% | 3% | No |
| TI | base | 4% | 7% | 5.5% | No |
| Marketing | base | 10% | 15% | 12.5% | No |
| RH | base | 3% | 5% | 4% | No |
| Admin | base | 3% | 5% | 4% | No |
| Comisiones | comodin | - | - | - | Yes |
| Logistica | comodin | 4% | 8% | 6% | No |
| Construccion | comodin | 2% | 5% | 3.5% | No |

**Config Modes**:

- **Weighted** (default): Budget distributed by normalized weights. Each active service gets `remainingBudget * (chosenPct / sumOfActiveWeights)`. Monthly amounts adjusted by FE.
- **Fixed**: Each service uses a `fixedMonthlyAmount`. Annual = fixed * 12. No weight normalization, no FE adjustment.

**Commission Modes**:

- **Proportional** (default): Monthly commission = monthly sales * commission rate. Varies with seasonality.
- **Fixed Monthly**: Commission = (commission rate * total budget) / 12. Same amount every month.

**Projection Calculation Steps** (weighted mode):
1. Annual commissions = Annual Sales * Commission Rate
2. Remaining budget = Total Budget - Annual Commissions
3. Sum weights of active non-commission services
4. Per-service annual amount = Remaining Budget * (Service Weight / Total Weight)
5. Monthly base = Annual Amount / 12
6. Adjusted monthly = Monthly Base * FE factor

**Projection Matrix View**: A 12-month by N-services grid showing the calculated amount for each service in each month. Includes summary totals per month and per service.

### Service Configuration

**Route**: `/servicios` (org admin view), `/platform/servicios` (Super Admin)

**Global defaults**: 9 services seeded via `seedDefaultServices`. These have `isDefault: true` and `orgId: undefined` (global scope).

**Org-specific overrides**: Super Admins can create custom services with `isCustom: true` and a specific `orgId`. Organizations can be assigned a subset of services via `assignedServiceIds` on the organizations table. When `assignedServiceIds` is null, all default services are available.

**isCommission flag**: The `isCommission` field on services identifies the commission service (Comisiones). The engine treats this service differently -- its allocation is based on sales volume rather than weight distribution. This replaced earlier string-matching on the service name.

**Service assignment per org**: The `listByOrg` query filters services by the org's `assignedServiceIds`. If the field is null, all defaults are returned.

### Questionnaires

**Routes**: `/cuestionarios`, `/cuestionarios/[id]`, `/cuestionarios/[id]/responder`, `/q/[token]` (public)

**Generation with deduplication**: When a questionnaire is generated for a client with multiple active services, questions that apply to more than one service are included only once. Each question maps to an array of `serviceNames` it serves.

**Public link**: Each questionnaire gets a unique `accessToken`. The URL `/q/[token]` is publicly accessible (no login required) -- the middleware explicitly allows `/q(.*)` as a public route. Clients can fill out the form without needing a Projex account.

**Save progress / Submit**: Clients can save partial responses via `updateResponsesByToken` (status moves to `in_progress`). When ready, they submit via `submitByToken` (status moves to `completed`, `completedAt` timestamp set). Completed questionnaires cannot be modified.

**Status lifecycle**: `draft` -> `sent` -> `in_progress` -> `completed`

**Ejecutivo review**: Ejecutivos can view submitted questionnaires, review responses, and edit them before proceeding to document generation.

### Quotations

**Routes**: `/cotizaciones`, `/cotizaciones/[id]`

**Template-based generation**: When generating a quotation for a projection service, the system looks for matching templates in priority order:
1. Active template with matching `serviceId` and `orgId`
2. Active template with matching `serviceId` and no `orgId` (global)
3. Active generic quotation template for the org
4. Active generic quotation template (global)
5. Fallback: built-in default HTML structure

Template variables (`{{name}}`, `{{rfc}}`, `{{serviceName}}`, `{{annualAmount}}`, etc.) are resolved from client, projection, and service data.

**Lifecycle**: `draft` -> `sent` -> `approved` / `rejected`

Allowed transitions are enforced:
- From `draft`: can move to `sent`
- From `sent`: can move to `approved` or `rejected`

**PDF generation**: Client-side HTML-to-PDF using jspdf + html2canvas-pro. The generated PDF is uploaded to Convex Storage and linked via `pdfStorageId`.

**Content editing**: Quotation content (HTML) can be edited while in `draft` status. Once sent, content is locked.

### Contracts

**Routes**: `/contratos`, `/contratos/[id]`

**Generation from approved quotation**: Contracts can only be generated from quotations with `status === "approved"`. The contract inherits client data, service data, and quotation context.

**Template resolution**: Same priority chain as quotations, but searches for `type: "contract"` templates.

**Lifecycle**: `draft` -> `sent` -> `signed` / `cancelled`

- `signedAt` timestamp is set automatically when status moves to `signed`
- Content editing is only allowed while in `draft`

**PDF generation**: Same client-side mechanism as quotations, stored in Convex Storage.

### Deliverables

**Routes**: `/entregables`, `/entregables/[id]`

**AI generation via Claude API**: The `generateDeliverable` action orchestrates the full pipeline:
1. Fetches assignment, client, projection service, projection, and questionnaire data
2. Finds the best matching template (`deliverable_short` or `deliverable_long`)
3. Resolves non-AI template variables (client, projection, service sources)
4. Calls Claude API (Sonnet) to fill `source: "ai"` variables
5. Saves the generated deliverable

**Model**: `claude-sonnet-4-20250514` with `max_tokens: 2048`.

**Short + long versions**: Each deliverable has both `shortContent` (executive summary) and `longContent` (detailed report). Generated from separate template types (`deliverable_short` and `deliverable_long`).

**AI auditor (quality check)**: The `auditDeliverable` action sends the generated content to Claude for validation against four criteria:
1. Completeness -- covers all relevant points
2. Professional tone -- appropriate for a business deliverable
3. Accuracy -- consistent with questionnaire data
4. Structure -- logical and clear organization

The auditor returns a JSON response: `{approved: true/false, feedback: "..."}`.

**Retry logic (max 3)**: If the auditor rejects a deliverable and `retryCount < 3`, the system automatically:
1. Increments `retryCount`
2. Schedules `regenerateDeliverable` (5-second delay)
3. Regeneration includes the auditor's feedback as correction context

**Audit statuses**: `pending` -> `approved` / `rejected` / `corrected`

**Cost tracking**: Every AI call logs `inputTokens`, `outputTokens`, and `costUsd` to the `aiLog` array on the deliverable record. Costs calculated at $3/1M input tokens and $15/1M output tokens.

**Delivery with email notification**: The `deliver` mutation:
1. Verifies `auditStatus === "approved"`
2. Sets `deliveredAt` timestamp
3. Updates the corresponding `monthlyAssignment` status to `"delivered"`
4. Sends email notification to client via Resend

### Dashboard

**Route**: `/` (main dashboard page)

**Financial charts**: Bar/line chart showing monthly projected sales vs. service payments, with variance highlighted. Data from `dashboard/queries.ts:financialSummary`.

**Deliverable status donut**: Counts of assignments by status: pending, info_received, in_progress, delivered, plus overdue (past-month assignments not yet delivered).

**Per-client summary cards**: Each client card shows: active services count, deliverables delivered this month, pending payments, total assignments. Data is role-filtered (ejecutivos see only assigned clients).

**Alerts**: Two alert categories:
- Overdue assignments (pending in past months, limited to 10)
- Unpaid invoices (status = `invoiced` but not `paid`, limited to 10)

Both are enriched with client names and respect role-based visibility.

**CSV export**: Downloads a CSV file with columns: Mes, Ventas Proyectadas, Pagos de Servicios, Varianza. Filename format: `Projex_Resumen_{OrgName}_{Year}.csv`.

### Billing / Invoicing

**Route**: `/facturacion`

**Invoice status tracking**: Each monthly assignment has an `invoiceStatus` field: `not_invoiced` -> `invoiced` -> `paid`. Admins can update this status via mutation.

**Billing frequency breakdown**: For clients with non-monthly billing, the system splits monthly amounts:
- `semanal` (weekly): 4 periods per month
- `quincenal` (biweekly): 2 periods per month
- `mensual` (monthly): 1 period

**Invoice tracking view**: Lists all monthly assignments grouped by month with status badges. Filterable by year/month, service name, and invoice status.

**Overdue detection**: Assignments with `status !== "delivered"` in past months are flagged as overdue.

### Super Admin Panel

**Route**: `/platform` (requires `super_admin` role)

**Organization management** (`/platform`, `/platform/orgs/[id]`):
- List all organizations with status, plan, and client count
- Create organizations with name, plan (basic/pro/enterprise), and service assignment
- Activate, suspend, or deactivate organizations

**Org config** (`/platform/orgs/[id]`):
- Calculation mode: `weighted` or `fixed`
- Commission mode: `proportional` or `fixed_monthly`
- Seasonality enabled: on/off
- Feature flags:
  - `advancedConfigVisible`: show/hide benchmark editing in org admin UI
  - `customServicesVisible`: show/hide custom service creation
  - `seasonalityEditable`: allow/prevent editing seasonality data
  - `manualOverrideAllowed`: enable/disable manual amount overrides in the matrix

**Branding** (`/platform/orgs/[id]/branding`):
- Company name
- Logo upload (stored in Convex Storage)
- Primary color, secondary color, accent color
- Font family
- Header text, footer text

Branding is applied to generated PDFs and the public questionnaire form.

**Service catalog management** (`/platform/servicios`):
- View all global and custom services
- Create custom services for specific orgs (`isCustom: true`)
- Edit benchmarks (min%, max%, default%)
- Toggle `isCommission` flag
- Assign services to organizations

**Template CRUD** (`/platform/templates`):
- Create, edit, activate/deactivate templates
- Set template type, service association, org scope
- Define HTML content with variable placeholders
- Define variable metadata (key, label, source, required)
- Preview templates with sample data
- Version tracking (increment on edit)

---

## 4. Template System

### Template Types

| Type | Purpose | Count |
|------|---------|-------|
| `quotation` | Service quotation documents | Varies |
| `contract` | Service contracts | Varies |
| `deliverable_short` | Executive summary (short deliverable) | Per service |
| `deliverable_long` | Detailed report (long deliverable) | Per service |
| `questionnaire` | Client questionnaire forms | Per service |

### 20 Templates Across 6 Services

Templates are stored as HTML files in `docs/templates/html/` and loaded into the database via seeding. The 20 templates cover:

| Service | Questionnaire | Quotation | Deliverable Short | Deliverable Long |
|---------|:---:|:---:|:---:|:---:|
| Legal | Yes | Yes | Yes | Yes |
| Contabilidad | -- | Yes | Yes | Yes |
| Financiero | Yes | -- | Yes | Yes |
| Marketing | Yes | -- | Yes | Yes |
| TI | Yes | Yes | Yes | Yes |
| Admin/RH | Yes | -- | Yes | Yes |

### Variable Types

Variables are embedded in templates as `{{variableName}}` placeholders and resolved at generation time.

| Source | Resolution | Example Variables |
|--------|-----------|-------------------|
| `client` | Auto-resolved from the clients table | `{{name}}`, `{{rfc}}`, `{{industry}}`, `{{annualRevenue}}`, `{{billingFrequency}}` |
| `projection` | Auto-resolved from projections table | `{{year}}`, `{{annualSales}}`, `{{totalBudget}}`, `{{commissionRate}}` |
| `service` | Auto-resolved from projection service data | `{{serviceName}}`, `{{chosenPct}}`, `{{annualAmount}}`, `{{type}}` |
| `ai` | Filled by Claude API at generation time | `{{executive_summary}}`, `{{analysis}}`, `{{recommendations}}` |
| `manual` | Left as `[PENDIENTE]` for human editing | `{{special_notes}}`, `{{custom_terms}}` |

### Template Resolution Priority

When looking for a template, the system checks in this order:

1. **Org + Service specific**: `orgId === currentOrg AND serviceId === targetService`
2. **Global + Service specific**: `orgId === null AND serviceId === targetService`
3. **Org + Generic**: `orgId === currentOrg AND serviceId === null`
4. **Global + Generic**: `orgId === null AND serviceId === null`
5. **Fallback**: Built-in default HTML structure (hardcoded in mutation)

### Creating New Templates

1. Navigate to `/platform/templates` (Super Admin only)
2. Click "Create Template"
3. Fill in:
   - **Name**: Unique identifier (e.g., "Legal Quotation v2")
   - **Type**: quotation, contract, deliverable_short, deliverable_long, or questionnaire
   - **Service**: Associate with a specific service (or leave empty for generic)
   - **Org**: Associate with a specific org (or leave empty for global)
   - **HTML Content**: Full HTML with `{{variable}}` placeholders
   - **Variables**: Define each variable with key, label, source type, and required flag
4. Use "Preview" to see rendered output with sample data
5. Activate the template to make it available for document generation

---

## 5. Configuration

### Environment Variables

**Next.js (client-side, prefixed with `NEXT_PUBLIC_`)**:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in redirect (typically `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up redirect |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post-sign-in redirect (typically `/`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post-sign-up redirect |

**Convex (server-side, set in Convex dashboard)**:

| Variable | Purpose |
|----------|---------|
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain for auth verification |
| `ANTHROPIC_API_KEY` | Claude API key for AI deliverable generation/auditing |
| `RESEND_API_KEY` | Resend API key for email notifications |

### Clerk Setup

1. **Create a Clerk application** with Organizations enabled
2. **Configure a JWT template** named `convex`:
   - Add the `org_id` and `org_role` claims
   - Add `publicMetadata` claim (for Super Admin detection)
   - Set the issuer domain
3. **Create organizations** in Clerk dashboard for each tenant
4. **Set user metadata**: For Super Admin users, set `publicMetadata.role = "super_admin"` in the Clerk dashboard
5. **Org roles**: Use `org:admin` for administrators and `org:member` for ejecutivos

### Convex Deployment

```bash
# Install Convex CLI
npm install -g convex

# Initialize (first time)
npx convex init

# Deploy schema and functions
npx convex deploy

# Start dev server (local development)
npx convex dev
```

Set environment variables in the Convex dashboard under Settings > Environment Variables.

### Railway Deployment

The project includes `railway.json` for Nixpacks-based deployment:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx next start -p 3000"
  }
}
```

A `Dockerfile` is also available for container-based deployments. Set all `NEXT_PUBLIC_*` variables as build args and server-side variables as runtime environment variables.

### Resend Email

1. Create a Resend account and verify your sending domain
2. Set `RESEND_API_KEY` in Convex environment variables
3. The default sender is `Projex <noreply@projex-platform.com>` -- update in `convex/functions/email/send.ts` for your domain

### Anthropic API Key

1. Get an API key from the Anthropic console
2. Set `ANTHROPIC_API_KEY` in Convex environment variables
3. If the key is missing or set to `"placeholder"`, AI features gracefully degrade -- templates render with `[AI no disponible]` placeholders

---

## 6. Database Schema

The Convex schema defines 13 tables plus the built-in `_storage` table.

| Table | Purpose | Key Fields | Indexes |
|-------|---------|-----------|---------|
| `organizations` | Tenant registry | clerkOrgId, name, status (active/inactive/suspended), plan (basic/pro/enterprise), assignedServiceIds | by_clerkOrgId, by_status |
| `clients` | Client companies per org | orgId, name, rfc, industry, annualRevenue, billingFrequency, isArchived, assignedTo | by_orgId, by_orgId_industry, by_orgId_assignedTo, by_orgId_archived |
| `projections` | Annual financial projections | orgId, clientId, year, annualSales, totalBudget, commissionRate, seasonalityData[12], status (draft/active/archived) | by_orgId, by_clientId, by_orgId_year, by_clientId_year |
| `services` | Service catalog (global + custom) | orgId (optional), name, type (base/comodin), minPct, maxPct, defaultPct, isDefault, isCommission, isCustom, sortOrder | by_orgId, by_name |
| `projectionServices` | Per-projection service allocations | orgId, projectionId, serviceId, serviceName, chosenPct, isActive, annualAmount, normalizedWeight | by_projectionId, by_orgId, by_projectionId_active |
| `monthlyAssignments` | Monthly service-client assignments | orgId, projServiceId, projectionId, clientId, serviceName, month, year, amount, feFactor, status (pending/info_received/in_progress/delivered), invoiceStatus (not_invoiced/invoiced/paid) | by_orgId, by_projServiceId, by_projectionId, by_clientId_month, by_orgId_year_month, by_orgId_status, by_orgId_invoiceStatus |
| `questionnaireResponses` | Client questionnaires | orgId, clientId, projectionId, responses[], status (draft/sent/in_progress/completed), accessToken, completedAt | by_orgId, by_clientId, by_projectionId, by_orgId_status, by_accessToken |
| `quotations` | Service quotation documents | orgId, projServiceId, clientId, serviceName, content (HTML), pdfStorageId, status (draft/sent/approved/rejected) | by_orgId, by_projServiceId, by_clientId, by_orgId_status |
| `contracts` | Service contracts | orgId, quotationId, projServiceId, clientId, serviceName, content (HTML), pdfStorageId, status (draft/sent/signed/cancelled), signedAt | by_orgId, by_quotationId, by_clientId, by_orgId_status |
| `deliverables` | Generated deliverables | orgId, assignmentId, projServiceId, clientId, serviceName, month, year, shortContent, longContent, shortPdfStorageId, longPdfStorageId, auditStatus (pending/approved/rejected/corrected), auditFeedback, retryCount, aiLog[], deliveredAt | by_orgId, by_assignmentId, by_clientId, by_orgId_auditStatus, by_orgId_year_month |
| `orgConfigs` | Per-org calculation settings | orgId, calculationMode (weighted/fixed), commissionMode (proportional/fixed_monthly), seasonalityEnabled, featureFlags{}, currency, fiscalYearStartMonth | by_orgId |
| `orgBranding` | Per-org visual identity | orgId, companyName, logoStorageId, primaryColor, secondaryColor, accentColor, fontFamily, headerText, footerText | by_orgId |
| `deliverableTemplates` | Document templates | orgId (optional), serviceId (optional), serviceName, type, name, htmlTemplate, variables[], version, isActive | by_orgId, by_serviceId, by_type |

### Key Relationships

```
organizations (1) --< clients (N) --< projections (N)
                                          |
                                          +--< projectionServices (N)
                                          |       |
                                          |       +--< monthlyAssignments (N)
                                          |       +--< quotations (1)
                                          |       +--< contracts (1)
                                          |       +--< deliverables (N)
                                          |
                                          +--< questionnaireResponses (N)

services (global catalog) --< projectionServices (per projection)
organizations --< orgConfigs (1:1)
organizations --< orgBranding (1:1)
quotations (approved) --> contracts (generated from)
```

---

## 7. API Reference

All functions are Convex server functions. Functions marked **public** require authentication (except where noted). Functions marked **internal** are system-only (used by cron jobs, actions, or other internal functions).

### clients

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `clients.queries.list` | query | public | List clients with optional search, industry filter, includeArchived flag. Role-filtered for ejecutivos. |
| `clients.queries.getById` | query | public | Get single client by ID (org-scoped). |
| `clients.queries.getIndustries` | query | public | Get distinct industries for the org. |
| `clients.mutations.create` | mutation | public | Create a new client. Auto-assigns to creator. |
| `clients.mutations.update` | mutation | public | Partial update of client fields. |
| `clients.mutations.archive` | mutation | public | Soft-delete (set isArchived=true). |
| `clients.mutations.restore` | mutation | public | Restore archived client. |

### projections

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `projections.queries.list` | query | public | List projections for the org. |
| `projections.queries.getById` | query | public | Get projection by ID with org check. |
| `projections.queries.getByClient` | query | public | Get projections for a specific client. |
| `projections.mutations.create` | mutation | public | Create projection with full calculation. Generates projectionServices and monthlyAssignments. |
| `projections.mutations.recalculate` | mutation | public | Recalculate with updated params. Deletes and recreates monthlyAssignments. |
| `projections.mutations.updateStatus` | mutation | public | Change projection status (draft/active/archived). |

### projectionServices

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `projectionServices.queries.listByProjection` | query | public | Get all services for a projection. |
| `projectionServices.queries.getById` | query | public | Get single projection service. |
| `projectionServices.mutations.update` | mutation | public | Update chosenPct, isActive on a projection service. |

### monthlyAssignments

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `monthlyAssignments.queries.listByProjection` | query | public | Get assignments for a projection. |
| `monthlyAssignments.queries.listByClient` | query | public | Get assignments for a client. |
| `monthlyAssignments.mutations.updateStatus` | mutation | public | Update assignment status (pending/info_received/in_progress/delivered). |
| `monthlyAssignments.mutations.updateInvoiceStatus` | mutation | public | Update invoice status (not_invoiced/invoiced/paid). |
| `monthlyAssignments.billingQueries.getBillingBreakdown` | query | public | Get billing frequency breakdown for a client/month. |
| `monthlyAssignments.billingQueries.listForInvoiceTracking` | query | public | List assignments with invoice tracking, filterable by year/month/service/invoiceStatus. |

### services

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `services.queries.listDefaults` | query | public | Get all default (global) services. |
| `services.queries.listByOrg` | query | public | Get services available to the org (filtered by assignedServiceIds). |
| `services.mutations.create` | mutation | public | Create a custom service. |
| `services.mutations.update` | mutation | public | Update service benchmarks/flags. |
| `services.seed.seedDefaultServices` | mutation | internal | Seed 9 default services (idempotent). |
| `services.backfill.*` | mutation | internal | Backfill isCommission/isCustom flags on existing services. |

### questionnaires

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `questionnaires.queries.list` | query | public | List questionnaires for the org. |
| `questionnaires.queries.getById` | query | public | Get questionnaire by ID. |
| `questionnaires.queries.getByClient` | query | public | Get questionnaires for a client. |
| `questionnaires.publicQueries.getByToken` | query | **no auth** | Get questionnaire by access token (public form). Includes client name and org branding. |
| `questionnaires.publicMutations.updateResponsesByToken` | mutation | **no auth** | Save partial responses via token. |
| `questionnaires.publicMutations.submitByToken` | mutation | **no auth** | Submit completed questionnaire via token. |

### quotations

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `quotations.queries.list` | query | public | List quotations for the org. |
| `quotations.queries.getById` | query | public | Get quotation by ID. |
| `quotations.mutations.generate` | mutation | public | Generate quotation from a projectionService using templates. |
| `quotations.mutations.updateContent` | mutation | public | Edit quotation HTML (draft only). |
| `quotations.mutations.updateStatus` | mutation | public | Change status (draft->sent->approved/rejected). |
| `quotations.mutations.setPdfStorageId` | mutation | public | Link generated PDF to quotation. |

### contracts

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `contracts.queries.list` | query | public | List contracts for the org. |
| `contracts.queries.getById` | query | public | Get contract by ID. |
| `contracts.mutations.generate` | mutation | public | Generate contract from approved quotation. |
| `contracts.mutations.updateContent` | mutation | public | Edit contract HTML (draft only). |
| `contracts.mutations.updateStatus` | mutation | public | Change status (draft->sent->signed/cancelled). |
| `contracts.mutations.setPdfStorageId` | mutation | public | Link generated PDF to contract. |

### deliverables

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `deliverables.queries.list` | query | public | List deliverables for the org. |
| `deliverables.queries.getById` | query | public | Get deliverable by ID. |
| `deliverables.queries.getByAssignment` | query | public | Get deliverable for a specific assignment. |
| `deliverables.mutations.create` | mutation | public | Manually create a deliverable (non-AI). |
| `deliverables.mutations.markDelivered` | mutation | public | Set deliveredAt timestamp. |
| `deliverables.mutations.updateAuditStatus` | mutation | public | Manual audit status override. |
| `deliverables.mutations.deliver` | mutation | public | Deliver to client (requires approved audit, sends email). |
| `deliverables.actions.generateDeliverable` | action | public | AI generation pipeline (fetch data, resolve template, call Claude). |
| `deliverables.actions.auditDeliverable` | action | public | AI quality audit (validates against criteria). |
| `deliverables.actions.regenerateDeliverable` | action | internal | Regenerate rejected deliverable with feedback context. |
| `deliverables.mutations.saveGenerated` | mutation | internal | Save AI-generated deliverable. |
| `deliverables.mutations.updateAudit` | mutation | internal | Update audit results from AI auditor. |
| `deliverables.mutations.incrementRetry` | mutation | internal | Increment retry count. |
| `deliverables.mutations.updateAfterRegeneration` | mutation | internal | Update content after AI regeneration. |
| `deliverables.internalQueries.*` | query | internal | Data fetching for AI pipeline (assignment, client, projService, projection, questionnaire, template). |

### deliverableTemplates

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `deliverableTemplates.queries.list` | query | Super Admin | List templates, filterable by type/orgId/serviceId. |
| `deliverableTemplates.queries.getById` | query | Super Admin | Get template by ID. |
| `deliverableTemplates.mutations.create` | mutation | Super Admin | Create a new template. |
| `deliverableTemplates.mutations.update` | mutation | Super Admin | Update template (increments version). |
| `deliverableTemplates.mutations.toggleActive` | mutation | Super Admin | Activate/deactivate template. |
| `deliverableTemplates.seed.seedTemplate` | mutation | internal | Seed a single template (idempotent). |
| `deliverableTemplates.seed.listAll` | query | internal | List all templates (for seeding checks). |
| `deliverableTemplates.seed.deleteByName` | mutation | internal | Delete template by name (for re-seeding). |

### dashboard

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `dashboard.queries.financialSummary` | query | public | Monthly projected sales vs. service payments for charts. |
| `dashboard.queries.deliverableStats` | query | public | Assignment status counts (pending, in_progress, delivered, overdue). |
| `dashboard.queries.clientSummary` | query | public | Per-client summary cards. Role-filtered for ejecutivos. |
| `dashboard.queries.alerts` | query | public | Overdue assignments and unpaid invoices. Role-filtered. |
| `dashboard.documentCycle.getDocumentCycle` | query | public | Full document pipeline per service for a client (projection->quotation->contract->deliverables). |

### organizations

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `organizations.queries.list` | query | Super Admin | List all organizations. |
| `organizations.queries.getByClerkId` | query | public | Get org by Clerk org ID. |
| `organizations.mutations.create` | mutation | Super Admin | Create organization. |
| `organizations.mutations.update` | mutation | Super Admin | Update org name, status, plan, assignedServiceIds. |

### orgConfigs

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `orgConfigs.queries.getByOrgId` | query | public | Get config for the current org. |
| `orgConfigs.mutations.upsert` | mutation | Super Admin | Create or update org config. |

### orgBranding

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `orgBranding.queries.getByOrgId` | query | public | Get branding for current org. |
| `orgBranding.queries.getLogoUrl` | query | public | Get signed URL for org logo. |
| `orgBranding.mutations.upsert` | mutation | Super Admin | Create or update branding. |

### email

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `email.send.sendEmail` | action | public | Send email via Resend. |
| `email.send.sendEmailInternal` | action | internal | Send email (for cron jobs and scheduled actions). |

### storage

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `storage.mutations.generateUploadUrl` | mutation | public | Generate a Convex Storage upload URL. |

---

## 8. Cron Jobs

Cron jobs are defined in `convex/crons.ts`. Both are currently **disabled** (commented out) for development. They are fully implemented and ready to enable for production.

### overdue-check (Daily)

| Setting | Value |
|---------|-------|
| Schedule | Daily at 14:00 UTC |
| Function | `internal.functions.cron.overdueCheck.run` |
| Purpose | Identify overdue assignments and send alert emails |

**What it does**:
1. Scans all `monthlyAssignments` with `status === "pending"` across all orgs
2. Filters to assignments from past months (month < current month)
3. Groups by org and resolves client names
4. Sends alert emails to org admins listing overdue items

### monthly-review (1st of Month)

| Setting | Value |
|---------|-------|
| Schedule | 1st of each month at 14:00 UTC |
| Function | `internal.functions.cron.monthlyCheck.run` |
| Purpose | Review active projections and send questionnaire reminders |

**What it does**:
1. Fetches all active projections for the current year
2. Lists assignments due this month
3. Checks for pending questionnaires (status `draft` or `sent`) for due assignments
4. Sends reminder emails to clients for each pending questionnaire

### How to Enable

Edit `convex/crons.ts` and uncomment the cron definitions:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "overdue-check",
  { hourUTC: 14, minuteUTC: 0 },
  internal.functions.cron.overdueCheck.run,
  {}
);

crons.monthly(
  "monthly-review",
  { day: 1, hourUTC: 14, minuteUTC: 0 },
  internal.functions.cron.monthlyCheck.run,
  {}
);

export default crons;
```

Then redeploy with `npx convex deploy`.

**Note**: Before enabling, update the placeholder email addresses in the cron handlers (`admin@projex-platform.com` and `cliente@projex-platform.com`) to resolve actual org admin and client emails from Clerk or a contacts table.
