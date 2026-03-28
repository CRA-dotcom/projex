# Projex — Modular Architecture Design

**Date:** 2026-03-28
**Status:** Approved
**Author:** Christian / Claude

---

## 1. Problem Statement

The current Projex implementation has hardcoded business logic that prevents per-organization customization:

- Projection formulas (FE, budget distribution, commission handling) are fixed in code
- Commission service detected by string match (`serviceName === "Comisiones"`) — fragile
- No branding system for whitelabel deliverables
- No template system for AI-generated documents
- Service catalog is global with no per-org assignment control
- No feature flags to control what each org can see/do

This design introduces three new modules and refactors the existing service/engine layer to be fully config-driven and modular per organization.

---

## 2. Architecture Overview

```
Super Admin Panel
├── Org Management (create, configure, suspend)
├── Service Catalog Assignment (per org)
├── Feature Flags (per org)
└── Calculation Config (per org)

Organization Panel (Firma Consultora)
├── Dashboard (metrics for their clients)
├── Client Management
├── Projection Engine ← reads OrgConfig for formulas
├── Service Matrix ← only sees assigned services
├── Branding Config ← logo, colors, fonts
├── Deliverable Templates ← HTML templates with variables
└── Document Pipeline: Template → AI Fill → HTML Render → PDF with Branding
```

---

## 3. New Tables

### 3.1 `orgConfigs`

Stores calculation rules and feature flags per organization. If no config exists for an org, the system uses hardcoded defaults (current behavior).

```typescript
orgConfigs: defineTable({
  orgId: v.string(),

  // Calculation settings
  calculationMode: v.union(
    v.literal("weighted"),       // current: proportional by weight (default)
    v.literal("fixed"),          // fixed monthly amounts per service
    v.literal("custom")         // future: custom formula engine
  ),
  commissionMode: v.union(
    v.literal("proportional"),   // current: commission = monthlySales * rate (default)
    v.literal("fixed_monthly"),  // fixed commission per month
    v.literal("tiered")         // future: tiered commission brackets
  ),
  seasonalityEnabled: v.boolean(),  // default: true
  maxServicesPerProjection: v.optional(v.number()), // null = unlimited

  // Feature flags — Super Admin controls what the org admin can see
  featureFlags: v.object({
    advancedConfigVisible: v.boolean(),   // can org admin adjust benchmarks?
    customServicesVisible: v.boolean(),   // can org admin see custom services?
    seasonalityEditable: v.boolean(),     // can org admin edit FE factors?
    manualOverrideAllowed: v.boolean(),   // can org admin override monthly amounts?
  }),

  // Future extensibility
  currency: v.optional(v.string()),       // default: "MXN"
  fiscalYearStartMonth: v.optional(v.number()), // default: 1 (January)

  updatedAt: v.number(),
})
  .index("by_orgId", ["orgId"]),
```

**Defaults when no config exists:**
- `calculationMode: "weighted"`
- `commissionMode: "proportional"`
- `seasonalityEnabled: true`
- All feature flags: `false` (locked down by default, Super Admin enables)
- `currency: "MXN"`
- `fiscalYearStartMonth: 1`

### 3.2 `orgBranding`

Stores whitelabel branding per organization. Applied to all generated PDFs (quotations, contracts, deliverables).

```typescript
orgBranding: defineTable({
  orgId: v.string(),
  companyName: v.string(),
  logoStorageId: v.optional(v.id("_storage")),
  primaryColor: v.string(),      // hex, e.g. "#1E40AF"
  secondaryColor: v.string(),    // hex
  accentColor: v.optional(v.string()),
  fontFamily: v.string(),        // e.g. "Inter", "Montserrat"
  headerText: v.optional(v.string()),   // custom header for documents
  footerText: v.optional(v.string()),   // custom footer for documents
  updatedAt: v.number(),
})
  .index("by_orgId", ["orgId"]),
```

**Defaults when no branding exists:**
- `companyName: org.name` (from organizations table)
- `primaryColor: "#0F172A"`
- `secondaryColor: "#1E293B"`
- `fontFamily: "IBM Plex Sans"`
- `footerText: "Generado por {companyName}"`

### 3.3 `deliverableTemplates`

Stores HTML templates with variable placeholders for each document type per service.

```typescript
deliverableTemplates: defineTable({
  orgId: v.optional(v.string()),  // null = global/platform template
  serviceId: v.optional(v.id("services")), // null = applies to all services of this type
  serviceName: v.string(),       // denormalized for display
  type: v.union(
    v.literal("quotation"),
    v.literal("contract"),
    v.literal("deliverable_short"),
    v.literal("deliverable_long"),
    v.literal("questionnaire")
  ),
  name: v.string(),              // human-readable template name
  htmlTemplate: v.string(),      // HTML with {{variable}} placeholders
  variables: v.array(
    v.object({
      key: v.string(),           // e.g. "client_name"
      label: v.string(),         // e.g. "Nombre del Cliente"
      source: v.union(
        v.literal("client"),     // from clients table
        v.literal("projection"), // from projection data
        v.literal("service"),    // from service config
        v.literal("ai"),         // AI-generated content
        v.literal("manual")     // user fills manually
      ),
      required: v.boolean(),
    })
  ),
  version: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_orgId", ["orgId"])
  .index("by_serviceId", ["serviceId"])
  .index("by_type", ["type"]),
```

**Template Pipeline:**
1. Super Admin uploads PDF reference → converts to HTML manually or with tool
2. Marks variable placeholders in HTML: `{{client_name}}`, `{{service_scope}}`, `{{monthly_amount}}`
3. Saves as `deliverableTemplate` linked to org + service + type
4. When generating a document:
   - System resolves `client` and `projection` variables from DB
   - AI fills `ai` variables (scope descriptions, analysis, recommendations)
   - User fills `manual` variables if any
   - Renders final HTML with branding (from `orgBranding`)
   - Converts to PDF

