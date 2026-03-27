---
stepsCompleted: [01,02,02b,02c,03,04,05,06,07,08,09,10,11,12]
inputDocuments: [project-overview.md, scope-presentation.html]
workflowType: 'prd'
---

# Product Requirements Document - DESC

**Deliverable Engine for Service Control**

**Author:** Christian
**Date:** 2026-03-27
**Version:** 1.0
**Status:** Draft

---

## 1. Executive Summary

DESC (Deliverable Engine for Service Control) is a multi-tenant SaaS platform that automates the complete lifecycle of professional deliverable generation for multidisciplinary consulting firms. The platform replaces manual Excel-based financial projections and ad-hoc document creation with an integrated system that handles budget distribution, commercial documentation, and AI-powered deliverable generation.

The system serves consulting firms ("organizations") who manage multiple clients across up to 9 service areas (Legal, Contable, TI, Marketing, RH, Admin, Comisiones, Logistica, Construccion). For each client, DESC distributes an annual budget across active services using market benchmarks and seasonality factors, then generates a sequential document cycle per service: Projection, Quotation, Contract, and Deliverable (short + long versions).

The end goal is zero human intervention from the moment a client contracts a service to the moment they receive their deliverable in the cloud.

**Key numbers:**
- 9 service areas (6 base + 3 wildcard)
- 4 document types per service per cycle
- 3 template components per service (questionnaire, short deliverable, long deliverable)
- 8 system modules
- 10 database tables
- 4 user roles across platform and organization levels

---

## 2. Vision and Purpose

### 2.1 Problem Statement

Consulting firms currently operate with a highly manual, inconsistent process:

1. **Excel-based projections** -- A spreadsheet distributes the annual financial projection for each client across services. This is error-prone, not scalable, and locked to one person's workstation.
2. **Manual monthly execution** -- Each month, someone must review which services are due, request information from the client, manually generate the deliverable, and deliver it.
3. **Quality inconsistency** -- Deliverable quality depends entirely on who creates it and how much time they spend. There is no standardization.
4. **No traceability** -- There is no centralized tracking of document status, payment status, or deliverable history across clients and services.

### 2.2 Target Audience

**Primary users (within each organization):**

| Role | Description |
|------|-------------|
| **Admin (Organization)** | Firm administrator who configures services, benchmarks, templates, and manages the team |
| **Ejecutivo de Cuenta** | Account executive who manages assigned clients, creates projections, processes invoices, and monitors deliverables |
| **Viewer** | Read-only access to dashboards, reports, and document status |

**Platform-level user:**

| Role | Description |
|------|-------------|
| **Super Admin (Platform)** | Manages the entire platform -- all organizations, subscriptions, global metrics, and default service configurations |

### 2.3 Value Proposition

- **For consulting firms:** Standardized, agency-quality deliverables generated automatically with zero manual work per cycle. Consistent branding, reliable scheduling, and full traceability.
- **For account executives:** Eliminate repetitive document creation. Focus on client relationships instead of spreadsheet management and Word formatting.
- **For firm administrators:** Real-time visibility into financial projections, service delivery status, and team performance across all clients.
- **For the platform operator:** Recurring SaaS revenue from multiple consulting firms with low marginal cost per additional tenant.

---

## 3. Success Metrics and KPIs

### 3.1 MVP Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to generate a projection | < 2 minutes | From client data entry to full matrix |
| Projection accuracy vs. Excel | 100% match | Regression tests against known Excel outputs |
| Client onboarding time | < 15 minutes | From "new client" to complete projection |
| Questionnaire completion rate | > 80% | % of clients who complete the unified form |
| Quotation + contract generation time | < 30 seconds | From trigger to PDF available |

### 3.2 Post-MVP Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Deliverable generation time | < 5 minutes | From payment confirmation to PDF in storage |
| AI audit pass rate (first attempt) | > 85% | % of deliverables passing auditor agent on first try |
| Monthly active organizations | 5+ in first 6 months | Unique orgs with at least 1 projection created |
| Average clients per organization | 10+ | Median across active organizations |
| Manual intervention rate | < 5% | % of deliverables requiring human editing post-generation |
| API cost per deliverable | < $0.05 USD | Claude API costs per complete deliverable cycle |
| Platform uptime | 99.5% | Monthly availability |

