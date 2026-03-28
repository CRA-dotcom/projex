---
stepsCompleted: [01,02,03,04,05]
inputDocuments: [prd.md, architecture.md]
---

# Projex - Epic Breakdown

## Overview

This document breaks down the Projex MVP (Phases 1-3) into 9 epics and 52 stories. Each story is scoped to 1-4 hours of implementation work. Stories are ordered so that dependencies flow naturally: schema before functions, functions before UI, backend before frontend. Phase 4 (AI Deliverables), Phase 5 (Automation), and Phase 6 (Platform SaaS) are excluded as they are blocked by template completion or out of MVP scope.

---

## Requirements Inventory

### Functional Requirements

**Module 1: Client Management (CM)**
| ID | Requirement | Priority |
|----|-------------|----------|
| CM-01 | Create a new client with: name, RFC, industry, annual revenue, billing frequency | Must |
| CM-02 | Edit existing client data | Must |
| CM-03 | Soft-delete / archive a client (preserve historical data) | Must |
| CM-04 | List clients with search and filters (industry, revenue range, billing frequency) | Must |
| CM-05 | Client detail view showing all projections, documents, and deliverables | Must |
| CM-06 | All client records scoped to the logged-in user's orgId | Must |
| CM-07 | Ejecutivo can only see clients assigned to them; Admin sees all | Should |
| CM-08 | Billing frequency options: semanal, quincenal, mensual | Must |
| CM-09 | Validate RFC format (Mexican tax ID) | Should |

**Module 2: Projection Engine (PE)**
| ID | Requirement | Priority |
|----|-------------|----------|
| PE-01 | Accept inputs: projected annual sales, total budget, commission rate, industry | Must |
| PE-02 | Accept 12 monthly sales estimates and auto-compute FE factors | Must |
| PE-03 | FE calculation: FE_month = Monthly_Sales / (Annual_Sales / 12) | Must |
| PE-04 | Display 9 services with benchmarks (min_pct, max_pct, default_pct) | Must |
| PE-05 | Allow toggling each service active/inactive per projection | Must |
| PE-06 | Allow adjusting chosen_pct within the min-max range per service | Must |
| PE-07 | Compute annual commissions = Annual_Sales x Commission_Rate | Must |
| PE-08 | Compute remaining budget = Total_Budget - Annual_Commissions | Must |
| PE-09 | Normalize weights: weight_i = chosen_pct_i / SUM(chosen_pct of all active services excl. Comisiones) | Must |
| PE-10 | Annual allocation per service = Remaining_Budget x normalized_weight | Must |
| PE-11 | Monthly base = Annual_Allocation / 12 | Must |
| PE-12 | Adjusted monthly amount = Monthly_Base x FE_month | Must |
| PE-13 | Comisiones monthly = Monthly_Sales x Commission_Rate (proportional to revenue, not normalized) | Must |
| PE-14 | Generate the full Projection Matrix: 12 months x N active services grid with amounts | Must |
| PE-15 | Validate that no service exceeds its max_pct of annual revenue | Must |
| PE-16 | Allow manual override of individual monthly amounts (with recalculation warning) | Should |
| PE-17 | Save projection with all computed data (projection_services + monthly_assignments) | Must |
| PE-18 | Support multiple projections per client (e.g., year-over-year) | Should |
| PE-19 | Projection summary: total by service, total by month, grand total | Must |

**Module 3: Service Matrix (SM)**
| ID | Requirement | Priority |
|----|-------------|----------|
| SM-01 | Display a matrix view: rows = active services, columns = 12 months | Must |
| SM-02 | Each cell shows: assigned amount, document status, invoice status | Must |
| SM-03 | Color-code cells by status (not started, in progress, delivered, overdue) | Must |
| SM-04 | Click on a cell to see detail: projection amount, quotation status, contract status, deliverable status | Must |
| SM-05 | Allow Admin/Ejecutivo to activate/deactivate services for specific months | Should |
| SM-06 | Show totals per row (annual per service) and per column (monthly total) | Must |
| SM-07 | Filter matrix by status, service type, or amount range | Should |
| SM-08 | Export matrix to CSV/Excel | Should |

**Module 4: Unified Questionnaire (UQ)**
| ID | Requirement | Priority |
|----|-------------|----------|
| UQ-01 | Generate a unified questionnaire based on the client's active services | Must |
| UQ-02 | Deduplicate questions: if a question applies to multiple services, ask it only once | Must |
| UQ-03 | Map each response to all services that require it | Must |
| UQ-04 | Support question types: text, textarea, file upload, select, multi-select, date | Must |
| UQ-05 | Track questionnaire status: draft, sent, in_progress, completed | Must |
| UQ-06 | Allow partial saves (client can return and continue) | Should |
| UQ-07 | Notify ejecutivo when questionnaire is completed | Must |
| UQ-08 | Ejecutivo can review and edit responses before proceeding | Should |
| UQ-09 | Questions are defined per service in the template configuration | Must |
| UQ-10 | Admin can customize questionnaire templates per service | Must |

**Module 5: Quotation & Contract (QC)**
| ID | Requirement | Priority |
|----|-------------|----------|
| QC-01 | Auto-generate a quotation when a service is activated in a projection | Must |
| QC-02 | Quotation includes: service scope, monthly amounts, total annual amount, terms | Must |
| QC-03 | Quotation status lifecycle: draft -> sent -> approved / rejected | Must |
| QC-04 | Generate contract from approved quotation | Must |
| QC-05 | Contract includes: legal terms, service scope, payment schedule, signatures | Must |
| QC-06 | Contract status lifecycle: draft -> sent -> signed / cancelled | Must |
| QC-07 | Generate PDFs with organization branding for both documents | Must |
| QC-08 | Store PDFs in Convex Storage with URLs in the database | Must |
| QC-09 | Allow manual editing of generated content before finalizing | Should |
| QC-10 | Track the full document cycle per service: Projection -> Quotation -> Contract -> Deliverable | Must |

**Module 7: Dashboard (DA)**
| ID | Requirement | Priority |
|----|-------------|----------|
| DA-01 | Financial summary: total projected sales vs. total service payments by month (Recharts) | Must |
| DA-02 | Budget variance: difference between projected and actual payments per month | Must |
| DA-03 | Deliverable tracking: count of documents by status (pending, in progress, delivered, overdue) | Must |
| DA-04 | Per-client summary card: active services, documents delivered this month, pending payments | Must |
| DA-05 | Alerts for: overdue deliverables, pending questionnaires, unpaid invoices | Should |
| DA-06 | Filter dashboard by date range, client, service, or status | Should |
| DA-07 | Role-based views: Admin sees all clients, Ejecutivo sees only assigned clients | Must |
| DA-08 | Export dashboard data to PDF or CSV | Should |

**Module 8: Platform Admin (PA) -- MVP subset only**
| ID | Requirement | Priority |
|----|-------------|----------|
| PA-01 | List all organizations with status, plan, creation date, client count | Must |
| PA-02 | Create a new organization: name, plan, Clerk Organization setup | Must |
| PA-03 | Activate / deactivate / suspend an organization | Must |

### Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Page load time | < 2 seconds |
| Performance | Projection calculation | < 3 seconds for full 12x9 matrix |
| Performance | Real-time updates | Convex reactive queries update UI within 500ms |
| Security | Authentication | Clerk-managed with email + social |
| Security | Authorization | RBAC (Super Admin, Admin, Ejecutivo, Viewer) at Convex function level |
| Security | Multi-tenant isolation | Every query/mutation filters by orgId |
| Security | API key protection | Convex env vars, never exposed to client |
| Usability | Language | UI in Spanish |
| Usability | Responsive | Desktop-first, functional on tablet |
| Usability | Onboarding | Empty states with clear CTAs |
| Reliability | Error handling | Graceful errors with user-friendly messages |

### FR Coverage Map

