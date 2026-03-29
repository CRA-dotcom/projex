# Projex Changelog

All notable changes to the Projex platform, organized by sprint.

---

## Sprint 9 -- Contracts, AI Pipeline, Document Cycle, Tests

**Goal**: Complete the document lifecycle with AI generation, automated delivery, and integration tests.

### Built
- **Contract generation** from approved quotations with template resolution and default HTML fallback
- **Contract lifecycle management**: draft -> sent -> signed/cancelled with transition validation and `signedAt` timestamp
- **PDF generation** for quotations and contracts using client-side jspdf + html2canvas-pro
- **AI deliverable generation** via Claude API (Sonnet): template variable resolution, context injection (client data, questionnaire responses, projection financials), retry with exponential backoff (max 3 attempts)
- **AI document auditor**: validates completeness, professional tone, accuracy against questionnaire data, and structural clarity. Returns JSON verdict. Rejected deliverables auto-regenerate with feedback context.
- **Delivery pipeline**: `deliver` mutation verifies audit approval, sets `deliveredAt`, updates assignment status to `delivered`, sends email notification via Resend
- **Document Cycle Tracking UI** (`/clientes/[id]/ciclo`): visual pipeline per service showing Projection -> Quotation -> Contract -> Deliverable status
- **Monthly check cron job**: reviews active projections on the 1st of each month, sends questionnaire reminder emails for pending items
- **Overdue check cron job**: daily scan for past-month pending assignments, sends alert emails grouped by org
- **33 integration tests** across 7 modules (projection engine, multi-tenant isolation, config modes, template resolution, document lifecycle)
- **20 HTML templates** converted and loaded for 6 services (Legal, Contabilidad, Financiero, Marketing, TI, Admin/RH)
- **Public questionnaire link system** (`/q/[token]`): token-based access with no login required, save progress, submit, org branding applied

---

## Sprint 8 -- Template System, Questionnaire, Quotations

**Goal**: Build the template engine and use it for questionnaires and quotations.

### Built
- **Template CRUD interface** (`/platform/templates`): create, edit, activate/deactivate templates with type, service, org scope, HTML content, and variable definitions
- **Template variable resolution engine**: resolves `client`, `projection`, `service` sources automatically; marks `ai` variables for Claude API; leaves `manual` as `[PENDIENTE]`
- **Template preview** with auto-generated sample data
- **Client-side HTML-to-PDF conversion** with org branding injection (logo, colors, fonts)
- **Questionnaire generation** with question deduplication across services
- **Questionnaire queries and status tracking**: draft -> sent -> in_progress -> completed
- **Client-facing questionnaire form** (`/q/[token]`): public access via token, save partial responses, submit when complete
- **Ejecutivo questionnaire management**: review responses, edit before proceeding
- **Quotation generation** from projection services using template resolution with priority chain
- **Quotation lifecycle management**: draft -> sent -> approved/rejected with transition validation and content editing (draft only)

---

## Sprint 7 -- Super Admin Panel, Dashboard

**Goal**: Build the Super Admin panel and organization dashboard.

### Built
- **Super Admin layout and routes** (`/platform`): sidebar with Organizaciones, Servicios, Templates. Non-super-admins redirected.
- **Organization list and creation** with service assignment, plan selection, status management
- **Org config management**: calculation mode (weighted/fixed), commission mode (proportional/fixed_monthly), seasonality toggle, 4 feature flags (advancedConfigVisible, customServicesVisible, seasonalityEditable, manualOverrideAllowed)
- **Org branding UI** (`/platform/orgs/[id]/branding`): logo upload to Convex Storage, primary/secondary/accent colors, font family, header/footer text
- **Service catalog management** (`/platform/servicios`): create custom services per org, edit benchmarks, toggle isCommission flag
- **Feature flag enforcement**: flags control visibility of advanced config, custom services, seasonality editing, and manual overrides in org admin UI
- **Dashboard financial summary query**: monthly projected sales vs. service payments with variance
- **Financial overview chart** (Recharts): bar/line chart with monthly comparison
- **Deliverable status summary**: counts by status (pending, info_received, in_progress, delivered, overdue)
- **Per-client summary cards**: active services, deliveries this month, pending payments (role-filtered)
- **Dashboard alerts and filters**: overdue assignments, unpaid invoices with client name enrichment
- **CSV export**: financial summary download as `Projex_Resumen_{OrgName}_{Year}.csv`

---

## Sprint 6 -- Config-Driven Engine, Billing

**Goal**: Refactor the projection engine to be config-aware and build billing features.

### Built
- **Projection engine refactor**: accepts `EngineConfig` parameter with `calculationMode` (weighted/fixed), `commissionMode` (proportional/fixed_monthly), and `seasonalityEnabled`. Backwards compatible (defaults to weighted/proportional when no config provided).
- **isCommission flag migration**: replaced all `serviceName === "Comisiones"` string matching with `isCommission` boolean field
- **Projection mutations wired to orgConfig**: create and recalculate mutations fetch org config and pass to engine
- **Service filtering by assignedServiceIds**: `listByOrg` query respects org service assignments
- **Invoice status mutation**: update `invoiceStatus` on monthly assignments (not_invoiced/invoiced/paid)
- **Billing frequency breakdown query**: splits monthly amounts by client billing frequency (semanal=4, quincenal=2, mensual=1)
- **Invoice tracking view** (`/facturacion`): assignments grouped by month with status badges, filterable by month/service/status
- **Cron jobs**: `overdue-check` (daily) and `monthly-review` (1st of month) in `convex/crons.ts`