### 3.3 Business KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time saved per deliverable | 4+ hours | Compared to manual process baseline |
| Client retention rate | > 90% | Annual renewal rate at organization level |
| Revenue per organization | Sustainable subscription fee | Covers API + infrastructure costs with margin |

---

## 4. User Journeys

### 4.1 Super Admin -- Platform Management

**Goal:** Onboard a new consulting firm and manage platform-wide settings.

1. Super Admin logs into the platform admin panel.
2. Navigates to "Organizations" and clicks "Create New Organization."
3. Fills in organization name, selects plan (manual billing), and creates the Clerk Organization.
4. The system creates the `organizations` record with `clerkOrgId`, sets status to `active`.
5. Super Admin shares the invitation link with the firm's designated admin.
6. Super Admin can view all organizations, their subscription status, usage metrics, and activate/deactivate accounts.
7. Super Admin can also configure default service benchmarks that new organizations inherit.

### 4.2 Admin (Organization) -- Firm Setup

**Goal:** Configure the firm's services and prepare the platform for the team.

1. Admin receives invitation and creates their account via Clerk.
2. Admin lands on the organization dashboard (empty state).
3. Navigates to "Service Configuration" and reviews the 9 pre-seeded services with default benchmarks.
4. Adjusts benchmark percentages for services relevant to the firm's specialization (e.g., raises Marketing max from 15% to 18%).
5. Navigates to "Templates" and uploads/edits the 3 template components for each active service: questionnaire questions, short deliverable template, long deliverable template.
6. Invites team members (Ejecutivos and Viewers) via Clerk Organizations.
7. Reviews the dashboard, which now shows zero clients and prompts to create the first one.

### 4.3 Ejecutivo de Cuenta -- Full Client Lifecycle

**Goal:** Onboard a client, generate a projection, manage invoicing, and deliver documents.

**Phase A: Client Onboarding**
1. Ejecutivo clicks "New Client."
2. Fills in: company name, RFC, industry, annual revenue, billing frequency (semanal/quincenal/mensual).
3. System saves the client record (scoped to `orgId`).

**Phase B: Financial Projection**
4. Ejecutivo clicks "Create Projection" for the client.
5. Enters: projected annual sales, total budget to contract, commission rate (e.g., 2%).
6. Enters monthly sales estimates for 12 months (used to calculate seasonality FE factors).
7. Reviews the 9 services with benchmarks; toggles active/inactive, adjusts chosen percentages.
8. Clicks "Calculate." The projection engine runs:
   - Computes annual commissions = Annual Sales x Commission Rate
   - Computes remaining budget = Total Budget - Annual Commissions
   - Normalizes weights: for each active service (excluding Comisiones), weight = chosen_pct / sum of all active chosen_pcts
   - Annual allocation per service = Remaining Budget x normalized weight
   - Monthly base = Annual allocation / 12
   - Adjusted monthly amount = Monthly base x FE factor for that month
   - Commissions per month = Monthly Sales x Commission Rate (proportional to revenue)
9. Ejecutivo reviews the Projection Matrix: a 12-month x 9-service grid showing amounts.
10. Adjusts if needed, then saves.

**Phase C: Questionnaire**
11. System generates a unified questionnaire combining questions from all active services.
12. Questions that apply to multiple services appear only once (deduplication).
13. Ejecutivo sends the questionnaire link to the client.
14. Client completes the questionnaire; responses are mapped to the corresponding services.
15. System marks questionnaire as complete.

**Phase D: Commercial Documents**
16. When a service is activated in the projection, the system triggers quotation generation.
17. Quotation is generated with service scope, amounts, and terms.
18. Once the quotation is approved, a contract is generated.
19. Both are available as PDFs.