| FR-ID | Epic | Story |
|-------|------|-------|
| CM-01 | Epic 2 | Story 2.3 |
| CM-02 | Epic 2 | Story 2.4 |
| CM-03 | Epic 2 | Story 2.5 |
| CM-04 | Epic 2 | Story 2.6 |
| CM-05 | Epic 2 | Story 2.7 |
| CM-06 | Epic 2 | Story 2.2 |
| CM-07 | Epic 2 | Story 2.2 |
| CM-08 | Epic 2 | Story 2.3 |
| CM-09 | Epic 2 | Story 2.3 |
| PE-01 | Epic 3 | Story 3.2 |
| PE-02 | Epic 5 | Story 5.1 |
| PE-03 | Epic 5 | Story 5.1 |
| PE-04 | Epic 4 | Story 4.1 |
| PE-05 | Epic 4 | Story 4.3 |
| PE-06 | Epic 4 | Story 4.3 |
| PE-07 | Epic 3 | Story 3.1 |
| PE-08 | Epic 3 | Story 3.1 |
| PE-09 | Epic 3 | Story 3.1 |
| PE-10 | Epic 3 | Story 3.1 |
| PE-11 | Epic 3 | Story 3.1 |
| PE-12 | Epic 3 | Story 3.1 |
| PE-13 | Epic 3 | Story 3.1 |
| PE-14 | Epic 4 | Story 4.5 |
| PE-15 | Epic 4 | Story 4.3 |
| PE-16 | Epic 5 | Story 5.4 |
| PE-17 | Epic 3 | Story 3.3 |
| PE-18 | Epic 3 | Story 3.4 |
| PE-19 | Epic 4 | Story 4.6 |
| SM-01 | Epic 4 | Story 4.5 |
| SM-02 | Epic 4 | Story 4.5 |
| SM-03 | Epic 4 | Story 4.5 |
| SM-04 | Epic 4 | Story 4.7 |
| SM-05 | Epic 4 | Story 4.3 |
| SM-06 | Epic 4 | Story 4.6 |
| SM-07 | Epic 4 | Story 4.7 |
| SM-08 | Epic 4 | Story 4.7 |
| UQ-01 | Epic 8 | Story 8.1 |
| UQ-02 | Epic 8 | Story 8.1 |
| UQ-03 | Epic 8 | Story 8.2 |
| UQ-04 | Epic 8 | Story 8.3 |
| UQ-05 | Epic 8 | Story 8.2 |
| UQ-06 | Epic 8 | Story 8.3 |
| UQ-07 | Epic 8 | Story 8.5 |
| UQ-08 | Epic 8 | Story 8.5 |
| UQ-09 | Epic 8 | Story 8.1 |
| UQ-10 | Epic 8 | Story 8.6 |
| QC-01 | Epic 9 | Story 9.1 |
| QC-02 | Epic 9 | Story 9.1 |
| QC-03 | Epic 9 | Story 9.2 |
| QC-04 | Epic 9 | Story 9.3 |
| QC-05 | Epic 9 | Story 9.3 |
| QC-06 | Epic 9 | Story 9.4 |
| QC-07 | Epic 9 | Story 9.5 |
| QC-08 | Epic 9 | Story 9.5 |
| QC-09 | Epic 9 | Story 9.2 |
| QC-10 | Epic 9 | Story 9.6 |
| DA-01 | Epic 7 | Story 7.1 |
| DA-02 | Epic 7 | Story 7.2 |
| DA-03 | Epic 7 | Story 7.3 |
| DA-04 | Epic 7 | Story 7.4 |
| DA-05 | Epic 7 | Story 7.5 |
| DA-06 | Epic 7 | Story 7.5 |
| DA-07 | Epic 7 | Story 7.1 |
| DA-08 | Epic 7 | Story 7.6 |
| PA-01 | Epic 1 | Story 1.6 |
| PA-02 | Epic 1 | Story 1.6 |
| PA-03 | Epic 1 | Story 1.6 |

---

## Epic List

- **Epic 1:** Project Setup & Multi-Tenant Foundation
- **Epic 2:** Client Management
- **Epic 3:** Projection Engine Core
- **Epic 4:** Service Matrix & Configuration
- **Epic 5:** Seasonality & Monthly Calculations
- **Epic 6:** Billing & Invoicing View
- **Epic 7:** Dashboard
- **Epic 8:** Unified Questionnaire
- **Epic 9:** Quotation & Contract Generation

---

## Epic 1: Project Setup & Multi-Tenant Foundation

**Goal:** Establish the project infrastructure, database schema, authentication, authorization, and multi-tenant isolation so that all subsequent epics build on a solid, secure foundation.

**Dependencies:** None (this is the foundation).

### Story 1.1: Initialize Next.js + Convex Project

As a developer,
I want a scaffolded Next.js 15 + Convex project with all core dependencies installed,
So that development can begin on a working boilerplate.

**Acceptance Criteria:**
**Given** a fresh project directory
**When** I run `npm run dev` and `npx convex dev`
**Then** the app loads with a hello world page connected to Convex, Tailwind CSS and shadcn/ui are configured, and the dev server runs without errors.

**Technical Notes:**
- Initialize with `npx create-next-app@latest` (App Router, TypeScript, Tailwind CSS)
- Run `npx convex init` to set up the Convex project
- Install dependencies: `convex`, `@clerk/nextjs`, `@clerk/clerk-react`, `convex/react-clerk`, `shadcn/ui`, `recharts`, `@react-pdf/renderer`, `react-hook-form`, `zod`, `@hookform/resolvers`
- Create `app/layout.tsx`, `app/page.tsx` with basic structure
- Create `app/providers.tsx` with placeholder for Clerk + Convex providers

**Files to create/modify:**
- `package.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/providers.tsx`
- `tailwind.config.ts`
- `convex/` directory (auto-generated by `npx convex init`)

---

### Story 1.2: Define Complete Convex Schema

As a developer,
I want the full database schema defined in Convex with all 10 tables, validators, and indexes,
So that all backend functions have a typed schema to work against.

**Acceptance Criteria:**
**Given** the Convex project is initialized
**When** I run `npx convex dev`
**Then** all 10 tables (organizations, clients, projections, services, projectionServices, monthlyAssignments, questionnaireResponses, quotations, contracts, deliverables) are created with all fields, validators, and indexes matching the architecture doc.

**Technical Notes:**
- Implement the full schema from architecture doc Section 2.1
- All tables except `organizations` must include `orgId: v.string()`
- Ensure all indexes are defined (by_orgId, by_clerkOrgId, by_clientId, etc.)
- Use `v.id()` references for foreign keys
- Use `v.union()` and `v.literal()` for status enums

**Files to create/modify:**
- `convex/schema.ts`

---

### Story 1.3: Configure Clerk + Convex Authentication

As a developer,
I want Clerk Organizations integrated with Convex authentication,
So that users can log in and their identity (including orgId and role) is available in every Convex function.

**Acceptance Criteria:**
**Given** a Clerk account is configured with Organization support
**When** a user signs in via the Clerk UI component
**Then** the Convex context receives the authenticated identity with `subject`, `orgId`, and `orgRole` fields, and unauthenticated requests to Convex functions throw an error.

**Technical Notes:**
- Create Clerk application with Organizations enabled
- Define roles in Clerk: `org:admin`, `org:ejecutivo`, `org:viewer`
- Configure `convex/auth.config.ts` with Clerk issuer URL
- Update `app/providers.tsx` with `ClerkProvider` + `ConvexProviderWithClerk`
- Create sign-in and sign-up pages at `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Set environment variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL`

**Files to create/modify:**
- `convex/auth.config.ts`
- `app/providers.tsx`
- `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- `.env.local` (document required variables, do not commit)

---

### Story 1.4: Implement Auth Middleware & Role Helpers

As a developer,
I want reusable auth middleware functions (requireAuth, requireRole, requireSuperAdmin),
So that every Convex function can enforce authentication and role-based access with a single function call.

**Acceptance Criteria:**
**Given** a Convex query or mutation handler
**When** it calls `requireAuth(ctx)`
**Then** it receives `{ userId, orgId, role }` if authenticated, or throws "Not authenticated" if no identity exists.
**Given** a handler calls `requireRole(ctx, ["admin", "ejecutivo"])`
**When** the user's role is "viewer"
**Then** the function throws "Forbidden" with the role mismatch message.

**Technical Notes:**
- Implement `requireAuth()` that extracts identity from `ctx.auth.getUserIdentity()`
- Map Clerk roles (`org:admin` -> `admin`, `org:ejecutivo` -> `ejecutivo`, `org:viewer` -> `viewer`)
- Handle Super Admin via `publicMetadata.role === "super_admin"` with `orgId = "__platform__"`
- Default to `viewer` (least privilege) for unknown roles
- Implement `requireSuperAdmin()` for platform-level operations

**Files to create/modify:**
- `convex/lib/authHelpers.ts`

---

### Story 1.5: Seed Default Services

As a developer,
I want the 9 default services pre-loaded in the database,
So that new organizations inherit standard benchmark data.

**Acceptance Criteria:**
**Given** the services table is empty
**When** I run the seed function
**Then** 9 services are created with correct names, types (base/comodin), min_pct, max_pct, default_pct, sortOrder, and `isDefault: true`, with `orgId` set to undefined (global defaults).

**Technical Notes:**
- Create seed function at `convex/functions/services/seed.ts`
- 6 base services: Legal (1-3%, 2%), Contable (2-4%, 3%), TI (4-7%, 5.5%), Marketing (10-15%, 12.5%), RH (3-5%, 4%), Admin (3-5%, 4%)
- 3 comodin services: Comisiones (N/A, = commission rate), Logistica (4-8%, 6%), Construccion (2-5%, 3.5%)
- Include sortOrder for display ordering
- Make idempotent: check if services already exist before inserting

**Files to create/modify:**
- `convex/functions/services/seed.ts`
- `convex/functions/services/queries.ts` (listGlobal query for verification)

---

### Story 1.6: Organization CRUD & Super Admin Queries

As a Super Admin,
I want to create, list, and manage organizations,
So that I can onboard new consulting firms onto the platform.

**Acceptance Criteria:**
**Given** I am authenticated as a Super Admin
**When** I call the create organization mutation with name and plan
**Then** an organization record is created with `clerkOrgId`, `status: "active"`, and `createdAt` timestamp.
**Given** I call the list organizations query
**When** organizations exist in the database
**Then** I see all organizations with their status, plan, and creation date.

**Technical Notes:**
- Implement `convex/functions/organizations/mutations.ts`: create, update, updateStatus
- Implement `convex/functions/organizations/queries.ts`: list, getById, getByClerkOrgId
- All organization mutations require `requireSuperAdmin()`
- `getByClerkOrgId` uses the `by_clerkOrgId` index

**Files to create/modify:**
- `convex/functions/organizations/queries.ts`
- `convex/functions/organizations/mutations.ts`

---

### Story 1.7: App Shell Layout with Sidebar Navigation

As a user,
I want a dashboard layout with sidebar navigation and top bar,
So that I can navigate between modules of the application.

**Acceptance Criteria:**
**Given** I am authenticated and have an active organization
**When** the dashboard loads
**Then** I see a sidebar with navigation links (Dashboard, Clientes, Servicios, Configuracion), a top bar with the organization name and user menu, and a main content area that renders the active page.

**Technical Notes:**
- Create `app/(dashboard)/layout.tsx` with sidebar + topbar + main content area
- Use shadcn/ui components: `Sheet` for mobile sidebar, `NavigationMenu` or custom sidebar
- Top bar shows org name (from Clerk), user avatar, and sign-out button
- Sidebar links: Dashboard (`/`), Clientes (`/clients`), Servicios (`/services`), Configuracion (`/settings`)
- Empty state pages for each route
- Create `app/(platform)/layout.tsx` as a stub for Super Admin routes

**Files to create/modify:**
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/page.tsx` (dashboard placeholder)
- `app/(platform)/layout.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/TopBar.tsx`

