# Projex - Sprint Plan

## Overview

This sprint plan organizes the 52 stories from 9 epics into 6 one-week sprints. Stories are grouped by logical dependency and epic alignment. Each sprint contains 5-8 stories.

---

## Sprint 1: Project Setup & Multi-Tenant Foundation
**Duration:** 1 week
**Epic Coverage:** Epic 1

| Story | Title | Epic | Est. |
|-------|-------|------|------|
| 1.1 | Initialize Next.js + Convex Project | 1 | 2h |
| 1.2 | Define Complete Convex Schema | 1 | 3h |
| 1.3 | Configure Clerk + Convex Authentication | 1 | 3h |
| 1.4 | Implement Auth Middleware & Role Helpers | 1 | 2h |
| 1.5 | Seed Default Services | 1 | 2h |
| 1.6 | Organization CRUD & Super Admin Queries | 1 | 3h |
| 1.7 | App Shell Layout with Sidebar Navigation | 1 | 3h |

**Sprint Goal:** Establish the project infrastructure, database schema, authentication, authorization, multi-tenant isolation, and app shell so that all subsequent epics build on a solid foundation.

---

## Sprint 2: Client Management
**Duration:** 1 week
**Epic Coverage:** Epic 2

| Story | Title | Epic | Est. |
|-------|-------|------|------|
| 2.1 | Client List and Create Mutations | 2 | 3h |
| 2.2 | Role-Based Client Filtering | 2 | 2h |
| 2.3 | New Client Form UI | 2 | 3h |
| 2.4 | Edit Client | 2 | 2h |
| 2.5 | Archive Client (Soft Delete) | 2 | 2h |
| 2.6 | Client List Page with Search & Filters | 2 | 3h |
| 2.7 | Client Detail Page | 2 | 3h |

**Sprint Goal:** Deliver full CRUD operations for consulting firm clients, scoped by organization, with search, filters, and role-based visibility.

---

## Sprint 3: Projection Engine Core
**Duration:** 1 week
**Epic Coverage:** Epic 3

| Story | Title | Epic | Est. |
|-------|-------|------|------|
| 3.1 | Implement Pure Projection Engine Library | 3 | 4h |
| 3.2 | Projection Engine Unit Tests | 3 | 3h |
| 3.3 | Create Projection Mutation | 3 | 3h |
| 3.4 | Projection Queries (getByClient, getById) | 3 | 2h |
| 3.5 | Recalculate Projection Mutation | 3 | 3h |
| 3.6 | Projection Input Form (Step 1 - Basic Data) | 3 | 3h |

**Sprint Goal:** Implement the pure projection calculation engine replicating Excel logic, create/recalculate mutations, projection queries, and the first step of the projection input wizard.

---

## Sprint 4: Service Matrix & Seasonality
**Duration:** 1 week
**Epic Coverage:** Epic 4 + Epic 5

| Story | Title | Epic | Est. |
|-------|-------|------|------|
| 4.1 | Service List Queries | 4 | 2h |
| 4.2 | Service Configuration Page | 4 | 3h |
| 4.3 | Service Configurator in Projection Wizard (Step 3) | 4 | 3h |
| 4.4 | Projection Services & Monthly Assignment Queries | 4 | 2h |
| 4.5 | Projection Matrix View (12x9 Grid) | 4 | 4h |
| 4.6 | Matrix Summary Totals | 4 | 2h |
| 4.7 | Matrix Cell Detail Panel & Filters | 4 | 3h |
| 5.1 | Monthly Sales Input Form (Wizard Step 2) | 5 | 3h |
| 5.2 | Seasonality Bar Chart | 5 | 2h |
| 5.3 | Projection Review Step (Wizard Step 4) | 5 | 3h |
| 5.4 | Manual Monthly Amount Override | 5 | 2h |
| 5.5 | Toggle Service Active/Inactive and Recalculate | 5 | 2h |

**Sprint Goal:** Build the service configuration UI, projection matrix grid with status tracking, seasonality input/visualization, and complete the 4-step projection wizard.

---

## Sprint 5: Billing & Dashboard
**Duration:** 1 week
**Epic Coverage:** Epic 6 + Epic 7

| Story | Title | Epic | Est. |
|-------|-------|------|------|
| 6.1 | Invoice Status Mutation | 6 | 2h |
| 6.2 | Billing Frequency Amount Breakdown | 6 | 2h |
| 6.3 | Invoice Tracking View | 6 | 3h |
| 6.4 | Monthly Assignment Status Updates | 6 | 2h |
| 6.5 | Overdue Assignment Query | 6 | 2h |
| 7.1 | Dashboard Financial Summary Query | 7 | 3h |
| 7.2 | Financial Overview Chart (Sales vs. Payments) | 7 | 3h |
| 7.3 | Deliverable Status Summary | 7 | 2h |
| 7.4 | Per-Client Summary Cards | 7 | 3h |
| 7.5 | Dashboard Alerts & Filters | 7 | 3h |
| 7.6 | Dashboard Export (CSV) | 7 | 2h |

**Sprint Goal:** Build the invoice tracking view with billing frequency support, delivery status management, and the main dashboard with financial charts, deliverable tracking, client summary cards, and export.

---

## Sprint 6: Questionnaire & Quotation/Contract
**Duration:** 1 week
**Epic Coverage:** Epic 8 + Epic 9

| Story | Title | Epic | Est. |
|-------|-------|------|------|
| 8.1 | Questionnaire Generation Logic | 8 | 3h |
| 8.2 | Questionnaire Queries & Status Tracking | 8 | 2h |
| 8.3 | Questionnaire Form UI (Client-Facing) | 8 | 4h |
| 8.4 | Questionnaire Management UI (Ejecutivo) | 8 | 3h |
| 8.5 | Ejecutivo Response Review & Edit | 8 | 2h |
| 8.6 | Admin Questionnaire Template Configuration | 8 | 2h |
| 9.1 | Quotation Generation Mutation | 9 | 3h |
| 9.2 | Quotation Lifecycle Management | 9 | 3h |
| 9.3 | Contract Generation from Approved Quotation | 9 | 3h |
| 9.4 | Contract Lifecycle Management | 9 | 2h |
| 9.5 | PDF Generation for Quotations & Contracts | 9 | 4h |
| 9.6 | Document Cycle Tracking UI | 9 | 3h |

**Sprint Goal:** Build the unified questionnaire system with deduplication and client-facing form, plus automated quotation/contract generation with lifecycle management, PDF generation, and document cycle tracking.

---

## Summary

| Sprint | Name | Stories | Epics |
|--------|------|---------|-------|
| 1 | Project Setup & Multi-Tenant Foundation | 7 | Epic 1 |
| 2 | Client Management | 7 | Epic 2 |
| 3 | Projection Engine Core | 6 | Epic 3 |
| 4 | Service Matrix & Seasonality | 12 | Epic 4, 5 |
| 5 | Billing & Dashboard | 11 | Epic 6, 7 |
| 6 | Questionnaire & Quotation/Contract | 12 | Epic 8, 9 |
| **Total** | | **55** | **9 Epics** |