**Phase E: Invoice Flow (a -> b -> c -> d)**
20. **(a) Client requests invoice** -- Client contacts the ejecutivo. The ejecutivo adjusts the amount based on the projection for the current month/service.
21. **(b) Invoice is generated** -- The system emits the invoice with the service concept and amount.
22. **(c) Client makes payment** -- Payment is confirmed. The next day, funds are allocated.
23. **(d) Deliverable is generated** -- With payment confirmed, the system triggers the AI generation pipeline:
    - **Creator Agent (Claude API)** receives: service template + client data + month context. Generates short version + long version.
    - **Auditor Agent (Claude API)** validates the deliverable against the master file requirements and client-submitted information. If errors found, returns to Creator. If approved, proceeds.
    - PDF generation with corporate branding.
    - Upload to Convex Storage.
    - Mark as "Delivered" in the control matrix.

### 4.4 Viewer -- Dashboard Monitoring

**Goal:** Review the status of clients, projections, and deliverables.

1. Viewer logs in and lands on the dashboard.
2. Views financial summary: total sales vs. total service payments by month.
3. Views the deliverable tracking grid: which services have delivered, pending, or overdue documents.
4. Can download any generated PDF (quotation, contract, deliverable).
5. Cannot modify any data.

---

## 5. Domain Model

### 5.1 Core Entities (10 Tables)

All tables carry an `orgId` field for multi-tenant isolation (except `organizations` itself).

#### 5.1.1 organizations
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| clerkOrgId | string | Clerk organization identifier |
| name | string | Organization display name |
| status | union | "active" / "inactive" / "suspended" |
| plan | union | "basic" / "pro" / "enterprise" |
| createdAt | number (ms) | Unix timestamp of creation |

#### 5.1.2 clients
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| orgId | string | Multi-tenant isolation key |
| name | text | Company name / Razon Social |
| rfc | text | Tax identification number |
| industry | text | Industry classification |
| annual_revenue | number | Annual revenue in MXN |
| billing_frequency | union | "semanal" / "quincenal" / "mensual" |
| created_at | number (ms) | Creation timestamp |

#### 5.1.3 projections
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| client_id | Id (ref) | FK to clients |
| year | int | Projection year |
| total_budget | number | Total budget to contract (MXN) |
| commission_rate | number | Commission percentage (e.g., 0.02) |
| seasonality_data | jsonb | Array of 12 monthly sales + FE factors |

#### 5.1.4 services
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| name | text | Service name (e.g., "Legal", "Marketing") |
| type | union | "base" / "comodin" |
| min_pct | number | Minimum benchmark percentage |
| max_pct | number | Maximum benchmark percentage |
| default_pct | number | Default chosen percentage (avg of min/max) |

#### 5.1.5 projection_services
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| projection_id | Id (ref) | FK to projections |
| service_id | Id (ref) | FK to services |
| chosen_pct | number | Percentage chosen for this projection |
| is_active | boolean | Whether this service is active for the client |
| annual_amount | number | Computed annual allocation for this service |

#### 5.1.6 monthly_assignments
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| proj_service_id | Id (ref) | FK to projection_services |
| month | int (1-12) | Month number |
| amount | number | Adjusted monthly amount (base x FE) |
| fe_factor | number | Seasonality factor for this month |
| status | union | "pending" / "info_received" / "in_progress" / "delivered" |
| invoice_status | union | "not_invoiced" / "invoiced" / "paid" |

#### 5.1.7 questionnaire_responses
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| client_id | Id (ref) | FK to clients |
| projection_id | Id (ref) | FK to projections |
| responses | jsonb | Key-value map of question IDs to answers |
| status | union | "draft" / "sent" / "completed" |
| completed_at | number (ms) | Completion timestamp |

#### 5.1.8 quotations
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| proj_service_id | Id (ref) | FK to projection_services |
| content | text | Generated quotation content |
| pdf_url | text | URL to PDF in Convex Storage |
| status | union | "draft" / "sent" / "approved" / "rejected" |
| created_at | number (ms) | Creation timestamp |

#### 5.1.9 contracts
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| quotation_id | Id (ref) | FK to quotations |
| content | text | Generated contract content |
| pdf_url | text | URL to PDF in Convex Storage |
| status | union | "draft" / "sent" / "signed" / "cancelled" |
| signed_at | number (ms) | Signature timestamp |