---

## Epic 2: Client Management

**Goal:** Full CRUD operations for consulting firm clients, scoped by organization, with search, filters, and role-based visibility.

**Dependencies:** Epic 1 (schema, auth, layout).

### Story 2.1: Client List and Create Mutations

As a developer,
I want backend functions for creating and listing clients,
So that the UI can display and manage the client list.

**Acceptance Criteria:**
**Given** I am authenticated as Admin or Ejecutivo
**When** I call the create client mutation with name, RFC, industry, annualRevenue, billingFrequency
**Then** a client record is created with `orgId` from my auth context, `isArchived: false`, and `assignedTo` set to my userId.
**Given** I call the list clients query
**When** clients exist for my organization
**Then** I receive only clients belonging to my orgId, excluding archived clients by default.

**Technical Notes:**
- Implement `convex/functions/clients/mutations.ts`: create mutation
- Implement `convex/functions/clients/queries.ts`: list query, getById query
- list uses `by_orgId_archived` index, filters by `isArchived` arg (default false)
- create stamps `orgId` from auth, sets `createdAt: Date.now()`
- Enforce `requireRole(ctx, ["admin", "ejecutivo"])` on create

**Files to create/modify:**
- `convex/functions/clients/mutations.ts`
- `convex/functions/clients/queries.ts`

---

### Story 2.2: Role-Based Client Filtering

As an Ejecutivo,
I want to only see clients assigned to me,
So that I focus on my portfolio without seeing other ejecutivos' clients.

**Acceptance Criteria:**
**Given** I am authenticated as Ejecutivo
**When** I call the list clients query
**Then** I only see clients where `assignedTo` matches my userId.
**Given** I am authenticated as Admin
**When** I call the list clients query
**Then** I see all clients in my organization regardless of assignment.

**Technical Notes:**
- Extend the list query in `convex/functions/clients/queries.ts`
- After fetching by `by_orgId_archived` index, if `role === "ejecutivo"`, filter results by `assignedTo === userId`
- Admin and Super Admin skip the assignedTo filter

**Files to create/modify:**
- `convex/functions/clients/queries.ts` (update list handler)

---

### Story 2.3: New Client Form UI

As an Ejecutivo,
I want a form to create a new client with all required fields,
So that I can onboard clients into the system.

**Acceptance Criteria:**
**Given** I navigate to `/clients/new`
**When** I fill in name, RFC, industry, annual revenue, and select billing frequency (semanal/quincenal/mensual)
**Then** the form validates all fields (RFC format validation, positive revenue, required fields), and on submit the client is saved and I am redirected to the client list with a success message.

**Technical Notes:**
- Create `app/(dashboard)/clients/new/page.tsx`
- Use React Hook Form + Zod for validation
- RFC validation: basic Mexican RFC pattern (3-4 letters + 6 digits + 3 alphanumeric)
- Billing frequency as radio group or select: semanal, quincenal, mensual
- Call `useMutation(api.functions.clients.mutations.create)` on submit
- On success, redirect to `/clients` with toast notification
- UI labels in Spanish

**Files to create/modify:**
- `app/(dashboard)/clients/new/page.tsx`
- `components/clients/ClientForm.tsx`
- `convex/lib/validators.ts` (shared validators for RFC, etc.)

---

### Story 2.4: Edit Client

As an Ejecutivo,
I want to edit an existing client's information,
So that I can keep client data up to date.

**Acceptance Criteria:**
**Given** I am viewing a client's detail page
**When** I click "Editar" and modify the client's name and annual revenue
**Then** the changes are saved to the database and the UI reflects the updated values in real-time.

**Technical Notes:**
- Add `update` mutation to `convex/functions/clients/mutations.ts`
- Accepts partial args (all fields optional except clientId)
- Verify `client.orgId === orgId` before update
- Reuse `ClientForm` component from Story 2.3 in edit mode (pre-populated)
- Create edit route or use a modal/sheet on the detail page

**Files to create/modify:**
- `convex/functions/clients/mutations.ts` (add update mutation)
- `components/clients/ClientForm.tsx` (support edit mode with initial values)

---

### Story 2.5: Archive Client (Soft Delete)

As an Admin,
I want to archive a client instead of permanently deleting them,
So that historical data is preserved for projections and documents.

**Acceptance Criteria:**
**Given** I am an Admin viewing the client list
**When** I click "Archivar" on a client and confirm the action
**Then** the client's `isArchived` field is set to true, and the client no longer appears in the default client list.
**Given** I toggle the "Mostrar archivados" filter
**When** archived clients exist
**Then** they appear in the list with a visual indicator that they are archived.

**Technical Notes:**
- Add `archive` mutation to `convex/functions/clients/mutations.ts`
- Requires `requireRole(ctx, ["admin"])` -- only Admin can archive
- Sets `isArchived: true` on the client record
- UI: confirmation dialog before archiving
- List query already supports `isArchived` filter via `by_orgId_archived` index

**Files to create/modify:**
- `convex/functions/clients/mutations.ts` (add archive mutation)
- `app/(dashboard)/clients/page.tsx` (archive toggle filter)

---

### Story 2.6: Client List Page with Search & Filters

As an Ejecutivo,
I want to search and filter my client list by industry, revenue range, and billing frequency,
So that I can quickly find specific clients.

**Acceptance Criteria:**
**Given** I am on the clients page
**When** I type a client name in the search box
**Then** the list filters to show only matching clients.
**Given** I select an industry filter
**When** clients exist in that industry
**Then** only those clients are shown.

**Technical Notes:**
- Create `app/(dashboard)/clients/page.tsx` with DataTable (shadcn/ui)
- Add `search` query to `convex/functions/clients/queries.ts` using `by_orgId_industry` index
- Client-side filtering for text search (name) on the reactive query results
- Filters: industry (select), billing frequency (select), revenue range (min/max inputs)
- Columns: name, RFC, industry, annual revenue, billing frequency, actions (edit, archive, view)
- Empty state: "No tienes clientes aun. Crea tu primer cliente."

**Files to create/modify:**
- `app/(dashboard)/clients/page.tsx`
- `convex/functions/clients/queries.ts` (add search query)
- `components/clients/ClientDataTable.tsx`
- `components/clients/ClientFilters.tsx`

---

### Story 2.7: Client Detail Page

As an Ejecutivo,
I want a detail page for each client showing their projections, documents, and deliverables,
So that I have a complete view of the client's status.

**Acceptance Criteria:**
**Given** I click on a client in the list
**When** the client detail page loads
**Then** I see the client's basic info (name, RFC, industry, revenue, billing frequency), a tab for projections (empty state if none), a tab for documents, and a tab for deliverables.

**Technical Notes:**
- Create `app/(dashboard)/clients/[clientId]/page.tsx`
- Use `useQuery(api.functions.clients.queries.getById, { clientId })` for client data
- Tabs: "Informacion", "Proyecciones", "Documentos", "Entregables"
- Projection tab will be populated in Epic 3; show empty state with CTA "Crear Proyeccion"
- Documents and deliverables tabs show empty states for now
- Breadcrumb: Clientes > {Client Name}

**Files to create/modify:**
- `app/(dashboard)/clients/[clientId]/page.tsx`
- `components/clients/ClientDetail.tsx`
- `components/clients/ClientTabs.tsx`

---

## Epic 3: Projection Engine Core

**Goal:** Implement the pure projection calculation engine, the create/recalculate mutations, and the projection input form. This is the mathematical core that replicates the Excel logic.

**Dependencies:** Epic 1 (schema, auth), Epic 2 (client CRUD).

### Story 3.1: Implement Pure Projection Engine Library

As a developer,
I want a pure TypeScript function that executes the 7-step projection algorithm,
So that the calculation logic is testable, deterministic, and reusable.

