# Implementation Readiness Report - Projex

**Date:** 2026-03-25
**Status:** READY (with conditions)

## Summary

The three planning artifacts (PRD, Architecture, Epics) are well-aligned and thorough. The MVP scope (Phases 1-3) is properly defined with 56 stories across 9 epics. There are a few minor gaps -- most notably missing FR coverage for Module 6 (Deliverable Generator) and PA-04 through PA-09, and some schema field naming inconsistencies between the PRD and architecture -- but none are blockers since those features are explicitly out of MVP scope. A developer can begin implementation immediately starting with Epic 1.

## Checklist Results

### 1. PRD <-> Architecture Alignment
**Status:** PASS

**Details:** The architecture addresses all functional requirements in the PRD that fall within MVP scope:

- **Client Management (CM-01 to CM-09):** Fully covered. The `clients` table schema, CRUD mutations, role-based filtering, and multi-tenant isolation are all specified.
- **Projection Engine (PE-01 to PE-19):** Fully covered. The architecture provides the complete 7-step algorithm implementation in `convex/lib/projectionEngine.ts`, type definitions, mutation orchestration, and schema for projections/projectionServices/monthlyAssignments.
- **Service Matrix (SM-01 to SM-08):** Covered via the matrix grid architecture, cell detail panels, and dashboard queries.
- **Unified Questionnaire (UQ-01 to UQ-10):** Covered. Schema for `questionnaireResponses`, deduplication logic, and public route architecture are defined.
- **Quotation & Contract (QC-01 to QC-10):** Covered. Schema for `quotations` and `contracts`, lifecycle management, PDF generation via react-pdf, and Convex Storage are all specified.
- **Dashboard (DA-01 to DA-08):** Covered. Dashboard queries, Recharts components, and role-based filtering are defined.
- **Platform Admin (PA-01 to PA-03):** Covered for MVP subset. PA-04 through PA-09 are post-MVP per the PRD's Phase 6.
- **Deliverable Generator (DG-01 to DG-14):** Covered in architecture Section 7 (AI Integration Architecture) with dual-agent design, retry logic, cost estimation, and PDF generation flow. Correctly scoped as post-MVP (blocked by templates).

**Minor issue:** The PRD's domain model (Section 5.1) uses snake_case for field names (`annual_revenue`, `billing_frequency`, `client_id`, `created_at`, etc.), while the architecture schema uses camelCase (`annualRevenue`, `billingFrequency`, `clientId`, `createdAt`). The architecture's camelCase convention is correct for TypeScript/Convex and should be considered the source of truth. The PRD also omits several fields that the architecture adds (e.g., `isArchived` and `assignedTo` on clients, `orgId` on most tables, denormalized fields on child tables). The architecture is the more complete and correct specification.

### 2. Architecture <-> Epics Alignment
**Status:** PASS

**Details:** Every architectural component within MVP scope has corresponding stories:

| Architecture Component | Epic/Story Coverage |
|------------------------|-------------------|
| Convex schema (10 tables) | Story 1.2 |
| Clerk + Convex auth | Story 1.3 |
| Auth middleware (requireAuth, requireRole, requireSuperAdmin) | Story 1.4 |
| Service seed data | Story 1.5 |
| Organization CRUD | Story 1.6 |
| Client CRUD + queries | Stories 2.1-2.7 |
| Projection engine (pure function library) | Story 3.1 |
| Projection engine unit tests | Story 3.2 |
| Projection create/recalculate mutations | Stories 3.3, 3.5 |
| Projection queries | Story 3.4 |
| Service queries (listGlobal, listByOrg) | Story 4.1 |
| Service configuration UI | Story 4.2 |
| Projection services + monthly assignment queries | Story 4.4 |
| Matrix grid view | Story 4.5 |
| Monthly sales input + seasonality | Stories 5.1, 5.2 |
| Invoice status management | Stories 6.1, 6.3, 6.4 |
| Dashboard queries + charts | Stories 7.1-7.6 |
| Questionnaire generation + form | Stories 8.1-8.6 |
| Quotation/contract generation + PDF | Stories 9.1-9.7 |
| Frontend App Router structure | Story 1.7, and all UI stories |
| Convex cron jobs | Not in MVP scope (Phase 5), correctly excluded |
| Resend email integration | Not in MVP scope (Phase 5), correctly excluded |
| AI integration (Claude API) | Not in MVP scope (Phase 4), correctly excluded |

**No orphaned architecture decisions.** All ADRs (1-10) describe decisions that are implemented across the stories. ADR-5 (Dual-Agent AI) and ADR-7 (react-pdf for deliverables) relate to post-MVP features but ADR-7 is partially exercised in Epic 9 (PDF generation for quotations/contracts).