#### 5.1.10 deliverables
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Primary key |
| assignment_id | Id (ref) | FK to monthly_assignments |
| template_id | Id (ref) | FK to service templates |
| short_content | text | Generated short version content |
| long_content | text | Generated long version content |
| short_pdf_url | text | URL to short PDF |
| long_pdf_url | text | URL to long PDF |
| audit_status | union | "pending" / "approved" / "rejected" / "corrected" |
| delivered_at | number (ms) | Delivery timestamp |

### 5.2 Entity Relationships

```
organizations (1) ──── (*) clients
clients (1) ──── (*) projections
projections (1) ──── (*) projection_services
services (1) ──── (*) projection_services
projection_services (1) ──── (*) monthly_assignments
projection_services (1) ──── (1) quotations
quotations (1) ──── (1) contracts
monthly_assignments (1) ──── (0..1) deliverables
clients (1) ──── (*) questionnaire_responses
projections (1) ──── (*) questionnaire_responses
```

### 5.3 Key Business Rules

1. **Multi-tenant isolation:** Every query must filter by `orgId`. A user in Organization A must never see data from Organization B.
2. **Service types:** "Base" services have configurable benchmark ranges. "Comodin" services (Comisiones, Logistica, Construccion) have special behavior -- Comisiones is calculated directly from the commission rate, not from benchmarks.
3. **Weight normalization:** When calculating budget distribution, each active service's chosen_pct is divided by the sum of all active services' chosen_pcts to produce a normalized weight. This ensures allocations always sum to the remaining budget.
4. **Commissions are deducted first:** Annual Commissions = Annual Sales x Commission Rate. This amount is subtracted from the total budget before distributing to other services.
5. **Seasonality adjustment:** Monthly amounts are not uniform. They are multiplied by the FE factor (Venta_Mes / Average_Monthly_Sales). High-revenue months get proportionally higher service costs.
6. **Document lifecycle is sequential:** Projection must exist before Quotation. Quotation must be approved before Contract. Contract must be signed before Deliverables can be generated. Payment must be confirmed before deliverable generation triggers.
7. **Billing frequency affects invoice granularity:** Semanal = monthly amount / 4; Quincenal = monthly amount / 2; Mensual = full monthly amount. Comisiones serve as a wildcard to absorb variations from payroll-related adjustments.

---

## 6. Functional Requirements

### 6.1 Module 1: Client Management

**Purpose:** CRUD operations for consulting firm clients, scoped to the organization.

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

### 6.2 Module 2: Projection Engine

**Purpose:** Replicate and improve the existing Excel calculator logic to distribute annual budgets across services and months.

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

**Benchmark Reference Data (9 Services):**

| Service | Type | Min % | Max % | Default % | Notes |
|---------|------|-------|-------|-----------|-------|
| Legal | Base | 1% | 3% | 2% | Actas, Asambleas |
| Contable | Base | 2% | 4% | 3% | Estados Financieros, Balanzas |
| TI | Base | 4% | 7% | 5.5% | Technical requirements |
| Marketing | Base | 10% | 15% | 12.5% | Corporate identity |
| RH | Base | 3% | 5% | 4% | Processes, Org charts, Mission/Vision |
| Admin | Base | 3% | 5% | 4% | Workflow diagrams, objectives |
| Comisiones | Comodin | N/A | N/A | = Commission Rate | Calculated on sales, not benchmarks |
| Logistica | Comodin | 4% | 8% | 6% | Client portfolio, locations |
| Construccion | Comodin | 2% | 5% | 3.5% | Construction works, budgets, plans |

**Projection Engine Algorithm (step by step):**