**Acceptance Criteria:**
**Given** valid ProjectionInput (annualSales, totalBudget, commissionRate, 12 monthlyData entries, services array)
**When** I call `calculateProjection(input)`
**Then** the output contains:
- Correct seasonality factors (FE = monthlySales / averageMonthlySales)
- annualCommissions = annualSales * commissionRate
- remainingBudget = totalBudget - annualCommissions
- Normalized weights for active services (excluding Comisiones)
- Annual allocation per service = remainingBudget * normalizedWeight
- Monthly amounts = (annualAllocation / 12) * FE_month
- Comisiones monthly = monthlySales * commissionRate
- grandTotal summing all service annual amounts

**Technical Notes:**
- Implement all types: SeasonalityInput, ServiceInput, ProjectionInput, MonthlyAllocation, ServiceAllocation, ProjectionOutput
- Implement `calculateProjection()` as defined in architecture Section 6.3
- Round monetary amounts to 2 decimal places
- Handle edge cases: zero annualSales (FE = 1), no active services, zero commissionRate
- This is a pure function -- no Convex imports, no side effects

**Files to create/modify:**
- `convex/lib/projectionEngine.ts`

---

### Story 3.2: Projection Engine Unit Tests

As a developer,
I want unit tests for the projection engine that validate against known Excel outputs,
So that I can guarantee the calculations match the existing manual process.

**Acceptance Criteria:**
**Given** a test case with known inputs matching an existing Excel projection
**When** I run the projection engine with those inputs
**Then** the output amounts match the Excel values within a tolerance of $0.01 per cell.

**Technical Notes:**
- Create test file alongside the engine
- Test cases: (1) basic 3-service projection, (2) all 9 services active, (3) high seasonality variance, (4) zero commission rate, (5) single active service, (6) Comisiones-only projection
- Verify: FE factors sum to ~12 (not exactly, but proportional), normalized weights sum to 1.0, service monthly amounts sum to annual allocation
- Use Vitest or built-in Node test runner

**Files to create/modify:**
- `convex/lib/projectionEngine.test.ts`

---

### Story 3.3: Create Projection Mutation

As a developer,
I want a Convex mutation that accepts projection inputs, runs the engine, and persists results,
So that projection data (projection, projection_services, monthly_assignments) is saved atomically.

**Acceptance Criteria:**
**Given** I am an authenticated Admin or Ejecutivo
**When** I call the create projection mutation with clientId, year, annualSales, totalBudget, commissionRate, monthlyData, and services
**Then** the engine runs and creates: 1 projection record, N projectionServices records (one per active service), and N*12 monthlyAssignments records (one per service per month), all stamped with orgId.

**Technical Notes:**
- Implement `convex/functions/projections/mutations.ts`: create mutation
- Verify client belongs to org before proceeding
- Resolve service names from service IDs
- Call `calculateProjection()` from `convex/lib/projectionEngine.ts`
- Insert projection with `status: "draft"`
- Loop through serviceAllocations to insert projectionServices and monthlyAssignments
- All monthlyAssignments start with `status: "pending"`, `invoiceStatus: "not_invoiced"`
- Implement as per architecture Section 6.4

**Files to create/modify:**
- `convex/functions/projections/mutations.ts`

---

### Story 3.4: Projection Queries (getByClient, getById)

As a developer,
I want queries to fetch projections by client and by ID,
So that the UI can display projection lists and details.

**Acceptance Criteria:**
**Given** a client has one or more projections
**When** I call getByClient with the clientId
**Then** I receive all projections for that client, ordered by year descending.
**Given** a projection ID
**When** I call getById
**Then** I receive the projection with its status, inputs, and seasonality data.

**Technical Notes:**
- Implement `convex/functions/projections/queries.ts`: getByClient, getById
- getByClient uses `by_clientId` index, verifies orgId
- getById fetches by primary key, verifies orgId
- Both enforce `requireAuth(ctx)` and orgId check

**Files to create/modify:**
- `convex/functions/projections/queries.ts`

---

### Story 3.5: Recalculate Projection Mutation

As an Ejecutivo,
I want to recalculate an existing projection when I change service percentages or inputs,
So that the matrix updates without creating a new projection.

**Acceptance Criteria:**
**Given** an existing projection in "draft" status
**When** I call recalculate with updated inputs (new service percentages, new monthly sales, etc.)
**Then** all existing projectionServices and monthlyAssignments for that projection are deleted and recreated with the new calculated values, and the projection's `updatedAt` timestamp is refreshed.

**Technical Notes:**
- Implement `recalculate` mutation in `convex/functions/projections/mutations.ts`
- Only allow recalculation if projection status is "draft"
- Delete all existing projectionServices by `by_projectionId` index
- Delete all existing monthlyAssignments by `by_projectionId` index
- Rerun `calculateProjection()` with new inputs
- Reinsert all child records
- Update projection's `updatedAt` and any changed input fields

**Files to create/modify:**
- `convex/functions/projections/mutations.ts` (add recalculate)

---

### Story 3.6: Projection Input Form (Step 1 - Basic Data)

As an Ejecutivo,
I want a multi-step projection wizard starting with basic financial inputs,
So that I can enter the annual sales, total budget, and commission rate for a client.

**Acceptance Criteria:**
**Given** I navigate to `/clients/[clientId]/projections/new`
**When** I enter annual sales ($50,000,000), total budget ($30,000,000), commission rate (2%), and year (2026)
**Then** the values are validated (positive numbers, commission rate 0-10%), and I can proceed to step 2.

**Technical Notes:**
- Create `app/(dashboard)/clients/[clientId]/projections/new/page.tsx`
- Implement `ProjectionWizard` component with step management (React state)
- Step 1: annualSales (currency input), totalBudget (currency input), commissionRate (percentage input), year (select/input)
- Use React Hook Form + Zod for validation
- Currency inputs formatted as MXN
- Store wizard state in React useState (not persisted until final submit)

**Files to create/modify:**
- `app/(dashboard)/clients/[clientId]/projections/new/page.tsx`
- `components/projections/ProjectionWizard.tsx`
- `components/projections/BasicDataStep.tsx`

---

## Epic 4: Service Matrix & Configuration

**Goal:** Build the service configuration UI, the projection matrix grid, and the interactive matrix with status tracking for each service/month cell.

**Dependencies:** Epic 1 (services seed), Epic 3 (projection engine).

### Story 4.1: Service List Queries

As a developer,
I want queries to list global default services and organization-specific overrides,
So that the UI can display services with correct benchmarks per organization.

**Acceptance Criteria:**
**Given** the services table has 9 global defaults
**When** I call listGlobal
**Then** I receive all 9 services ordered by sortOrder.
**Given** an organization has overridden the Marketing benchmark
**When** I call listByOrg
**Then** I receive the org-specific Marketing service and the global defaults for the other 8 services.

**Technical Notes:**
- Implement `convex/functions/services/queries.ts`: listGlobal, listByOrg
- listGlobal: query services where `orgId` is undefined, ordered by sortOrder
- listByOrg: query both org-specific (by `by_orgId` index) and global services; merge with org overrides taking precedence
- Both require authentication

**Files to create/modify:**
- `convex/functions/services/queries.ts`

---

### Story 4.2: Service Configuration Page

As an Admin,
I want to view and customize service benchmarks for my organization,
So that projections use our firm's specific percentage ranges.

**Acceptance Criteria:**
**Given** I navigate to `/services`
**When** the page loads
**Then** I see a table of 9 services with their type (base/comodin), min %, max %, and default %, and I can edit the percentages for my organization.
**Given** I adjust Marketing's max_pct from 15% to 18%
**When** I save the change
**Then** an org-specific override is created, and future projections for this org use the updated benchmark.

**Technical Notes:**
- Create `app/(dashboard)/services/page.tsx`
- Implement `createOrgOverride` and `update` mutations in `convex/functions/services/mutations.ts`
- createOrgOverride copies a global service with the org's orgId and modified values
- Display as a table with inline editing (or edit modal)
- Comisiones row shows "Calculado automaticamente" instead of editable percentages
- Only Admin role can edit; Ejecutivo and Viewer see read-only

**Files to create/modify:**
- `app/(dashboard)/services/page.tsx`
- `convex/functions/services/mutations.ts`
- `components/services/ServiceConfigTable.tsx`

---

### Story 4.3: Service Configurator in Projection Wizard (Step 3)

As an Ejecutivo,
I want to toggle services active/inactive and adjust chosen percentages during projection creation,
So that I can customize which services apply to each client.

**Acceptance Criteria:**
**Given** I am on step 3 of the projection wizard
**When** the 9 services are displayed with their benchmark ranges
**Then** I can toggle each service on/off, adjust the chosen_pct via a slider within min-max bounds, and see the percentage validated in real-time.
**Given** I set a service's chosen_pct above its max_pct
**When** I try to proceed
**Then** a validation error prevents me from continuing.

**Technical Notes:**
- Create `components/projections/ServiceConfiguratorStep.tsx`
- Fetch services via `useQuery(api.functions.services.queries.listByOrg)`
- Each service row: toggle switch (active/inactive), name, type badge, slider for chosen_pct (min to max range), current percentage display
- Comisiones is always active if commissionRate > 0, with no percentage slider
- Real-time validation: warn if chosen_pct is outside min-max
- Pass service configuration to wizard state for final submission

**Files to create/modify:**
- `components/projections/ServiceConfiguratorStep.tsx`
- `components/projections/ProjectionWizard.tsx` (integrate step 3)

---

### Story 4.4: Projection Services & Monthly Assignment Queries