### 3. PRD <-> Epics Coverage
**Status:** PASS (with documented exclusions)

**FR Coverage Map validation:** The epics doc provides an explicit FR Coverage Map (lines 129-199) mapping all MVP functional requirements to stories. I verified each mapping:

- **CM-01 through CM-09:** All 9 requirements mapped. Correct.
- **PE-01 through PE-19:** All 19 requirements mapped. Correct.
- **SM-01 through SM-08:** All 8 requirements mapped. Correct.
- **UQ-01 through UQ-10:** All 10 requirements mapped. Correct.
- **QC-01 through QC-10:** All 10 requirements mapped. Correct.
- **DA-01 through DA-08:** All 8 requirements mapped. Correct.
- **PA-01 through PA-03:** All 3 MVP requirements mapped. Correct.

**Intentional exclusions (properly documented):**

| PRD Requirement | Reason for Exclusion |
|----------------|---------------------|
| DG-01 through DG-14 (Deliverable Generator, Module 6) | Phase 4, blocked by template completion. Explicitly stated in epics overview: "Phase 4 (AI Deliverables), Phase 5 (Automation), and Phase 6 (Platform SaaS) are excluded." |
| PA-04 through PA-09 (Platform Admin, extended) | Phase 6, out of MVP scope. PA-04 and PA-05 are marked "Must" in the PRD, which creates a minor tension -- but the PRD's own Phase 6 definition defers these. |

**Potential gap:** PA-04 ("View organization details") and PA-05 ("Manage subscription plans manually") are marked as "Must" priority in the PRD but are not covered by any story. The epics only cover PA-01 through PA-03 via Story 1.6. The PRD itself places these in Phase 6 (post-MVP), which contradicts the "Must" priority. Recommendation: either add stories for PA-04/PA-05 to Epic 1, or explicitly downgrade their priority in the PRD to "Should" for MVP.

### 4. Story Quality
**Status:** PASS

**Acceptance criteria:** All 56 stories have explicit Given/When/Then acceptance criteria. They are specific and testable.

**Story sizing:** All stories target 1-4 hours as stated. The epic summary table confirms: 122-200 total hours across 56 stories, averaging 2.2-3.6 hours per story. This is within the target range.

**File references:** Every story lists specific files to create or modify. Examples:
- Story 1.2 references `convex/schema.ts`
- Story 3.1 references `convex/lib/projectionEngine.ts`
- Story 4.5 references `app/(dashboard)/clients/[clientId]/projections/[projectionId]/page.tsx` and `components/projections/ProjectionMatrix.tsx`

**Technical notes:** All stories include implementation guidance referencing specific architecture sections, Convex patterns, and component library choices (shadcn/ui, Recharts, React Hook Form + Zod).

### 5. Dependency Order
**Status:** PASS

**Recommended order:** Epic 1 -> Epic 2 -> Epic 3 -> Epic 4 + Epic 5 (parallel) -> Epic 6 -> Epic 7 -> Epic 8 -> Epic 9

Validation:
- **Epic 1 (Foundation)** has no dependencies. Schema, auth, seed, and layout come first. Correct.
- **Epic 2 (Clients)** depends on Epic 1 (schema, auth, layout). Correct.
- **Epic 3 (Projection Engine)** depends on Epic 1 (schema, auth) and Epic 2 (client CRUD). Correct.
- **Epic 4 (Service Matrix)** depends on Epic 1 (services seed) and Epic 3 (projection engine). Correct.
- **Epic 5 (Seasonality)** depends on Epic 3 (projection engine) and Epic 4 (matrix view). Correct.
- **Epic 6 (Billing)** depends on Epic 4 (monthly assignments) and Epic 5 (matrix). Correct.
- **Epic 7 (Dashboard)** depends on Epics 3, 4, 6. Correct -- needs projection/billing data.
- **Epic 8 (Questionnaire)** depends on Epic 3 (projections) and Epic 4 (projection services). Correct.
- **Epic 9 (Quotation/Contract)** depends on Epics 3, 4, 8. Correct.

**Within-epic ordering** is also correct: backend stories precede frontend stories in every epic (e.g., Story 2.1 creates mutations before Story 2.3 builds the form UI).

**One note:** Epics 8 and 9 are listed sequentially but the doc states they "can also be parallelized since they depend on projections but not on each other." This is correct -- Epic 9's only dependency on Epic 8 is Story 9.6 (Document Cycle Tracker), which shows questionnaire status. This is a display-only dependency and could use a stub.

### 6. Schema Consistency
**Status:** PASS

**Architecture schema vs. story references:**

The architecture provides the complete `convex/schema.ts` definition (Section 2.1) with all 10 tables. Stories reference these tables consistently:

