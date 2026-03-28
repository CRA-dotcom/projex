# Projex - Unified Sprint Plan

## Overview

This plan merges the original 55 stories with 20 new stories from the Modular Architecture spec. Sprints 1-4 are complete. Sprints 5-8 integrate billing, dashboard, templates, branding, AI pipeline, and config-driven customization.

**Design spec:** `docs/superpowers/specs/2026-03-28-modular-architecture-design.md`

---

## Sprint 1: Project Setup & Multi-Tenant Foundation — DONE
**Epic Coverage:** Epic 1

| Story | Title | Est. | Status |
|-------|-------|------|--------|
| 1.1 | Initialize Next.js + Convex Project | 2h | DONE |
| 1.2 | Define Complete Convex Schema | 3h | DONE |
| 1.3 | Configure Clerk + Convex Authentication | 3h | DONE |
| 1.4 | Implement Auth Middleware & Role Helpers | 2h | DONE |
| 1.5 | Seed Default Services | 2h | DONE |
| 1.6 | Organization CRUD & Super Admin Queries | 3h | DONE |
| 1.7 | App Shell Layout with Sidebar Navigation | 3h | DONE |

---

## Sprint 2: Client Management — DONE
**Epic Coverage:** Epic 2

| Story | Title | Est. | Status |
|-------|-------|------|--------|
| 2.1 | Client List and Create Mutations | 3h | DONE |
| 2.2 | Role-Based Client Filtering | 2h | DONE |
| 2.3 | New Client Form UI | 3h | DONE |
| 2.4 | Edit Client | 2h | DONE |
| 2.5 | Archive Client (Soft Delete) | 2h | DONE |
| 2.6 | Client List Page with Search & Filters | 3h | DONE |
| 2.7 | Client Detail Page | 3h | DONE |

---

## Sprint 3: Projection Engine Core — DONE
**Epic Coverage:** Epic 3

| Story | Title | Est. | Status |
|-------|-------|------|--------|
| 3.1 | Implement Pure Projection Engine Library | 4h | DONE |
| 3.2 | Projection Engine Unit Tests | 3h | PENDING |
| 3.3 | Create Projection Mutation | 3h | DONE |
| 3.4 | Projection Queries (getByClient, getById) | 2h | DONE |
| 3.5 | Recalculate Projection Mutation | 3h | DONE |
| 3.6 | Projection Input Form (Step 1 - Basic Data) | 3h | DONE |

---

## Sprint 4: Service Matrix & Seasonality — DONE
**Epic Coverage:** Epic 4 + Epic 5

| Story | Title | Est. | Status |
|-------|-------|------|--------|
| 4.1 | Service List Queries | 2h | DONE |
| 4.2 | Service Configuration Page | 3h | DONE |
| 4.3 | Service Configurator in Projection Wizard (Step 3) | 3h | DONE |
| 4.4 | Projection Services & Monthly Assignment Queries | 2h | DONE |
| 4.5 | Projection Matrix View (12x9 Grid) | 4h | DONE |
| 4.6 | Matrix Summary Totals | 2h | DONE |
| 4.7 | Matrix Cell Detail Panel & Filters | 3h | DONE |
| 5.1 | Monthly Sales Input Form (Wizard Step 2) | 3h | DONE |
| 5.2 | Seasonality Bar Chart | 2h | DONE |
| 5.3 | Projection Review Step (Wizard Step 4) | 3h | DONE |
| 5.4 | Manual Monthly Amount Override | 2h | DONE |
| 5.5 | Toggle Service Active/Inactive and Recalculate | 2h | DONE |

---

## Sprint 5: Modular Foundation + Billing
**Epic Coverage:** Config + Epic 6

Schema migration, config-driven engine, service flags, branding, and billing.

| # | Title | Epic | Est. |
|---|-------|------|------|
| 5.1 | Add orgConfigs, orgBranding, deliverableTemplates tables to schema | Config | 2h |
| 5.2 | Add isCommission + isCustom flags to services, update seed | Config | 2h |
| 5.3 | Add assignedServiceIds to organizations table | Config | 1h |
| 5.4 | Refactor projection engine to accept EngineConfig | Config | 3h |
| 5.5 | Replace serviceName === "Comisiones" with isCommission flag | Config | 1h |
| 5.6 | OrgConfig defaults + CRUD mutations/queries | Config | 2h |
| 5.7 | OrgBranding CRUD mutations/queries + logo storage | Config | 2h |
| 5.8 | Invoice Status Mutation | 6 | 2h |
| 5.9 | Billing Frequency Amount Breakdown | 6 | 2h |
| 5.10 | Invoice Tracking View | 6 | 3h |
| 5.11 | Monthly Assignment Status Updates | 6 | 2h |
| 5.12 | Overdue Assignment Query | 6 | 2h |

**Sprint Goal:** Lay the modular foundation (config tables, engine refactor, service flags) and build billing/invoice tracking. After this sprint, the system is config-driven with zero behavior change for existing orgs.

---

## Sprint 6: Super Admin Panel + Dashboard
**Epic Coverage:** Config + Epic 7