As a developer,
I want queries to fetch projection services and monthly assignments for a given projection,
So that the matrix view can display the full grid of services x months.

**Acceptance Criteria:**
**Given** a projection with 6 active services
**When** I call listByProjection for projectionServices
**Then** I receive 6 records with serviceName, chosenPct, normalizedWeight, annualAmount, isActive.
**Given** the same projection
**When** I call listByProjection for monthlyAssignments
**Then** I receive 72 records (6 services x 12 months) with amount, feFactor, status, invoiceStatus.

**Technical Notes:**
- Implement `convex/functions/projectionServices/queries.ts`: listByProjection
- Implement `convex/functions/monthlyAssignments/queries.ts`: listByProjection, listByClientMonth
- listByProjection uses `by_projectionId` index
- listByClientMonth uses `by_clientId_month` index for cross-projection views

**Files to create/modify:**
- `convex/functions/projectionServices/queries.ts`
- `convex/functions/monthlyAssignments/queries.ts`

---

### Story 4.5: Projection Matrix View (12x9 Grid)

As an Ejecutivo,
I want to see a matrix grid showing 12 months x N active services with amounts and color-coded status,
So that I can visually monitor the projection at a glance.

**Acceptance Criteria:**
**Given** a saved projection with active services
**When** I navigate to `/clients/[clientId]/projections/[projectionId]`
**Then** I see a grid where rows are active services, columns are months (Ene-Dic), each cell shows the adjusted monthly amount formatted as MXN currency, and cells are color-coded by status (pending=gray, in_progress=blue, delivered=green, overdue=red).

