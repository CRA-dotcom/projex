# Projex - Unified Sprint Plan v2

## Overview

78 stories across 9 sprints. Sprints 1-4 complete (32 stories). Sprints 5-9 remaining (46 stories). Incorporates modular architecture spec, code review findings, and adversarial review corrections.

**Refs:**
- Design spec: `docs/superpowers/specs/2026-03-28-modular-architecture-design.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`

---

## Sprint 1-4: COMPLETE (32 stories)

Sprints 1-4 are done. See git history for implementation details.

- **Sprint 1:** Project Setup & Multi-Tenant Foundation (7 stories)
- **Sprint 2:** Client Management (7 stories)
- **Sprint 3:** Projection Engine Core (6 stories, unit tests pending)
- **Sprint 4:** Service Matrix & Seasonality (12 stories)

---

## Sprint 5: Auth Fix + Engine Tests + Schema Migration
**Duration:** 1 week
**Goal:** Fix the auth blocker, write tests BEFORE refactoring, and lay the modular schema foundation.

| # | Title | Est. | AC |
|---|-------|------|----|
| S5-01 | **Fix Clerk + Convex auth (BLOCKER)** | 3h | Given a user logged in via Clerk with an active org, When they call any Convex mutation, Then `ctx.auth.getUserIdentity()` returns a valid identity with `orgId` and `orgRole`. Verify by creating a client successfully. |
| S5-02 | **Projection engine unit tests** | 4h | Given the projection engine library, When running `npm test`, Then all tests pass covering: FE calculation, even seasonality, weighted distribution, commission proportional calc, zero-edge cases, and validateServiceLimits. Minimum 15 test cases. |
| S5-03 | **Add orgConfigs table to schema** | 1h | Given the schema, When deployed, Then `orgConfigs` table exists with fields: orgId, calculationMode (weighted/fixed only — NO custom), commissionMode (proportional/fixed_monthly only — NO tiered), seasonalityEnabled, featureFlags object, currency, fiscalYearStartMonth. |
| S5-04 | **Add orgBranding table to schema** | 1h | Given the schema, When deployed, Then `orgBranding` table exists with fields: orgId, companyName, logoStorageId, primaryColor, secondaryColor, accentColor, fontFamily, headerText, footerText. |
| S5-05 | **Add deliverableTemplates table to schema** | 1h | Given the schema, When deployed, Then `deliverableTemplates` table exists with fields per modular spec Section 3.3. |
| S5-06 | **Add isCommission + isCustom to services + backfill** | 2h | Given existing services in DB, When migration runs, Then all services have `isCommission: false` except "Comisiones" which has `isCommission: true`. All have `isCustom: false`. Seed function updated. New services created after migration include both fields. |
| S5-07 | **Add assignedServiceIds to organizations** | 1h | Given existing orgs, When field added, Then `assignedServiceIds` is optional (null = all defaults). No backfill needed — null means all. |
| S5-08 | **OrgConfig defaults + CRUD mutations/queries** | 2h | Given no orgConfig for an org, When engine requests config, Then defaults returned (weighted, proportional, seasonality on, all flags false). Given Super Admin calls create/update, When valid data, Then config saved. Only Super Admin can mutate. |
| S5-09 | **Set up Resend SDK + email utility** | 2h | Given Resend API key in env vars, When calling the email utility, Then emails send successfully. Create reusable `sendEmail(to, subject, html)` action in Convex. |

**Why tests first:** Story S5-02 must complete before Sprint 6's engine refactor (S6-01). You cannot claim "zero behavior change" without a test suite to verify against.

**Schema note:** `calculationMode` only accepts `"weighted"` and `"fixed"` — NOT `"custom"`. `commissionMode` only accepts `"proportional"` and `"fixed_monthly"` — NOT `"tiered"`. These are removed to prevent runtime crashes from unimplemented enum values. They can be added when the code to handle them exists.

---

## Sprint 6: Config-Driven Engine + Billing
**Duration:** 1 week
**Goal:** Refactor the engine to be config-aware (verified by tests), build billing features.