```
INPUTS:
  annual_sales         = e.g., $50,000,000 MXN
  total_budget         = e.g., $30,000,000 MXN
  commission_rate      = e.g., 0.02 (2%)
  monthly_sales[1..12] = estimated sales per month
  active_services[]    = list of active services with chosen_pct

STEP 1: Compute seasonality
  FOR each month m in 1..12:
    FE[m] = monthly_sales[m] / (annual_sales / 12)
    // FE > 1 = high season, FE < 1 = low season

STEP 2: Compute commissions
  annual_commissions = annual_sales * commission_rate
  // e.g., $50M * 0.02 = $1,000,000

STEP 3: Compute remaining budget
  remaining_budget = total_budget - annual_commissions
  // e.g., $30M - $1M = $29,000,000

STEP 4: Normalize service weights
  sum_active_pcts = SUM(chosen_pct) for all active services EXCLUDING Comisiones
  FOR each active service s (excl. Comisiones):
    normalized_weight[s] = chosen_pct[s] / sum_active_pcts

STEP 5: Annual allocation per service
  FOR each active service s (excl. Comisiones):
    annual_allocation[s] = remaining_budget * normalized_weight[s]

STEP 6: Monthly distribution with seasonality
  FOR each active service s (excl. Comisiones):
    monthly_base[s] = annual_allocation[s] / 12
    FOR each month m in 1..12:
      monthly_amount[s][m] = monthly_base[s] * FE[m]

STEP 7: Commission distribution (proportional to sales)
  FOR each month m in 1..12:
    commission_monthly[m] = monthly_sales[m] * commission_rate

OUTPUT: Projection Matrix [service x month] with amounts
```

### 6.3 Module 3: Service Matrix

**Purpose:** Visual and interactive representation of the projection as a monthly grid, with status tracking for each service/month cell.

| ID | Requirement | Priority |
|----|-------------|----------|
| SM-01 | Display a matrix view: rows = active services, columns = 12 months | Must |
| SM-02 | Each cell shows: assigned amount, document status (4-doc cycle), invoice status | Must |
| SM-03 | Color-code cells by status (not started, in progress, delivered, overdue) | Must |
| SM-04 | Click on a cell to see detail: projection amount, quotation status, contract status, deliverable status | Must |
| SM-05 | Allow Admin/Ejecutivo to activate/deactivate services for specific months | Should |
| SM-06 | Show totals per row (annual per service) and per column (monthly total) | Must |
| SM-07 | Filter matrix by status, service type, or amount range | Should |
| SM-08 | Export matrix to CSV/Excel | Should |

### 6.4 Module 4: Unified Questionnaire

**Purpose:** Single intelligent form that collects client information for all active services, deduplicating shared questions.

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

**Service-specific input requirements:**

| Service | Required Inputs |
|---------|----------------|
| Legal | Actas, Asambleas |
| Contable | Estados Financieros, Balanzas, Estados de cuenta |
| TI | Technical requirements |
| Marketing | Corporate Identity materials |
| RH | Processes, Org chart, Mission, Vision, Objectives, Job profiles, Workflow diagrams |
| Admin | Workflow diagrams, objectives |
| Comisiones | Sales data (from projection) |
| Logistica | Client portfolio, locations |
| Construccion | Construction works, budgets, plans |

### 6.5 Module 5: Quotation & Contract

**Purpose:** Automated generation of commercial documents (quotation and contract) for each active service.

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

### 6.6 Module 6: Deliverable Generator

**Purpose:** AI-powered generation of professional deliverables using Claude API, with a creator-auditor dual-agent architecture.

| ID | Requirement | Priority |
|----|-------------|----------|
| DG-01 | Trigger deliverable generation when payment is confirmed for a monthly assignment | Must |
| DG-02 | Creator Agent receives: service template (short + long), client data, questionnaire responses, month context | Must |
| DG-03 | Generate two versions: short (executive summary) and long (comprehensive document) | Must |
| DG-04 | Auditor Agent validates deliverable against: template requirements, client-submitted information, quality criteria | Must |
| DG-05 | If Auditor rejects, return to Creator with feedback for correction (max 3 retries) | Must |
| DG-06 | If Auditor approves, proceed to PDF generation | Must |
| DG-07 | Generate branded PDFs using react-pdf | Must |
| DG-08 | Upload PDFs to Convex Storage | Must |
| DG-09 | Update deliverable record with URLs, audit status, and delivery timestamp | Must |
| DG-10 | Mark the monthly_assignment status as "delivered" | Must |
| DG-11 | Support template variables/placeholders that are populated with client-specific data | Must |
| DG-12 | Log all AI interactions (prompt, response, token usage) for cost tracking | Should |
| DG-13 | Allow Admin to preview and manually approve deliverables before final delivery | Should |
| DG-14 | Each service requires specialized prompts that make the AI act as a domain expert | Must |