---

## 4. Schema Changes to Existing Tables

### 4.1 `services` — Add flags

```diff
services: defineTable({
  orgId: v.optional(v.string()),
  name: v.string(),
  type: v.union(v.literal("base"), v.literal("comodin")),
+ isCommission: v.boolean(),     // replaces serviceName === "Comisiones" detection
+ isCustom: v.boolean(),         // true = created by Super Admin for specific org
  minPct: v.number(),
  maxPct: v.number(),
  defaultPct: v.number(),
  isDefault: v.boolean(),
  sortOrder: v.number(),
})
```

**Migration:** Add `isCommission: false` to all existing services except "Comisiones" which gets `isCommission: true`. Add `isCustom: false` to all existing services.

### 4.2 `organizations` — Add service assignment

```diff
organizations: defineTable({
  clerkOrgId: v.string(),
  name: v.string(),
  status: v.union(...),
  plan: v.union(...),
+ assignedServiceIds: v.optional(v.array(v.id("services"))),  // null = all defaults
  createdAt: v.number(),
})
```

When `assignedServiceIds` is null, the org gets all default services. When set, the org only sees the listed services. Super Admin controls this at org creation/edit time.

---

## 5. Projection Engine Refactor

### Current (hardcoded):
```typescript
function calculateProjection(input: ProjectionInput): ProjectionResult
```

### New (config-driven):
```typescript
type EngineConfig = {
  calculationMode: "weighted" | "fixed" | "custom";
  commissionMode: "proportional" | "fixed_monthly" | "tiered";
  seasonalityEnabled: boolean;
};

function calculateProjection(
  input: ProjectionInput,
  config: EngineConfig  // NEW: org-specific rules
): ProjectionResult
```

**Changes inside the engine:**
1. Replace `serviceName === "Comisiones"` with `service.isCommission === true`
2. Switch on `config.calculationMode` for budget distribution logic
3. Switch on `config.commissionMode` for commission calculation
4. Respect `config.seasonalityEnabled` — if false, force FE=1 for all months
5. Keep current formulas as the `"weighted"` / `"proportional"` branch (no behavior change for existing orgs)

**Backward compatibility:** If no `orgConfig` exists, engine uses defaults that match current behavior exactly. Zero breaking changes.

---

## 6. Document Generation Pipeline

```
┌─────────────────────────────────────────────┐
│                  PIPELINE                    │
│                                              │
│  1. SELECT template (by org + service + type)│
│                    ↓                         │
│  2. RESOLVE variables                        │
│     ├── client: from clients table           │
│     ├── projection: from projection data     │
│     ├── service: from service config         │
│     └── ai: Claude API generates content     │
│                    ↓                         │
│  3. RENDER HTML (replace {{vars}})           │
│                    ↓                         │
│  4. APPLY BRANDING (from orgBranding)        │
│     ├── inject logo                          │
│     ├── apply colors/fonts                   │
│     └── add header/footer                    │
│                    ↓                         │
│  5. GENERATE PDF (react-pdf or html-to-pdf)  │
│                    ↓                         │
│  6. STORE in Convex Storage                  │
│                    ↓                         │
│  7. AUDIT (AI auditor validates quality)     │
│                    ↓                         │
│  8. DELIVER (mark as delivered, notify)      │
└─────────────────────────────────────────────┘
```

**Template Resolution Order:**
1. Org-specific + service-specific template (most specific)
2. Org-specific + generic template (org default)
3. Platform template + service-specific (global default)
4. Platform template + generic (fallback)

---

## 7. Super Admin Panel — New Features

The Super Admin panel (`/admin`) needs these capabilities:

### 7.1 Organization Management (enhanced)
- Create org with service assignment (checkboxes from service catalog)
- Edit org: change assigned services, plan, status
- Toggle feature flags per org

### 7.2 Service Catalog Management
- View all services (default + custom)
- Create custom services for specific orgs
- Set `isCommission` flag
- Adjust benchmarks per org

### 7.3 Template Management
- Upload/create HTML templates
- Assign templates to orgs/services
- Preview template with sample data
- Version templates (keep history)

### 7.4 Branding Configuration
- Set branding per org (logo upload, colors, fonts)
- Preview how a document looks with the branding

---

## 8. Implementation Order

This design should be implemented in this order to minimize disruption:

1. **Schema migration** — Add new tables + fields to existing tables (non-breaking)
2. **Engine refactor** — Make `calculateProjection` config-aware (backward compatible)
3. **Super Admin panel** — `/admin` routes for org/service/config management
4. **Branding system** — `orgBranding` CRUD + PDF branding injection
5. **Template system** — `deliverableTemplates` CRUD + variable resolution
6. **Document pipeline** — End-to-end: template → AI → render → PDF → deliver

Steps 1-3 can ship independently. Steps 4-6 depend on templates being provided.

---

## 9. What This Design Does NOT Include

- **Custom formula editor** — The `"custom"` calculation mode is a placeholder. When needed, it can be implemented as a simple expression evaluator or a rule engine. For now, `"weighted"` and `"fixed"` cover known use cases.
- **Multi-currency support** — The `currency` field exists but the engine doesn't convert. Added for future use.
- **Client-level branding** — Intentionally excluded to keep it simple. Can be added later by extending `orgBranding` pattern.
- **Template visual editor** — Templates are edited as HTML. A WYSIWYG editor is a future nice-to-have.