---

## Sprint 5 -- Auth Fix, Engine Tests, Schema Migration

**Goal**: Fix the auth blocker, write tests, and lay the modular schema foundation.

### Built
- **Clerk + Convex auth fix**: resolved JWT template claims (`org_id`, `org_role`, `publicMetadata`), downgraded to Clerk Core 2 (v6) for Convex compatibility, handled snake_case `org_id`
- **Projection engine unit tests**: 15+ test cases covering FE calculation, even seasonality, weighted distribution, commission proportional calc, zero-edge cases, and `validateServiceLimits`
- **`orgConfigs` table**: calculationMode, commissionMode, seasonalityEnabled, featureFlags, currency, fiscalYearStartMonth
- **`orgBranding` table**: companyName, logoStorageId, colors, fontFamily, header/footer text
- **`deliverableTemplates` table**: orgId, serviceId, serviceName, type, htmlTemplate, variables array, version, isActive
- **`isCommission` + `isCustom` fields** added to services table with backfill for existing data
- **`assignedServiceIds`** added to organizations table (optional, null = all defaults)
- **OrgConfig CRUD** with defaults (weighted, proportional, seasonality on, all flags false)
- **Resend SDK integration**: reusable `sendEmail` action with internal variant for cron/scheduler use

---

## Sprint 4 -- Service Matrix, Seasonality

**Goal**: Build the service configuration UI, monthly assignment system, and seasonality visualization.

### Built
- **Service list queries**: `listDefaults` and `listByOrg` with filtering
- **Service configuration page** (`/servicios`): view and configure service benchmarks
- **Service configurator in projection wizard** (Step 3): select active services, set percentages within min/max bounds
- **Projection services and monthly assignment queries**: `listByProjection`, `listByClient`
- **Projection matrix view**: 12-month by N-services grid with calculated amounts
- **Matrix summary totals**: per-month and per-service totals
- **Matrix cell detail panel** with filters
- **Monthly sales input form** (Wizard Step 2): enter 12 monthly sales values
- **Seasonality bar chart**: visual FE factor representation using Recharts
- **Projection review step** (Wizard Step 4): preview before saving
- **Manual monthly amount override**: direct editing of matrix cell amounts
- **Toggle service active/inactive and recalculate**: real-time projection updates

---

## Sprint 3 -- Projection Engine Core

**Goal**: Implement the financial projection engine and basic projection UI.

### Built
- **Pure projection engine library** (`convex/lib/projectionEngine.ts`): stateless functions replicating Excel calculator logic
- **FE factor calculation**: `calculateFeFactor(monthlySales, annualSales)`
- **Even seasonality generation**: default flat distribution
- **Main `calculateProjection` function**: weight normalization, budget distribution, commission handling, monthly adjustments
- **Service limit validation**: checks no service exceeds max percentage of annual revenue
- **Create projection mutation**: generates projectionServices and monthlyAssignments
- **Projection queries**: `getByClient`, `getById`
- **Recalculate projection mutation**: updates with new params, deletes/recreates assignments
- **Projection input form** (Wizard Step 1): basic data entry

---

## Sprint 2 -- Client Management

**Goal**: Build full client CRUD with role-based access.

### Built
- **Client create mutation**: with org-scoped isolation and auto-assignment to creator
- **Client update mutation**: partial updates with RFC auto-uppercase
- **Client archive/restore mutations**: soft delete pattern
- **Role-based client filtering**: ejecutivos (`org:member`) see only assigned clients
- **New client form UI** (`/clientes/nuevo`): validated form with RFC pattern check and industry dropdown
- **Edit client page** (`/clientes/[id]/editar`)
- **Client list page** (`/clientes`): search by name/RFC, filter by industry, sorted by creation date
- **Client detail page** (`/clientes/[id]`): full client information display

---

## Sprint 1 -- Project Setup, Multi-Tenant Foundation

**Goal**: Initialize the project and establish multi-tenant architecture.

### Built
- **Next.js 15 + Convex project** with App Router and Turbopack
- **Complete Convex schema**: clients, projections, services, projectionServices, monthlyAssignments, questionnaireResponses, quotations, contracts, deliverables, organizations
- **Clerk + Convex authentication**: JWT template config, provider setup
- **Auth middleware and role helpers**: `requireAuth`, `getOrgId`, `getOrgIdSafe`, `requireAdmin`, `requireSuperAdmin`
- **Default services seed**: 9 services (6 base + 3 comodin) with benchmarks
- **Organization CRUD and Super Admin queries**
- **App shell layout** with sidebar navigation

---

## Pre-Sprint -- Planning and Scoping

- Initial scope presentation for client review
- Project overview document with Excel calculator logic
- Client feedback incorporation (v1.1, v1.2, v1.3)
- Switch from Supabase to Convex
- Multi-tenant architecture decision
- Stripe removal (manual onboarding)
- BMAD planning artifacts: PRD, Architecture, Epics, Sprint Plan
- Modular architecture design spec