| # | Title | Epic | Est. |
|---|-------|------|------|
| 6.1 | Super Admin layout + routes (/admin) | Config | 2h |
| 6.2 | Super Admin: Org list + create with service assignment | Config | 3h |
| 6.3 | Super Admin: Org config management (calculation mode, feature flags) | Config | 3h |
| 6.4 | Super Admin: Org branding UI (logo upload, colors, fonts) | Config | 3h |
| 6.5 | Super Admin: Custom service creation per org | Config | 2h |
| 6.6 | Feature flag enforcement in org admin UI | Config | 2h |
| 6.7 | Dashboard Financial Summary Query | 7 | 3h |
| 6.8 | Financial Overview Chart (Sales vs. Payments) | 7 | 3h |
| 6.9 | Deliverable Status Summary | 7 | 2h |
| 6.10 | Per-Client Summary Cards | 7 | 3h |
| 6.11 | Dashboard Alerts & Filters | 7 | 3h |
| 6.12 | Dashboard Export (CSV) | 7 | 2h |

**Sprint Goal:** Complete Super Admin panel for managing orgs, configs, branding, and services. Build the full dashboard with financial charts, alerts, and export.

---

## Sprint 7: Templates + Questionnaire + Quotation
**Epic Coverage:** Templates + Epic 8 + Epic 9 (partial)

| # | Title | Epic | Est. |
|---|-------|------|------|
| 7.1 | Super Admin: Template CRUD interface | Templates | 3h |
| 7.2 | Template variable resolution engine | Templates | 3h |
| 7.3 | Template preview with sample data | Templates | 2h |
| 7.4 | PDF branding injection utility | Templates | 2h |
| 7.5 | HTML-to-PDF conversion pipeline | Templates | 3h |
| 7.6 | Questionnaire Generation Logic (deduplication) | 8 | 3h |
| 7.7 | Questionnaire Queries & Status Tracking | 8 | 2h |
| 7.8 | Questionnaire Form UI (Client-Facing) | 8 | 4h |
| 7.9 | Questionnaire Management UI (Ejecutivo) | 8 | 3h |
| 7.10 | Ejecutivo Response Review & Edit | 8 | 2h |
| 7.11 | Questionnaire Template Configuration (uses deliverableTemplates) | 8 | 2h |
| 7.12 | Quotation Generation (template-based) | 9 | 3h |
| 7.13 | Quotation Lifecycle Management | 9 | 3h |

**Sprint Goal:** Build the template system (CRUD, variables, preview, PDF), then use it to power questionnaires and quotation generation.

---

## Sprint 8: Contracts + AI Pipeline + Delivery
**Epic Coverage:** Epic 9 (remaining) + AI

| # | Title | Epic | Est. |
|---|-------|------|------|
| 8.1 | Contract Generation from Approved Quotation (template-based) | 9 | 3h |
| 8.2 | Contract Lifecycle Management | 9 | 2h |
| 8.3 | PDF Generation for Quotations & Contracts (with branding) | 9 | 4h |
| 8.4 | Document Cycle Tracking UI | 9 | 3h |
| 8.5 | AI Variable Filling (Claude API integration) | AI | 3h |
| 8.6 | AI Document Auditor (quality validation) | AI | 3h |
| 8.7 | Document Delivery Pipeline + Notifications | AI | 2h |
| 8.8 | Projection Engine Unit Tests | 3 | 3h |
| 8.9 | End-to-end integration tests | QA | 3h |

**Sprint Goal:** Complete the document lifecycle (contracts, PDF with branding), integrate AI for content generation and auditing, and add tests.

---

## Summary

| Sprint | Name | Stories | Status |
|--------|------|---------|--------|
| 1 | Project Setup & Multi-Tenant Foundation | 7 | DONE |
| 2 | Client Management | 7 | DONE |
| 3 | Projection Engine Core | 6 | DONE (tests pending) |
| 4 | Service Matrix & Seasonality | 12 | DONE |
| 5 | Modular Foundation + Billing | 12 | NEXT |
| 6 | Super Admin Panel + Dashboard | 12 | — |
| 7 | Templates + Questionnaire + Quotation | 13 | — |
| 8 | Contracts + AI Pipeline + Delivery | 9 | — |
| **Total** | | **78** | **32 done, 46 remaining** |

---

## Dependency Map

```
Sprint 5 (Config + Billing)
    ├── 5.1-5.7 Config foundation ──────┐
    └── 5.8-5.12 Billing ──────────────┐│
                                        ││
Sprint 6 (Super Admin + Dashboard)     ││
    ├── 6.1-6.6 Super Admin ◄──────────┘│
    └── 6.7-6.12 Dashboard ◄────────────┘
                                        │
Sprint 7 (Templates + Questionnaire)   │
    ├── 7.1-7.5 Template system ◄───────┘
    ├── 7.6-7.11 Questionnaire
    └── 7.12-7.13 Quotation ◄── uses templates
                                        │
Sprint 8 (Contracts + AI + Tests)      │
    ├── 8.1-8.4 Contracts ◄────────────┘
    ├── 8.5-8.7 AI Pipeline ◄── uses templates + branding
    └── 8.8-8.9 Tests
```