**Deliverable quality standards:**
- Must read as if produced by a professional consulting agency
- Consistent formatting and branding across all services
- Personalized with actual client data, not generic content
- Short version: executive summary with key findings and priority recommendations
- Long version: full analysis with methodology, supporting data, conclusions, and action plan

### 6.7 Module 7: Dashboard

**Purpose:** Financial and operational overview for monitoring projections, payments, and deliverable status.

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

### 6.8 Module 8: Platform Admin

**Purpose:** Super Admin panel for managing all organizations (tenants) on the platform.

| ID | Requirement | Priority |
|----|-------------|----------|
| PA-01 | List all organizations with status, plan, creation date, client count | Must |
| PA-02 | Create a new organization: name, plan, Clerk Organization setup | Must |
| PA-03 | Activate / deactivate / suspend an organization | Must |
| PA-04 | View organization details: users, clients, projections, usage metrics | Must |
| PA-05 | Manage subscription plans manually (no payment gateway) | Must |
| PA-06 | Configure default service benchmarks (inherited by new orgs) | Should |
| PA-07 | View global platform metrics: total orgs, total clients, total deliverables, API costs | Should |
| PA-08 | Impersonate an organization for support/debugging (view as Admin of that org) | Could |
| PA-09 | Landing page / marketing site for the platform | Could |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds for any page |
| Projection calculation | < 3 seconds for full 12x9 matrix |
| Real-time updates | Convex reactive queries update UI within 500ms of data change |
| AI deliverable generation | < 5 minutes end-to-end (creation + audit + PDF) |
| Concurrent users per org | Support 10+ simultaneous users without degradation |

### 7.2 Security

| Requirement | Description |
|-------------|-------------|
| Authentication | Clerk-managed authentication with email + social providers |
| Authorization | Role-based access control (Super Admin, Admin, Ejecutivo, Viewer) enforced at the Convex function level |
| Multi-tenant isolation | Every Convex query/mutation must filter by orgId; no cross-tenant data leakage |
| Data encryption | HTTPS for all traffic; Convex handles at-rest encryption |
| Session management | Clerk JWT tokens with secure expiry |
| API key protection | Claude API keys stored as Convex environment variables, never exposed to client |

### 7.3 Scalability

| Requirement | Description |
|-------------|-------------|
| Tenant scalability | Support 50+ organizations without architectural changes |
| Client scalability | Support 100+ clients per organization |
| Storage scalability | Convex Storage for all PDFs; no external storage dependency |
| API rate management | Queue-based Claude API calls to respect rate limits |

### 7.4 Reliability

| Requirement | Description |
|-------------|-------------|
| Data durability | Convex managed infrastructure with automatic backups |
| Error handling | Graceful error handling for AI generation failures with retry logic |
| Audit trail | Log all state transitions (document status changes, payment confirmations) |

### 7.5 Usability

| Requirement | Description |
|-------------|-------------|
| Responsive design | Optimized for desktop (primary), functional on tablet |
| Language | UI in Spanish (primary market is Mexican consulting firms) |
| Accessibility | Follow basic WCAG 2.1 AA for form inputs and navigation |
| Onboarding | Empty states with clear CTAs guide new users through setup |

---

## 8. Technical Constraints

### 8.1 Convex Limitations

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| No SQL joins | Cannot do complex multi-table queries in a single call | Use Convex relationships and multiple queries; denormalize where necessary |
| Function execution time limit | Convex functions have a max execution duration | For long-running AI generation, use Convex actions (not mutations) which support async external calls |
| Document size limits | Large JSONB fields (questionnaire responses, deliverable content) have size constraints | Chunk large content or store as files in Convex Storage |
| No native cron expressions | Convex cron supports interval-based scheduling | Use Convex's built-in cron API with appropriate intervals for monthly checks |
| TypeScript-first schema | Schema must be defined in TypeScript; no SQL migrations | Use Convex schema definition with validators |