| # | Title | Est. | AC |
|---|-------|------|----|
| S6-01 | **Refactor projection engine: accept EngineConfig** | 4h | Given `calculateProjection(input, config)`, When `config.calculationMode === "weighted"`, Then output matches current behavior exactly (run test suite, all green). When `config.calculationMode === "fixed"`, Then each active service gets `annualAmount = service.fixedMonthlyAmount * 12` (new field on projectionServices). When config is undefined, Then defaults to weighted/proportional. |
| S6-02 | **Replace serviceName === "Comisiones" with isCommission** | 2h | Given the engine and all callers, When "Comisiones" string search finds 0 results in codebase, Then done. Update engine, validateServiceLimits, and any frontend references. |
| S6-03 | **Update projection mutations to fetch orgConfig** | 2h | Given a create/recalculate projection mutation, When called, Then it queries orgConfigs for the org, passes config to engine. If no config exists, passes undefined (engine uses defaults). |
| S6-04 | **Update service queries to filter by assignedServiceIds** | 2h | Given an org with `assignedServiceIds = [svc1, svc2, svc3]`, When `listByOrg` is called, Then only those 3 services returned. When `assignedServiceIds` is null, Then all defaults returned (current behavior). |
| S6-05 | **Invoice Status Mutation** | 2h | Given a monthlyAssignment, When Admin updates invoice status, Then status changes to invoiced/paid with timestamp. |
| S6-06 | **Billing Frequency Amount Breakdown** | 2h | Given a client with `billingFrequency: "quincenal"`, When viewing invoice breakdown, Then monthly amount is split into 2 periods. Semanal = 4 periods. |
| S6-07 | **Invoice Tracking View** | 3h | Given active projections, When navigating to invoice view, Then see all monthly assignments grouped by month with status badges (not_invoiced, invoiced, paid). Filterable by month, service, status. |
| S6-08 | **Overdue Assignment Query + Cron Job** | 3h | Given assignments with status "pending" for past months, When cron runs (or query called), Then returns overdue list. Create `convex/crons.ts` with monthly and overdue check schedules. |

---

## Sprint 7: Super Admin Panel + Dashboard
**Duration:** 1 week
**Goal:** Build the Super Admin panel and org dashboard.

| # | Title | Est. | AC |
|---|-------|------|----|
| S7-01 | **Super Admin layout + routes (/platform)** | 2h | Given a Super Admin user, When navigating to /platform, Then sees admin layout with sidebar: Organizaciones, Servicios, Templates. Non-super-admins redirected to /. |
| S7-02 | **Super Admin: Org list + create with service assignment** | 3h | Given Super Admin on /platform/orgs, When creating org, Then can set name, plan, and check which services to assign. List shows all orgs with status, plan, client count. |
| S7-03 | **Super Admin: Org config management** | 3h | Given Super Admin editing an org, When changing calculationMode to "fixed", Then saved. When toggling featureFlags.advancedConfigVisible, Then saved. UI uses dropdowns for modes, toggles for flags. Cannot select unimplemented modes. |
| S7-04 | **Super Admin: Org branding UI** | 3h | Given Super Admin on /platform/orgs/[id]/branding, When uploading logo and setting colors, Then saved to orgBranding. Logo uploaded to Convex Storage. Preview of branding applied to a sample header shown inline. |
| S7-05 | **Super Admin: Service catalog management** | 3h | Given Super Admin on /platform/services, When creating a custom service for an org, Then service created with `isCustom: true` and `orgId` set. Can edit isCommission flag and benchmarks on any service. |
| S7-06 | **Feature flag enforcement in org admin UI** | 3h | Given an org with `advancedConfigVisible: false`, When org admin views services page, Then benchmark editing is hidden. When `manualOverrideAllowed: false`, Then manual amount override in matrix cell detail is disabled. Check all 4 flags across relevant UI components. |
| S7-07 | **Dashboard Financial Summary Query** | 3h | Given projections with monthly assignments, When dashboard loads, Then shows: total projected sales, total service payments, variance by month. Role-aware (admin sees all, ejecutivo sees assigned). |
| S7-08 | **Financial Overview Chart (Recharts)** | 3h | Given financial summary data, When viewing dashboard, Then bar/line chart shows monthly sales vs payments with variance highlighted. |
| S7-09 | **Deliverable Status Summary** | 2h | Given monthly assignments, When viewing dashboard, Then shows counts by status (pending, info_received, in_progress, delivered). Empty state if no data yet. |
| S7-10 | **Per-Client Summary Cards** | 3h | Given clients with projections, When viewing dashboard, Then each client shows: active services count, documents delivered this month, pending payments. |
| S7-11 | **Dashboard Alerts & Filters** | 3h | Given overdue assignments or pending questionnaires, When viewing dashboard, Then alert badges shown. Filters by date range, client, service, status. |
| S7-12 | **Dashboard Export (CSV)** | 2h | Given dashboard data, When clicking export, Then CSV downloads with: Mes, Ventas Proyectadas, Pagos de Servicios, Varianza. Filename: `Projex_Resumen_{OrgName}_{Year}.csv`. |