- Story 1.2 explicitly states: "all 10 tables (organizations, clients, projections, services, projectionServices, monthlyAssignments, questionnaireResponses, quotations, contracts, deliverables) are created with all fields, validators, and indexes matching the architecture doc."
- Story 3.3 references projections, projectionServices, monthlyAssignments with fields matching the schema.
- Story 8.1 references questionnaireResponses with the correct response structure (`questionId`, `questionText`, `answer`, `serviceNames`).
- Story 9.1 references quotations with correct fields (orgId, projServiceId, clientId, serviceName, content, status).

**PRD vs. Architecture schema discrepancies (non-blocking):**

| PRD Field | Architecture Field | Status |
|-----------|-------------------|--------|
| `clients.annual_revenue` | `clients.annualRevenue` | Naming convention difference. Architecture is correct for Convex. |
| `clients.billing_frequency` | `clients.billingFrequency` | Same. |
| `clients.created_at` | `clients.createdAt` | Same. |
| `projections.client_id` | `projections.clientId` | Same. |
| PRD clients table has no `isArchived` | Architecture adds `isArchived: v.boolean()` | Architecture is more complete. |
| PRD clients table has no `assignedTo` | Architecture adds `assignedTo: v.optional(v.string())` | Architecture is more complete. |
| PRD services table has no `orgId` | Architecture adds `orgId: v.optional(v.string())` | Architecture supports org overrides. |
| PRD services table has no `isDefault`, `sortOrder` | Architecture adds both | Architecture is more complete. |
| PRD projection_services has no `orgId`, `serviceName`, `normalizedWeight` | Architecture adds all three | Denormalization strategy per ADR-10. |
| PRD monthly_assignments has no `orgId`, `projectionId`, `clientId`, `serviceName`, `year` | Architecture adds all five | Denormalization for query performance. |
| PRD questionnaire_responses has no `orgId` | Architecture adds `orgId` | Required for multi-tenant isolation. |

**Verdict:** The architecture schema is a superset of the PRD domain model, adding necessary fields for multi-tenant isolation, denormalization, and operational needs. The stories reference the architecture schema, not the PRD. This is the correct approach -- the architecture is the implementation specification. No mismatches between architecture and stories.

### 7. Tech Stack Consistency
**Status:** PASS

The tech stack is consistent across all three documents:

| Technology | PRD | Architecture | Epics |
|-----------|-----|-------------|-------|
| Next.js 15 | Section 11 (Phase 1) | Section 1.1, 1.3 | Story 1.1 |
| React 19 | Not explicit | Section 1.1 diagram | Implied |
| Convex (backend) | Section 11 (Phase 1) | Section 1.1, 2.1 | Story 1.1, 1.2 |
| Clerk (auth + orgs) | Section 2.2, 8.4 | Section 1.1, 4.1-4.4 | Story 1.3 |
| Tailwind CSS | Section 11 (Phase 1) | Section 1.1 diagram | Story 1.1 |
| shadcn/ui | Section 11 (Phase 1) | Section 1.1 diagram | Story 1.1, throughout UI stories |
| Recharts | PRD Section 6.7 (DA-01) | Section 1.1 diagram | Story 5.2, 7.2, 7.3 |
| react-pdf | PRD Section 6.6 (DG-07) | Section 8.2, ADR-7 | Story 9.5 |
| Claude API (Sonnet) | PRD Section 4.3 (Phase E) | Section 7.1-7.6 | Post-MVP, correctly excluded |
| Resend (email) | PRD Section 9 (Out of scope for MVP) | Section 10.1 | Post-MVP, correctly excluded |
| React Hook Form + Zod | Not in PRD | Section 9.3 | Story 1.1 (install), Story 2.3 (usage) |
| Vitest | Not in PRD | Not explicit | Story 3.2 mentions "Vitest or built-in Node test runner" |

**No inconsistencies found.** The architecture and epics add implementation-level detail (React Hook Form, Zod, Vitest) that the PRD does not specify, which is appropriate.

### 8. Multi-Tenant Consistency
**Status:** PASS

**orgId filtering is mentioned in all relevant places:**

- **PRD:** Section 5.1 states "All tables carry an `orgId` field for multi-tenant isolation (except `organizations` itself)." Section 5.3 Key Business Rule #1 states "Every query must filter by `orgId`."
- **Architecture:** Section 5 dedicates an entire section to multi-tenant isolation. Section 5.2 provides correct and incorrect code patterns. The schema has `orgId` on all 9 tenant-scoped tables. Auth middleware extracts `orgId` from JWT.
- **Epics:** Story 1.4 implements auth middleware with `orgId` extraction. Story 2.1 explicitly states "a client record is created with `orgId` from my auth context." Story 2.2 implements role-based filtering within org scope. Story 1.2 states all tables except `organizations` must include `orgId: v.string()`.