### 8.2 Claude API Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| API cost per call | Each deliverable involves 3+ API calls (creator short, creator long, auditor) | Estimate ~$0.01-0.05 per call; budget $15-40/month for 60 clients |
| Rate limits | Anthropic enforces rate limits on API calls | Implement queue-based processing with backoff |
| Response quality variance | AI output quality can vary between calls | Auditor agent validates; retry up to 3 times; templates constrain output format |
| Context window limits | Very large templates + client data may exceed context | Optimize prompts; use summary techniques for large datasets |
| Model versioning | Claude model updates could change output behavior | Pin to specific model version; test before upgrading |

### 8.3 Template Dependency (BLOCKER)

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Templates in progress | The 3 template components (questionnaire, short, long) for each of the 9 services are being created but not yet finalized | Phases 1-3 can proceed independently; Phase 4 (Deliverable Generator) is blocked until templates are ready |
| Template quality | Template quality directly determines deliverable quality | Iterative refinement with real client data during pilot testing |

### 8.4 Clerk Organizations

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Manual onboarding | New organizations are created by the platform team, not self-service | Build admin panel for efficient org creation; plan for self-service in future |
| Role mapping | Clerk roles must map to application permissions | Define clear role-permission matrix enforced in Convex middleware |

---

## 9. Out of Scope

The following are explicitly NOT included in the current product scope:

| Item | Reason |
|------|--------|
| **Stripe / Payment gateway integration** | Subscriptions are managed manually with direct advisor contact; no automated billing |
| **SAT integration** | Invoice generation references SAT codes but does not connect to Mexico's SAT system for official fiscal invoicing (CFDI) |
| **Client portal** | Clients do not have login access to the platform; they interact via questionnaire links and receive deliverables externally |
| **WhatsApp / SMS notifications** | Initially email-only via Resend; messaging integrations deferred to future phases |
| **Self-service organization onboarding** | New tenants are onboarded manually by the platform team |
| **Mobile app** | Desktop-first web application; responsive but no native mobile app |
| **Multi-language support** | Spanish only for MVP |
| **Advanced analytics / BI** | Basic dashboard only; no predictive analytics or custom report builder |
| **Document e-signature** | Contracts are generated as PDFs but signing is handled externally |
| **Client file upload portal** | Clients submit information via questionnaire; no dedicated file management portal |
| **Automated payment reconciliation** | Payment confirmation is manual (ejecutivo marks as paid) |
| **Google Drive integration** | Original architecture used Google Drive; now replaced by Convex Storage |
| **n8n workflows** | Original architecture used n8n for orchestration; now handled by Convex server functions and cron jobs |

---

## 10. Risks and Mitigations

### 10.1 High-Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Template blocker** -- Templates for 9 services (27 components total) are still in progress | High | Critical -- Phase 4 cannot start without templates | Phases 1-3 proceed independently; use placeholder templates for development; prioritize template completion as a parallel workstream |
| **AI output quality** -- Claude API may not consistently produce "agency-quality" deliverables | Medium | High -- core value proposition depends on quality | Dual-agent architecture (Creator + Auditor); specialized prompts per service; up to 3 retry cycles; human review option before delivery |
| **Claude API cost overruns** -- Unexpected cost increases from retries or longer content | Low | Medium -- affects unit economics | Monitor token usage; set budget alerts; optimize prompts for efficiency; estimated $15-40/month for 60 clients is very manageable |

### 10.2 Medium-Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Multi-tenant data leakage** -- A bug allows cross-organization data access | Low | Critical -- trust and legal implications | orgId filtering enforced at Convex function level (middleware pattern); automated tests for tenant isolation; security review before launch |
| **Convex platform limitations** -- Hitting execution time limits or document size constraints on large operations | Medium | Medium -- requires architectural workarounds | Use Convex actions for long-running tasks; chunk large data; monitor function execution metrics |
| **Projection engine accuracy** -- Edge cases in the calculation not matching the Excel | Low | High -- financial accuracy is essential | Comprehensive regression tests comparing engine output to known Excel results; unit tests for each formula step |
| **Scope creep** -- Additional service areas or features requested mid-development | High | Medium -- delays delivery | Strict phase-gated development; new features go to backlog; MVP scope locked |