---

## Sprint 8: Template System + Questionnaire
**Duration:** 1 week
**Goal:** Build the template engine and use it for questionnaires and quotations.

**Tech decision:** Use **Puppeteer** (via `@sparticuz/chromium` for serverless) for HTML-to-PDF conversion, NOT react-pdf. react-pdf cannot render arbitrary HTML templates. Install Puppeteer in this sprint.

| # | Title | Est. | AC |
|---|-------|------|----|
| S8-01 | **Super Admin: Template CRUD interface** | 3h | Given Super Admin on /platform/templates, When creating a template, Then can set: name, type (quotation/contract/deliverable_short/deliverable_long), service, org, HTML content, and variable definitions. Can edit, version (increment), activate/deactivate. |
| S8-02 | **Template variable resolution engine** | 5h | Given a template with variables, When resolving, Then: `source: "client"` reads from clients table, `source: "projection"` reads from projection/services/assignments, `source: "service"` reads from service config, `source: "manual"` returns placeholder "[PENDIENTE]", `source: "ai"` returns placeholder "[AI_PENDIENTE]". Template resolution priority: org+service > org+generic > platform+service > platform+generic. Missing required variables logged as warnings. Includes unit tests. |
| S8-03 | **Template preview with sample data** | 2h | Given a template in the CRUD interface, When clicking "Preview", Then renders HTML with sample data in a modal/panel. Sample data auto-generated from variable definitions. |
| S8-04 | **HTML-to-PDF conversion pipeline** | 4h | Given rendered HTML with branding, When generating PDF, Then PDF created with correct formatting, logo, colors, fonts. Stored in Convex Storage. Uses Puppeteer or equivalent. Includes branding injection from orgBranding. |
| S8-05 | **Questionnaire Generation Logic (deduplication)** | 3h | Given a client with active services, When generating questionnaire, Then questions deduplicated across services. Each question maps to 1+ services. Status tracking: draft, sent, in_progress, completed. |
| S8-06 | **Questionnaire Queries & Status Tracking** | 2h | Given questionnaires in DB, When querying, Then filter by org, client, projection, status. |
| S8-07 | **Questionnaire Form UI (Client-Facing)** | 4h | Given a questionnaire link, When client opens it, Then sees form with all questions, can save partially, submit when complete. Supports: text, textarea, select, multi-select, date, file upload. |
| S8-08 | **Questionnaire Management UI (Ejecutivo)** | 3h | Given submitted questionnaires, When ejecutivo views them, Then sees status, can review responses, edit if needed. |
| S8-09 | **Ejecutivo Response Review + Notification** | 3h | Given completed questionnaire, When submitted, Then ejecutivo notified via email (Resend). Ejecutivo can review and edit responses before proceeding. |
| S8-10 | **Quotation Generation (template-based)** | 3h | Given an approved questionnaire + projection data, When generating quotation, Then template selected, variables resolved, HTML rendered, quotation record created with content. |
| S8-11 | **Quotation Lifecycle Management** | 3h | Given a quotation, When status changes (draft → sent → approved/rejected), Then status updated with timestamps. Admin can edit content before sending. |

---

## Sprint 9: Contracts + AI Pipeline + Delivery + Tests
**Duration:** 1 week
**Goal:** Complete the document lifecycle with AI and automated delivery. Final testing.