**Technical Notes:**
- Create `app/(dashboard)/clients/[clientId]/projections/[projectionId]/page.tsx`
- Create `components/projections/ProjectionMatrix.tsx`
- Fetch data: projectionServices + monthlyAssignments via queries from Story 4.4
- Group monthlyAssignments by projServiceId, then by month
- Color coding: pending (#gray), info_received (#yellow), in_progress (#blue), delivered (#green)
- Comisiones row styled differently (e.g., italic or different background)
- Responsive: horizontal scroll for 12 columns on smaller screens

**Files to create/modify:**
- `app/(dashboard)/clients/[clientId]/projections/[projectionId]/page.tsx`
- `components/projections/ProjectionMatrix.tsx`
- `components/projections/MatrixCell.tsx`

---

### Story 4.6: Matrix Summary Totals

As an Ejecutivo,
I want to see totals per service (row totals) and per month (column totals) in the matrix,
So that I can verify the projection numbers add up correctly.

**Acceptance Criteria:**
**Given** the projection matrix is displayed
**When** I look at the last column
**Then** I see the annual total per service (sum of 12 monthly amounts).
**When** I look at the last row
**Then** I see the monthly total across all services.
**When** I look at the bottom-right cell
**Then** I see the grand total matching the projection's grandTotal.

**Technical Notes:**
- Extend `ProjectionMatrix.tsx` to calculate and display row/column totals
- Add a "Total" column at the end of each row
- Add a "Total" row at the bottom of the grid
- Grand total cell at intersection
- Format all amounts as MXN currency
- Verify grand total matches `remainingBudget + annualCommissions`

**Files to create/modify:**
- `components/projections/ProjectionMatrix.tsx` (extend with totals)

---

### Story 4.7: Matrix Cell Detail Panel & Filters

As an Ejecutivo,
I want to click on a matrix cell to see its detail (document statuses) and filter the matrix by status,
So that I can drill into specific service/month combinations and find items needing attention.

**Acceptance Criteria:**
**Given** the projection matrix is displayed
**When** I click on a cell (e.g., Marketing, March)
**Then** a side panel opens showing: amount, FE factor, delivery status, invoice status, quotation status, contract status.
**Given** I select "Pendiente" in the status filter
**When** the matrix re-renders
**Then** only cells with `status === "pending"` are highlighted; others are dimmed.

**Technical Notes:**
- Create `components/projections/CellDetailPanel.tsx` (shadcn/ui Sheet or Drawer)
- Panel fetches related quotation and contract by projServiceId if they exist
- Status filter: dropdown above the matrix (all, pending, in_progress, delivered)
- Apply filter by dimming non-matching cells (CSS opacity) rather than hiding them
- Optional: export matrix to CSV using a utility function

**Files to create/modify:**
- `components/projections/CellDetailPanel.tsx`
- `components/projections/MatrixFilters.tsx`
- `components/projections/ProjectionMatrix.tsx` (integrate panel + filters)

---

## Epic 5: Seasonality & Monthly Calculations

**Goal:** Build the monthly sales input form, the seasonality visualization, and the monthly amount calculation with FE factors.

**Dependencies:** Epic 3 (projection engine), Epic 4 (matrix view).

### Story 5.1: Monthly Sales Input Form (Wizard Step 2)

As an Ejecutivo,
I want to enter 12 monthly sales estimates during projection creation,
So that the system computes seasonality factors (FE) for each month.

**Acceptance Criteria:**
**Given** I am on step 2 of the projection wizard
**When** I enter estimated sales for each of the 12 months
**Then** the FE factor for each month is computed and displayed in real-time (FE = monthlySales / averageMonthlySales), and the sum of monthly sales should approximately equal the annual sales from step 1 (with a warning if they diverge by more than 5%).

**Technical Notes:**
- Create `components/projections/MonthlySalesStep.tsx`
- 12 currency input fields (Enero through Diciembre)
- Real-time FE calculation displayed next to each month
- Auto-compute average monthly sales = annualSales / 12
- Visual indicator: FE > 1 (high season, green), FE < 1 (low season, orange), FE ~ 1 (normal, gray)
- Warning if SUM(monthlySales) differs from annualSales by > 5%
- Optional: "Distribuir uniformemente" button that sets each month to annualSales / 12

**Files to create/modify:**
- `components/projections/MonthlySalesStep.tsx`
- `components/projections/ProjectionWizard.tsx` (integrate step 2)

---

### Story 5.2: Seasonality Bar Chart

As an Ejecutivo,
I want a visual bar chart of monthly sales and FE factors,
So that I can see the seasonality pattern at a glance.

**Acceptance Criteria:**
**Given** I have entered 12 monthly sales values in the wizard
**When** the chart renders
**Then** I see a bar chart with 12 bars (one per month), where bar height represents monthly sales, and a line overlay showing the FE factor. A horizontal line at FE=1 serves as the baseline reference.

**Technical Notes:**
- Create `components/projections/SeasonalityChart.tsx`
- Use Recharts: ComposedChart with Bar (monthly sales) + Line (FE factor) + ReferenceLine at FE=1
- X-axis: month abbreviations (Ene, Feb, Mar, ...)
- Left Y-axis: sales in MXN
- Right Y-axis: FE factor
- Tooltip showing exact values on hover
- Responsive container

**Files to create/modify:**
- `components/projections/SeasonalityChart.tsx`

---

### Story 5.3: Projection Review Step (Wizard Step 4)

As an Ejecutivo,
I want a review step showing the complete projection before saving,
So that I can verify all inputs and calculated values before committing.

**Acceptance Criteria:**
**Given** I have completed steps 1-3 of the projection wizard
**When** step 4 (Review) loads
**Then** I see a summary: basic data (annual sales, budget, commission rate), seasonality chart, service configuration table, and a preview of the projection matrix with amounts. I can click "Guardar Proyeccion" to save or go back to any step to make changes.

**Technical Notes:**
- Create `components/projections/ReviewStep.tsx`
- Run `calculateProjection()` client-side with the wizard state data to generate the preview
- Display the preview matrix using a read-only version of `ProjectionMatrix`
- Show key totals: annual commissions, remaining budget, grand total
- "Guardar" button calls the create projection mutation from Story 3.3
- On success, redirect to `/clients/[clientId]/projections/[projectionId]`
- Loading state while mutation executes

**Files to create/modify:**
- `components/projections/ReviewStep.tsx`
- `components/projections/ProjectionWizard.tsx` (integrate step 4 + submit logic)

---

### Story 5.4: Manual Monthly Amount Override

As an Ejecutivo,
I want to manually override individual monthly amounts in the matrix,
So that I can handle exceptions without recalculating the entire projection.

**Acceptance Criteria:**
**Given** I am viewing a projection matrix in draft status
**When** I double-click on a cell and enter a new amount
**Then** a confirmation dialog warns "Este cambio no esta vinculado al calculo automatico. Deseas continuar?" and on confirmation the amount is updated.
**Given** I override an amount
**When** the totals recalculate
**Then** the row and column totals reflect the overridden value.

**Technical Notes:**
- Add `updateAmount` mutation to `convex/functions/monthlyAssignments/mutations.ts`
- Only allowed on projections with status "draft"
- Inline edit: double-click cell -> input field -> blur or enter to save
- Confirmation dialog (shadcn/ui AlertDialog)
- After save, the reactive query automatically updates totals in the UI

**Files to create/modify:**
- `convex/functions/monthlyAssignments/mutations.ts`
- `components/projections/MatrixCell.tsx` (add inline edit)

---

### Story 5.5: Toggle Service Active/Inactive and Recalculate

As an Ejecutivo,
I want to toggle a service active or inactive on an existing projection and have amounts recalculate,
So that I can adjust service scope after initial creation.

**Acceptance Criteria:**
**Given** a projection in "draft" status with 6 active services
**When** I deactivate the TI service
**Then** the system recalculates: TI's budget is redistributed among remaining active services using normalized weights, all monthly assignments update, and the matrix reflects the new amounts.

**Technical Notes:**
- Implement `toggleActive` mutation in `convex/functions/projectionServices/mutations.ts`
- toggleActive sets `isActive` to false/true
- After toggling, call the `recalculate` mutation from Story 3.5
- UI: toggle switch on each service row in the matrix header or a dedicated panel
- Only available for "draft" projections

**Files to create/modify:**
- `convex/functions/projectionServices/mutations.ts`
- `components/projections/ProjectionMatrix.tsx` (add toggle controls)

---

## Epic 6: Billing & Invoicing View

**Goal:** Build the invoice tracking view where ejecutivos manage invoice status per monthly assignment, respecting billing frequency.

**Dependencies:** Epic 4 (monthly assignments), Epic 5 (matrix).

### Story 6.1: Invoice Status Mutation

As a developer,
I want a mutation to update the invoice status of a monthly assignment,
So that ejecutivos can track the billing lifecycle (not_invoiced -> invoiced -> paid).

**Acceptance Criteria:**
**Given** a monthly assignment with `invoiceStatus: "not_invoiced"`
**When** I call updateInvoiceStatus with `invoiceStatus: "invoiced"`
**Then** the record updates and the change is reflected in real-time on all connected clients.
**Given** the status is "invoiced"
**When** I call updateInvoiceStatus with `invoiceStatus: "paid"`
**Then** the record updates to "paid".

**Technical Notes:**
- Implement `updateInvoiceStatus` mutation in `convex/functions/monthlyAssignments/mutations.ts`
- Enforce valid transitions: not_invoiced -> invoiced -> paid (no skipping, no backwards)
- Requires `requireRole(ctx, ["admin", "ejecutivo"])`
- Verify orgId before updating

**Files to create/modify:**
- `convex/functions/monthlyAssignments/mutations.ts` (add updateInvoiceStatus)

---

### Story 6.2: Billing Frequency Amount Breakdown

As an Ejecutivo,
I want to see how monthly amounts break down by billing frequency,
So that I know the correct invoice amount per billing period.

**Acceptance Criteria:**
**Given** a client with `billingFrequency: "quincenal"` and a monthly assignment of $100,000
**When** I view the billing detail for that assignment
**Then** I see: "Monto mensual: $100,000 | Por quincena: $50,000" (2 payments).
**Given** `billingFrequency: "semanal"`
**Then** I see: "Monto mensual: $100,000 | Por semana: $25,000" (4 payments).

**Technical Notes:**
- Add billing frequency logic to the CellDetailPanel from Story 4.7
- Fetch client's billingFrequency and compute: semanal = amount/4, quincenal = amount/2, mensual = amount
- Display breakdown in the cell detail panel
- No new backend function needed -- client's billingFrequency is already available

**Files to create/modify:**
- `components/projections/CellDetailPanel.tsx` (add billing breakdown section)

---

### Story 6.3: Invoice Tracking View

As an Ejecutivo,
I want a dedicated billing view that shows all monthly assignments with their invoice status,
So that I can manage invoicing across all clients and services in one place.

**Acceptance Criteria:**
**Given** I navigate to a client's projection
**When** I click the "Facturacion" tab
**Then** I see a table of all monthly assignments for that projection, grouped by month, showing: service name, amount, billing breakdown, invoice status (badge), and action buttons to advance the status.

**Technical Notes:**
- Add a "Facturacion" tab to the projection detail page
- Create `components/billing/InvoiceTrackingTable.tsx`
- Table columns: Mes, Servicio, Monto, Frecuencia de Cobro, Desglose, Estatus, Acciones
- Status badges: not_invoiced (gray), invoiced (yellow), paid (green)
- Action button: "Marcar como Facturado" or "Marcar como Pagado" depending on current status
- Group rows by month with subtotals

**Files to create/modify:**
- `components/billing/InvoiceTrackingTable.tsx`
- `app/(dashboard)/clients/[clientId]/projections/[projectionId]/page.tsx` (add billing tab)

---

### Story 6.4: Monthly Assignment Status Updates

As an Ejecutivo,
I want to update the delivery status of a monthly assignment,
So that the matrix reflects the actual progress of each service/month.

**Acceptance Criteria:**
**Given** a monthly assignment with `status: "pending"`
**When** I change the status to "info_received"
**Then** the matrix cell color updates to reflect the new status, and the change is saved.

**Technical Notes:**
- Implement `updateStatus` mutation in `convex/functions/monthlyAssignments/mutations.ts`
- Valid transitions: pending -> info_received -> in_progress -> delivered
- Status dropdown or button group in the CellDetailPanel
- Matrix color coding updates reactively via Convex subscription

**Files to create/modify:**
- `convex/functions/monthlyAssignments/mutations.ts` (add updateStatus)
- `components/projections/CellDetailPanel.tsx` (add status change controls)

---

### Story 6.5: Overdue Assignment Query

As a developer,
I want a query that identifies overdue monthly assignments,
So that the dashboard and alerts can surface items needing attention.

**Acceptance Criteria:**
**Given** it is April 2026
**When** I call listOverdue
**Then** I receive all monthly assignments for the current org where `month < 4`, `year === 2026`, and `status !== "delivered"`.

**Technical Notes:**
- Implement `listOverdue` query in `convex/functions/monthlyAssignments/queries.ts`
- Uses `by_orgId_status` index to find non-delivered assignments
- Filter client-side for month < current month and year <= current year
- Returns assignments with denormalized serviceName and clientId for display

**Files to create/modify:**
- `convex/functions/monthlyAssignments/queries.ts` (add listOverdue)

---

## Epic 7: Dashboard

**Goal:** Build the main dashboard with financial overview charts, deliverable tracking, per-client summary cards, and role-based filtering.

**Dependencies:** Epic 3 (projections), Epic 4 (matrix), Epic 6 (billing).

### Story 7.1: Dashboard Financial Summary Query

As a developer,
I want a query that aggregates financial data for the dashboard,
So that the UI can display sales vs. payments by month.

**Acceptance Criteria:**
**Given** an organization with active projections
**When** I call financialSummary with a year
**Then** I receive an array of 12 objects, each containing: month, totalProjectedSales, totalServicePayments (sum of amounts where invoiceStatus === "paid"), totalPending (sum where invoiceStatus !== "paid").
**Given** I am an Ejecutivo
**Then** the summary only includes data from clients assigned to me.

**Technical Notes:**
- Implement `convex/functions/dashboard/queries.ts`: financialSummary
- Query monthlyAssignments by `by_orgId_year_month` index
- Aggregate by month: sum amounts, split by invoiceStatus
- For projected sales: sum monthlySales from projections' seasonalityData
- Role filtering: if Ejecutivo, filter by assigned clients

**Files to create/modify:**
- `convex/functions/dashboard/queries.ts`

---

### Story 7.2: Financial Overview Chart (Sales vs. Payments)

As an Admin,
I want a chart showing projected sales vs. actual service payments by month,
So that I can monitor the financial health of the business.

**Acceptance Criteria:**
**Given** the dashboard loads
**When** financial data exists for the current year
**Then** I see a bar/line chart with: projected sales (line), service payments received (bars), and a visual gap showing the variance. The chart has 12 data points (Jan-Dec) with tooltips and a legend.

**Technical Notes:**
- Create `components/dashboard/FinancialOverviewChart.tsx`
- Use Recharts: ComposedChart with Bar (payments) + Line (projected sales)
- X-axis: months (Ene-Dic)
- Y-axis: MXN amount
- Tooltip with formatted currency
- Responsive container
- Year selector dropdown above chart

**Files to create/modify:**
- `app/(dashboard)/page.tsx` (integrate dashboard components)
- `components/dashboard/FinancialOverviewChart.tsx`

---

### Story 7.3: Deliverable Status Summary

As an Admin,
I want to see a summary of document statuses across all clients,
So that I can identify bottlenecks in the delivery pipeline.

**Acceptance Criteria:**
**Given** the dashboard loads
**When** monthly assignments exist
**Then** I see a summary widget showing counts by status: Pendiente, Informacion Recibida, En Proceso, Entregado, and a pie chart visualization of the distribution.

**Technical Notes:**
- Implement `deliverableStats` query in `convex/functions/dashboard/queries.ts`
- Count monthlyAssignments grouped by status for the current org and year
- Create `components/dashboard/DeliverableStatusCard.tsx`
- Use Recharts PieChart for visualization
- Display total count and percentage per status

**Files to create/modify:**
- `convex/functions/dashboard/queries.ts` (add deliverableStats)
- `components/dashboard/DeliverableStatusCard.tsx`

---

### Story 7.4: Per-Client Summary Cards

As an Admin,
I want summary cards for each active client on the dashboard,
So that I can see at a glance which clients need attention.

**Acceptance Criteria:**
**Given** the dashboard loads
**When** clients with active projections exist
**Then** I see a grid of cards, each showing: client name, number of active services, documents delivered this month, pending payments count, and a progress bar indicating the overall completion for the current month.

**Technical Notes:**
- Implement `overviewByClient` query in `convex/functions/dashboard/queries.ts`
- For each client: count active projectionServices, count monthlyAssignments by status for current month, count invoiceStatus by type
- Create `components/dashboard/ClientSummaryCard.tsx`
- Card layout: client name (bold), service count badge, delivered/total progress bar, pending payment alert
- Grid layout: 3 columns on desktop, 1 on mobile

**Files to create/modify:**
- `convex/functions/dashboard/queries.ts` (add overviewByClient)
- `components/dashboard/ClientSummaryCard.tsx`
- `app/(dashboard)/page.tsx` (integrate cards)

---

### Story 7.5: Dashboard Alerts & Filters

As an Admin,
I want to see alerts for overdue deliverables and pending questionnaires, and filter the dashboard by client or date range,
So that I can prioritize actions and focus on specific segments.

**Acceptance Criteria:**
**Given** overdue assignments exist (past month, not delivered)
**When** the dashboard loads
**Then** an alert banner at the top shows "X entregas vencidas requieren atencion" with a link to the overdue list.
**Given** I select a specific client from the filter
**When** the dashboard re-renders
**Then** all widgets (charts, cards, alerts) filter to show only that client's data.

**Technical Notes:**
- Use the `listOverdue` query from Story 6.5
- Alert component: shadcn/ui Alert with count and link
- Also check for pending questionnaires (questionnaireResponses with status !== "completed")
- Filter controls: client select dropdown, year select
- Filters update query params, which are passed as args to dashboard queries

**Files to create/modify:**
- `components/dashboard/AlertBanner.tsx`
- `components/dashboard/DashboardFilters.tsx`
- `app/(dashboard)/page.tsx` (integrate filters + alerts)

---

### Story 7.6: Dashboard Export (CSV)

As an Admin,
I want to export dashboard data to CSV,
So that I can share reports with stakeholders who do not have platform access.

**Acceptance Criteria:**
**Given** the dashboard is showing data
**When** I click "Exportar CSV"
**Then** a CSV file is downloaded containing the financial summary data (month, projected sales, actual payments, variance) for the selected year.

**Technical Notes:**
- Create a utility function `lib/exportCsv.ts` that converts JSON data to CSV and triggers a download
- Button in the dashboard header area
- CSV columns: Mes, Ventas Proyectadas, Pagos de Servicios, Varianza
- Filename format: `Projex_Resumen_{OrgName}_{Year}.csv`
- Client-side only -- no backend function needed

**Files to create/modify:**
- `lib/exportCsv.ts`
- `app/(dashboard)/page.tsx` (add export button)

---

## Epic 8: Unified Questionnaire

**Goal:** Build the questionnaire system that generates a unified form from active services, deduplicates shared questions, maps responses to services, and tracks completion status.

**Dependencies:** Epic 3 (projections), Epic 4 (projection services).

### Story 8.1: Questionnaire Generation Logic

As a developer,
I want a function that generates a unified questionnaire from a projection's active services,
So that clients receive a single form covering all services without duplicate questions.

**Acceptance Criteria:**
**Given** a projection with 5 active services, where 3 services share the question "Razon Social"
**When** I call the create questionnaire mutation
**Then** a questionnaireResponses record is created with a `responses` array containing "Razon Social" once (with `serviceNames` listing all 3 services), plus all unique questions from each service.

**Technical Notes:**
- Implement `convex/functions/questionnaires/mutations.ts`: create
- The mutation reads active projectionServices for the projection
- For MVP, questions are defined as a static mapping per service name in `convex/lib/questionnaireConfig.ts`
- Deduplication logic: questions with the same `questionId` across services appear once, with `serviceNames` merged
- Initial status: "draft"
- Each response entry: `{ questionId, questionText, answer: "", serviceNames: [...] }`

**Files to create/modify:**
- `convex/functions/questionnaires/mutations.ts`
- `convex/lib/questionnaireConfig.ts` (static question definitions per service)

---

### Story 8.2: Questionnaire Queries & Status Tracking

As a developer,
I want queries to fetch questionnaires by projection and by client, and mutations to update status,
So that the UI can display and manage questionnaire lifecycle.

**Acceptance Criteria:**
**Given** a projection has a questionnaire
**When** I call getByProjection
**Then** I receive the questionnaire with all responses, status, and completion timestamp.
**Given** a questionnaire status is "draft"
**When** I call updateStatus with "sent"
**Then** the status updates to "sent".

**Technical Notes:**
- Implement `convex/functions/questionnaires/queries.ts`: getByProjection, getByClient
- Implement `updateStatus` mutation: valid transitions draft -> sent -> in_progress -> completed
- getByProjection uses `by_projectionId` index
- getByClient uses `by_clientId` index

**Files to create/modify:**
- `convex/functions/questionnaires/queries.ts`
- `convex/functions/questionnaires/mutations.ts` (add updateStatus)

---

### Story 8.3: Questionnaire Form UI (Client-Facing)

As a client,
I want to fill out a questionnaire form with different question types,
So that my consulting firm has the information they need for all services.

**Acceptance Criteria:**
**Given** I open a questionnaire link
**When** the form loads
**Then** I see all questions grouped by category, with the correct input type for each (text input, textarea, file upload, select, multi-select, date picker).
**Given** I fill in some answers and close the browser
**When** I return to the link later
**Then** my previous answers are still there (partial save).

**Technical Notes:**
- Create `app/(public)/questionnaire/[questionnaireId]/page.tsx` (public route, no auth required)
- Render questions from the questionnaire's `responses` array
- Input types based on questionId suffix or metadata in questionnaireConfig
- Auto-save on blur or every 30 seconds via `updateResponses` mutation
- "Enviar Cuestionario" button marks status as "completed" and sets `completedAt`
- Progress indicator showing X of Y questions answered

**Files to create/modify:**
- `app/(public)/questionnaire/[questionnaireId]/page.tsx`
- `components/questionnaires/QuestionnaireForm.tsx`
- `components/questionnaires/QuestionField.tsx` (polymorphic field renderer)
- `convex/functions/questionnaires/mutations.ts` (add updateResponses)

---

### Story 8.4: Questionnaire Management UI (Ejecutivo)

As an Ejecutivo,
I want to manage questionnaires from the projection detail page,
So that I can generate, send, and monitor questionnaire completion.

**Acceptance Criteria:**
**Given** I am viewing a projection detail page
**When** no questionnaire exists
**Then** I see a "Generar Cuestionario" button.
**Given** a questionnaire is in "draft" status
**When** I click "Enviar al Cliente"
**Then** the status changes to "sent" and a shareable link is displayed (copy to clipboard).
**Given** the questionnaire is "completed"
**Then** I see a green badge and a "Ver Respuestas" button.

**Technical Notes:**
- Add questionnaire section to projection detail page
- Link to questionnaire management: `/clients/[clientId]/projections/[projectionId]/questionnaire`
- Create `app/(dashboard)/clients/[clientId]/projections/[projectionId]/questionnaire/page.tsx`
- Display questionnaire status, creation date, completion date
- "Generar" calls create mutation from Story 8.1
- "Enviar" calls updateStatus to "sent" and generates a public link
- Public link format: `/questionnaire/[questionnaireId]`

**Files to create/modify:**
- `app/(dashboard)/clients/[clientId]/projections/[projectionId]/questionnaire/page.tsx`
- `components/questionnaires/QuestionnaireManager.tsx`

---

### Story 8.5: Ejecutivo Response Review & Edit

As an Ejecutivo,
I want to review client-submitted questionnaire responses and edit them if needed,
So that I can correct errors or supplement information before document generation.

**Acceptance Criteria:**
**Given** a questionnaire is in "completed" status
**When** I click "Ver Respuestas"
**Then** I see all questions with the client's answers, and I can edit any answer. Each answer shows which services it maps to (serviceNames badges).

**Technical Notes:**
- Create `components/questionnaires/ResponseReview.tsx`
- Display all responses with question text, answer (editable input), and service mapping badges
- Save edits via `updateResponses` mutation
- Highlight answers that are empty or flagged as incomplete
- Notification section: in MVP, notification is manual (ejecutivo sees "completed" badge); email notification is Phase 5

**Files to create/modify:**
- `components/questionnaires/ResponseReview.tsx`
- `app/(dashboard)/clients/[clientId]/projections/[projectionId]/questionnaire/page.tsx` (integrate review)

---

### Story 8.6: Admin Questionnaire Template Configuration

As an Admin,
I want to customize which questions are asked for each service,
So that my firm's questionnaires collect the specific information we need.

**Acceptance Criteria:**
**Given** I navigate to service template configuration
**When** I select the "Marketing" service
**Then** I see the list of questions defined for Marketing, and I can add new questions, edit existing ones, reorder them, and mark questions as shared with other services.

**Technical Notes:**
- For MVP, questionnaire templates are stored in `convex/lib/questionnaireConfig.ts` as a static configuration
- Create a simple Admin UI at `app/(dashboard)/services/[serviceName]/questions/page.tsx` or a modal from the services page
- Questions are defined as: `{ questionId, questionText, type, required, services[] }`
- In MVP, changes to the config require a code change; the UI serves as a preview/documentation
- Future enhancement: store templates in a database table for dynamic editing

**Files to create/modify:**
- `convex/lib/questionnaireConfig.ts` (comprehensive question definitions)
- `components/questionnaires/TemplateEditor.tsx` (preview/documentation UI)

---

## Epic 9: Quotation & Contract Generation

**Goal:** Build automated quotation and contract generation from projection data, with lifecycle tracking, content editing, and PDF generation.

**Dependencies:** Epic 3 (projections), Epic 4 (projection services), Epic 8 (questionnaire).

### Story 9.1: Quotation Generation Mutation

As a developer,
I want a mutation that generates a quotation for a projection service,
So that quotations are created automatically when a service is activated.

**Acceptance Criteria:**
**Given** a projectionService with `isActive: true`
**When** I call the create quotation mutation
**Then** a quotation record is created with: orgId, projServiceId, clientId, serviceName, generated content (service scope, monthly amounts, total annual amount, terms), status "draft", and createdAt.

**Technical Notes:**
- Implement `convex/functions/quotations/mutations.ts`: create
- Content generation: for MVP, use a template-based approach (not AI) with placeholders filled from projection data
- Template includes: service name, scope description, 12-month payment schedule, annual total, standard terms
- Content stored as markdown string
- Quotation is created per projectionService (not per projection)

**Files to create/modify:**
- `convex/functions/quotations/mutations.ts`
- `convex/lib/quotationTemplates.ts` (template strings with placeholders)

---

### Story 9.2: Quotation Lifecycle Management

As an Ejecutivo,
I want to advance a quotation through its lifecycle (draft -> sent -> approved/rejected) and edit content,
So that I can manage the commercial process for each service.

**Acceptance Criteria:**
**Given** a quotation in "draft" status
**When** I click "Editar Contenido" and modify the quotation text
**Then** the content is updated in the database.
**Given** I click "Enviar al Cliente"
**When** the quotation is in "draft" status
**Then** the status changes to "sent".
**Given** the quotation is "sent"
**When** I click "Marcar como Aprobada"
**Then** the status changes to "approved".

**Technical Notes:**
- Add `updateContent` and `updateStatus` mutations to `convex/functions/quotations/mutations.ts`
- Valid status transitions: draft -> sent -> approved | rejected
- Implement `convex/functions/quotations/queries.ts`: getByProjService, listByClient
- getByProjService uses `by_projServiceId` index
- listByClient uses `by_clientId` index

**Files to create/modify:**
- `convex/functions/quotations/mutations.ts` (add updateContent, updateStatus)
- `convex/functions/quotations/queries.ts`

---

### Story 9.3: Contract Generation from Approved Quotation

As a developer,
I want a mutation that generates a contract when a quotation is approved,
So that the document cycle progresses automatically.

**Acceptance Criteria:**
**Given** a quotation with `status: "approved"`
**When** the contract generation is triggered
**Then** a contract record is created with: orgId, quotationId, projServiceId, clientId, serviceName, generated content (legal terms, service scope, payment schedule from quotation, signature blocks), status "draft", and createdAt.

**Technical Notes:**
- Implement `convex/functions/contracts/mutations.ts`: create
- Content generation: template-based with placeholders from quotation + client data
- Template includes: legal header, parties (org name + client name), service scope, payment terms, cancellation clause, signature blocks
- Trigger: call from the quotation updateStatus mutation when transitioning to "approved"
- Or: manual trigger from the UI ("Generar Contrato" button appears when quotation is approved)

**Files to create/modify:**
- `convex/functions/contracts/mutations.ts`
- `convex/lib/contractTemplates.ts` (template strings with placeholders)

---

### Story 9.4: Contract Lifecycle Management

As an Ejecutivo,
I want to advance a contract through its lifecycle (draft -> sent -> signed/cancelled),
So that I can track the signing process.

**Acceptance Criteria:**
**Given** a contract in "draft" status
**When** I click "Enviar al Cliente"
**Then** the status changes to "sent".
**Given** the contract is "sent"
**When** I click "Marcar como Firmado"
**Then** the status changes to "signed" and `signedAt` is set to the current timestamp.

**Technical Notes:**
- Add `updateContent` and `updateStatus` mutations to `convex/functions/contracts/mutations.ts`
- Valid transitions: draft -> sent -> signed | cancelled
- Implement `convex/functions/contracts/queries.ts`: getByQuotation, listByClient
- getByQuotation uses `by_quotationId` index

**Files to create/modify:**
- `convex/functions/contracts/mutations.ts` (add updateContent, updateStatus)
- `convex/functions/contracts/queries.ts`

---

### Story 9.5: PDF Generation for Quotations & Contracts

As an Ejecutivo,
I want to generate branded PDFs for quotations and contracts,
So that I can share professional documents with clients.

**Acceptance Criteria:**
**Given** a quotation or contract with content
**When** I click "Generar PDF"
**Then** a branded PDF is generated with organization name in the header, the document content, and a footer with page numbers and date. The PDF is stored in Convex Storage and the storageId is saved on the record.
**Given** a PDF has been generated
**When** I click "Descargar PDF"
**Then** the PDF downloads with the filename format: `{ClientName}_{ServiceName}_{DocumentType}_{Year}.pdf`.

**Technical Notes:**
- Create `convex/functions/quotations/actions.ts`: generatePdf action
- Create `convex/functions/contracts/actions.ts`: generatePdf action
- Use `@react-pdf/renderer` to render PDF from content string
- PDF components: header (org name, date), body (content parsed from markdown), footer (page number, confidentiality)
- Upload to Convex Storage via `ctx.storage.store(blob)`
- Save storageId to the quotation/contract record via internal mutation
- Download: generate URL via query that calls `ctx.storage.getUrl(storageId)`

**Files to create/modify:**
- `convex/functions/quotations/actions.ts`
- `convex/functions/contracts/actions.ts`
- `convex/lib/pdfTemplates.tsx` (shared react-pdf components)

---

### Story 9.6: Document Cycle Tracking UI

As an Ejecutivo,
I want a unified view showing the document cycle per service (Projection -> Quotation -> Contract -> Deliverable),
So that I can see the complete status pipeline at a glance.

**Acceptance Criteria:**
**Given** I am viewing a client's projection
**When** I click on a service row or open the "Documentos" tab
**Then** I see a pipeline visualization for each active service showing: Projection (always complete), Quotation (status badge + actions), Contract (status badge + actions), Deliverable (status badge, grayed out for MVP since Phase 4 is blocked).

**Technical Notes:**
- Create `components/documents/DocumentCycleTracker.tsx`
- Pipeline displayed as a horizontal stepper per service: 4 steps with status badges
- Each step is clickable to expand: shows content preview, PDF download link, and status action buttons
- Quotation + Contract actions reuse components from Stories 9.2 and 9.4
- Deliverable step shows "Pendiente - Requiere templates" for MVP
- Create a "Documentos" tab on the projection detail page

**Files to create/modify:**
- `components/documents/DocumentCycleTracker.tsx`
- `components/documents/DocumentStepCard.tsx`
- `app/(dashboard)/clients/[clientId]/projections/[projectionId]/page.tsx` (add documents tab)

---

### Story 9.7: Quotation & Contract List Views

As an Ejecutivo,
I want to see all quotations and contracts for a client in one place,
So that I can manage all commercial documents without navigating to each projection individually.

**Acceptance Criteria:**
**Given** I am on a client's detail page
**When** I click the "Documentos" tab
**Then** I see two tables: one for all quotations (service, amount, status, date, PDF link) and one for all contracts (service, quotation reference, status, signed date, PDF link), sorted by creation date.

**Technical Notes:**
- Use `listByClient` queries from Stories 9.2 and 9.4
- Create `components/documents/QuotationList.tsx` and `components/documents/ContractList.tsx`
- Table columns: Servicio, Monto Anual, Estatus (badge), Fecha, PDF (download link or "Sin PDF")
- Integrate into the client detail page's "Documentos" tab from Story 2.7

**Files to create/modify:**
- `components/documents/QuotationList.tsx`
- `components/documents/ContractList.tsx`
- `app/(dashboard)/clients/[clientId]/page.tsx` (populate documents tab)

---

## Summary

| Epic | Stories | Estimated Hours |
|------|---------|-----------------|
| Epic 1: Project Setup & Multi-Tenant Foundation | 7 stories | 14-24 hrs |
| Epic 2: Client Management | 7 stories | 14-24 hrs |
| Epic 3: Projection Engine Core | 6 stories | 14-22 hrs |
| Epic 4: Service Matrix & Configuration | 7 stories | 16-26 hrs |
| Epic 5: Seasonality & Monthly Calculations | 5 stories | 10-18 hrs |
| Epic 6: Billing & Invoicing View | 5 stories | 10-16 hrs |
| Epic 7: Dashboard | 6 stories | 14-22 hrs |
| Epic 8: Unified Questionnaire | 6 stories | 14-22 hrs |
| Epic 9: Quotation & Contract Generation | 7 stories | 16-26 hrs |
| **Total** | **56 stories** | **122-200 hrs** |

**Recommended implementation order:** Epic 1 -> Epic 2 -> Epic 3 -> Epic 4 + Epic 5 (parallel) -> Epic 6 -> Epic 7 -> Epic 8 -> Epic 9

Epics 4 and 5 can be worked in parallel since they share the projection engine dependency but address different UI concerns. Epic 7 (Dashboard) requires data from Epics 3-6 to be meaningful, so it should come after the core projection and billing features. Epics 8 and 9 (Questionnaire and Documents) can also be parallelized since they depend on projections but not on each other.