### 10.3 Low-Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Clerk dependency** -- Clerk service outage blocks authentication | Low | High -- no one can log in | Clerk has 99.9% SLA; implement graceful degradation messaging |
| **PDF generation performance** -- react-pdf rendering is slow for complex documents | Medium | Low -- delays delivery by minutes, not hours | Optimize templates; use background processing; cache common elements |
| **User adoption resistance** -- Consulting teams prefer manual processes | Medium | Medium -- reduces ROI | Phased rollout with pilot client; demonstrate time savings with data; maintain option for manual override |

---

## 11. MVP Scope

The MVP is defined as the first 3 development phases, which can proceed independently of the template blocker.

### Phase 1: Foundations (Fundamentos)

**Duration estimate:** 3-4 weeks
**Objective:** Core infrastructure and basic client management.

| Deliverable | Description |
|-------------|-------------|
| Project setup | Next.js 15 + Convex + Tailwind CSS + shadcn/ui |
| Database schema | 10 tables with orgId in Convex (TypeScript-first, fully typed) |
| Authentication | Clerk Organizations + Convex Auth integration |
| Role system | Super Admin, Admin, Ejecutivo, Viewer with permission enforcement |
| Client CRUD | Create, read, update, archive clients (filtered by organization) |
| Service seed data | 9 services with benchmark defaults pre-loaded |

**Exit criteria:** A user can log in, see their org's client list, create a new client with all required fields, and the data is properly isolated by organization.

### Phase 2: Projection Engine (Motor de Proyeccion)

**Duration estimate:** 4-5 weeks
**Objective:** Full financial projection capability replicating the Excel logic.

| Deliverable | Description |
|-------------|-------------|
| Projection input form | Collect annual sales, budget, commission rate, monthly sales estimates |
| Service configuration UI | Toggle services active/inactive, adjust chosen_pct with benchmark validation |
| Seasonality calculator | Compute FE factors from monthly sales data |
| Projection algorithm | Full implementation of the 7-step calculation (see Section 6.2) |
| Projection Matrix view | 12x9 grid with computed amounts |
| Invoice view | Monthly amounts with SAT concept fields |
| Dashboard (basic) | Sales vs. service payments chart, budget variance (Recharts) |

**Exit criteria:** An ejecutivo can create a full annual projection for a client that matches the output of the existing Excel calculator, with all 9 services, seasonality factors, and normalized weights.

### Phase 3: Questionnaire & Commercial Documents (Cuestionario + Documentos Comerciales)

**Duration estimate:** 4-5 weeks
**Objective:** Unified questionnaire system and automated quotation/contract generation.

| Deliverable | Description |
|-------------|-------------|
| Questionnaire system | Unified form with question deduplication across services |
| Response mapping | Responses automatically mapped to all relevant services |
| Quotation generator | Auto-generate quotation when service is activated |
| Contract generator | Auto-generate contract from approved quotation |
| Document cycle tracking | Track 4-document status per service (Projection, Quotation, Contract, Deliverable) |

**Exit criteria:** For any client with an active projection, the system generates a unified questionnaire, accepts responses, auto-generates quotations and contracts, and tracks the full document lifecycle.

### Post-MVP Phases (dependent on template completion)

**Phase 4: Deliverable Generator (Motor de Entregables)** -- Claude API integration, Creator + Auditor agents, PDF generation with branding, Convex Storage. BLOCKED by template completion.

**Phase 5: Automation & Pilot (Automatizacion)** -- Cron jobs, email notifications via Resend, invoice flow (a->b->c->d), pilot testing with real client.

**Phase 6: Platform Administration (Admin General)** -- Super Admin panel, org management, usage metrics, landing page.

---

*End of Product Requirements Document.*