| # | Title | Est. | AC |
|---|-------|------|----|
| S9-01 | **Contract Generation from Approved Quotation** | 3h | Given an approved quotation, When generating contract, Then template selected, variables resolved (including quotation data), contract record created. |
| S9-02 | **Contract Lifecycle Management** | 2h | Given a contract, When status changes (draft → sent → signed/cancelled), Then status updated. signedAt timestamp on signature. |
| S9-03 | **PDF Generation for Quotations & Contracts** | 3h | Given quotation/contract content + orgBranding, When generating PDF, Then PDF created with branding, stored in Convex Storage, URL linked to record. |
| S9-04 | **Document Cycle Tracking UI** | 3h | Given a client's projection, When viewing document cycle, Then see: Projection → Quotation (status) → Contract (status) → Deliverable (status) per service. Visual timeline/pipeline. |
| S9-05 | **AI Variable Filling (Claude API)** | 4h | Given a template with `source: "ai"` variables, When generating, Then Claude API called with context (client data, service scope, questionnaire responses). Response fills the variable. Includes: SDK setup, env var config, retry logic (max 3), error handling, cost logging to `aiLog` field. |
| S9-06 | **AI Document Auditor** | 3h | Given a generated deliverable, When auditing, Then Claude API validates: completeness, professional tone, accuracy vs questionnaire responses. Returns approved/rejected with feedback. If rejected, triggers retry (max 3 per `retryCount`). |
| S9-07 | **Document Delivery Pipeline + Email Notification** | 3h | Given an approved deliverable, When delivering, Then: mark as delivered, set deliveredAt timestamp, send email to client via Resend with PDF attachment or link. |
| S9-08 | **Monthly Check Cron Job** | 2h | Given first day of month, When cron fires, Then reviews all active projections, identifies services due this month, sends info request emails to clients for pending questionnaires. |
| S9-09 | **Integration tests** | 4h | Given the full system, When running test suite, Then covers: multi-tenant isolation (org A cannot see org B data), projection engine with all config modes, template resolution, document lifecycle end-to-end. Minimum 25 test cases. |

---

## Summary

| Sprint | Name | Stories | Status |
|--------|------|---------|--------|
| 1 | Project Setup & Multi-Tenant Foundation | 7 | DONE |
| 2 | Client Management | 7 | DONE |
| 3 | Projection Engine Core | 6 | DONE |
| 4 | Service Matrix & Seasonality | 12 | DONE |
| 5 | Auth Fix + Tests + Schema Migration | 9 | NEXT |
| 6 | Config-Driven Engine + Billing | 8 | — |
| 7 | Super Admin Panel + Dashboard | 12 | — |
| 8 | Template System + Questionnaire | 11 | — |
| 9 | Contracts + AI Pipeline + Tests | 9 | — |
| **Total** | | **81** | **32 done, 49 remaining** |

---

## Dependency Map

```
Sprint 5 (Auth + Tests + Schema)
    ├── S5-01 Auth fix ──────────────── unblocks EVERYTHING
    ├── S5-02 Engine tests ──────────── prerequisite for S6-01
    ├── S5-03/04/05 Schema tables ───── prerequisite for S7/S8
    ├── S5-06/07 Service flags ──────── prerequisite for S6-02/04
    └── S5-09 Resend setup ──────────── prerequisite for S8-09, S9-07
                    │
Sprint 6 (Engine Refactor + Billing)
    ├── S6-01/02/03 Engine refactor ── uses tests from S5-02
    ├── S6-04 Service filtering ────── uses assignedServiceIds from S5-07
    └── S6-05/06/07/08 Billing ─────── independent
                    │
Sprint 7 (Super Admin + Dashboard)
    ├── S7-01/05 Admin panel ────────── uses orgConfigs/orgBranding from S5
    ├── S7-06 Feature flags ─────────── uses featureFlags from S5-08
    └── S7-07/12 Dashboard ──────────── uses billing data from S6
                    │
Sprint 8 (Templates + Questionnaire)
    ├── S8-01/04 Template system ────── uses deliverableTemplates from S5-05
    ├── S8-04 HTML-to-PDF ───────────── uses orgBranding from S5-04
    └── S8-05/11 Questionnaire ──────── independent
                    │
Sprint 9 (Contracts + AI + Tests)
    ├── S9-01/03 Contracts ──────────── uses templates from S8
    ├── S9-05/06 AI pipeline ────────── uses templates from S8
    ├── S9-07 Delivery ──────────────── uses Resend from S5-09
    └── S9-08/09 Crons + Tests ──────── final
```

## Key Decisions Made

1. **Auth fix is Story #1** — nothing else works without it
2. **Tests before refactor** — engine tests in S5, run again after S6 refactor
3. **No "custom" or "tiered" modes in schema** — only add enum values when code exists to handle them
4. **Puppeteer for HTML-to-PDF** — react-pdf cannot render HTML templates
5. **Unique story IDs** — S5-01 through S9-09, no collisions with original epic numbering
6. **ACs on every story** — every story has Given/When/Then criteria
7. **Resend setup early (S5)** — unblocks notifications in S8 and S9
8. **Cron jobs in S6 and S9** — overdue check with billing, monthly check with delivery