**Every mutation example** in the architecture stamps `orgId` from auth context. **Every query example** filters by `orgId` as the first index predicate. **The anti-pattern** (accepting `orgId` from client args) is explicitly documented as wrong in architecture Section 5.2.

### 9. Blockers Identified
**Status:** PASS

**Template blocker is properly scoped:**

- **PRD Section 8.3:** Explicitly identifies "Templates in progress" as a constraint. States "Phases 1-3 can proceed independently; Phase 4 (Deliverable Generator) is blocked until templates are ready."
- **PRD Section 10.1:** Lists template blocker as the #1 high-priority risk.
- **PRD Section 11:** Phases 1-3 are MVP. Phase 4 (Deliverable Generator) is post-MVP and blocked by templates.
- **Epics overview:** "Phase 4 (AI Deliverables), Phase 5 (Automation), and Phase 6 (Platform SaaS) are excluded as they are blocked by template completion or out of MVP scope."
- **Story 9.6:** Deliverable step in the Document Cycle Tracker shows "Pendiente - Requiere templates" for MVP.

The template blocker does not affect any of the 56 MVP stories. All blocked functionality (DG-01 through DG-14, cron jobs, email notifications, full platform admin) is correctly deferred to post-MVP phases.

### 10. Missing Pieces
**Status:** PASS (minor items only)

**Nothing blocks a developer from starting implementation.** The following are minor items that should be addressed early but do not prevent starting:

1. **Clerk application setup:** Stories 1.3 references Clerk configuration (publishable key, secret key, organization roles) but the actual Clerk dashboard setup is manual. A developer will need a Clerk account and project created. This is a setup task, not a gap in planning.

2. **Environment variables documentation:** Story 1.3 mentions `.env.local` with required variables. A `.env.example` file should be created. This is minor and can be done during Story 1.1.

3. **Test framework decision:** Story 3.2 says "Vitest or built-in Node test runner" without committing. Recommend deciding on Vitest upfront and adding it to Story 1.1 dependencies.

4. **Questionnaire config data:** Story 8.1 references `convex/lib/questionnaireConfig.ts` for static question definitions per service, but the actual question content is not specified anywhere. The PRD provides service-specific input requirements (Section 6.4 table) but not individual questions. The developer will need to author these. This is expected for MVP (static config) and not a blocker.

5. **Quotation/contract template content:** Stories 9.1 and 9.3 reference `convex/lib/quotationTemplates.ts` and `convex/lib/contractTemplates.ts` for template strings with placeholders. The actual template text is not provided. A developer will need to author these, ideally with input from the business owner. Not a blocker for starting development.

6. **Super Admin UI pages:** Story 1.7 creates `app/(platform)/layout.tsx` as a stub. Story 1.6 covers organization CRUD backend. But there is no story for the Super Admin UI pages themselves (organization list page, create org form). The backend is covered; the frontend for Super Admin is only a layout stub. For MVP this may be acceptable if org management is done via Convex dashboard directly.

7. **Epics summary says 56 stories but overview says 52:** The epics doc overview states "52 stories" (line 10) but the actual count is 56 (7+7+6+7+5+5+6+6+7 = 56) and the summary table at the bottom also says 56. The "52" in the overview is a typo.

## Gaps Found

| # | Gap | Severity | Recommendation |
|---|-----|----------|---------------|
| 1 | PA-04, PA-05 marked "Must" in PRD but excluded from epics | Low | Either add 1-2 stories to Epic 1 for basic org detail view and plan management, or downgrade these to "Should" in the PRD since they are deferred to Phase 6. |
| 2 | PRD domain model uses snake_case, architecture uses camelCase | Informational | No action needed. Architecture is the source of truth for implementation. |
| 3 | Epics overview says "52 stories" but actual count is 56 | Trivial | Fix the typo in the epics doc overview. |
| 4 | No Super Admin frontend stories (only backend + layout stub) | Low | Add a story for a minimal Super Admin org list page in Epic 1, or document that org management is done via Convex dashboard for MVP. |
| 5 | Test framework not decided (Vitest vs. Node test runner) | Low | Decide on Vitest in Story 1.1 setup. |

## Recommendation

**Go.** The planning artifacts are comprehensive, well-aligned, and provide sufficient detail for a developer to begin implementation immediately. The identified gaps are all minor and can be addressed during the first sprint without blocking work. The MVP scope is clean, the template blocker is properly isolated from Phases 1-3, and the dependency ordering is correct.

**Conditions for optimal execution:**
1. Fix the "52 stories" typo to "56 stories" in the epics overview.
2. Resolve the PA-04/PA-05 priority tension before Phase 6 planning.
3. Commit to Vitest as the test framework during Story 1.1.
4. Ensure Clerk account and Convex project are provisioned before starting Story 1.1.
