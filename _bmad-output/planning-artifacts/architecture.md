---
stepsCompleted: [01,02,03,04,05,06,07,08]
inputDocuments: [prd.md, project-overview.md]
workflowType: 'architecture'
project_name: 'Projex - Automated Projection & Deliverable Engine'
user_name: 'Christian'
date: '2026-03-27'
---

# Architecture Decision Document - Projex

**Automated Projection & Deliverable Engine**

**Author:** Christian
**Date:** 2026-03-27
**Version:** 1.0
**Status:** Draft

---

## 1. High-Level Architecture

### 1.1 System Overview

Projex follows a three-tier architecture with a clear separation between the presentation layer (Next.js on Vercel), the backend-as-a-service layer (Convex Cloud), and external integrations (Claude API, Clerk, Resend).

```
                                 +-----------------+
                                 |   Clerk Auth    |
                                 | (Organizations) |
                                 +--------+--------+
                                          |
                                    JWT + orgId
                                          |
+------------------+          +-----------v-----------+          +------------------+
|                  |  React   |                       |  HTTP    |                  |
|   Next.js 15     +--------->+    Convex Cloud       +--------->+  Claude API      |
|   (Vercel)       |  Convex  |                       |  Action  |  (Sonnet)        |
|                  |  Client  |  - Document DB        |          |                  |
|  - App Router    <----------+  - Server Functions   +--------->+------------------+
|  - React 19      | Reactive |  - File Storage       |
|  - Tailwind CSS  | Queries  |  - Cron Jobs          +--------->+------------------+
|  - shadcn/ui     |          |                       |  HTTP    |                  |
|  - Recharts      |          +-----------------------+  Action  |  Resend          |
|  - react-pdf     |                                             |  (Email)         |
+------------------+                                             +------------------+
```

### 1.2 Multi-Tenant Data Flow

Every authenticated request flows through this path:

1. User authenticates via Clerk. The JWT contains `orgId` from Clerk Organizations.
2. Next.js client passes the Clerk token to Convex via the `ConvexProviderWithClerk` wrapper.
3. Every Convex query/mutation extracts `orgId` from the authenticated identity.
4. All database reads filter by `orgId`. All writes stamp `orgId` on every record.
5. Super Admin users (identified by a platform-level role) can bypass the `orgId` filter to access cross-tenant data.

### 1.3 Deployment Topology

| Component | Platform | URL Pattern |
|-----------|----------|-------------|
| Frontend (Next.js 15) | Vercel | `desc.vercel.app` (or custom domain) |
| Backend (Convex) | Convex Cloud | `<project>.convex.cloud` |
| Auth | Clerk | Managed SaaS |
| AI | Anthropic API | `api.anthropic.com` |
| Email | Resend | `api.resend.com` |

**Environment separation:** Convex provides dev/prod environments natively. Vercel preview deployments connect to the Convex dev environment. Production deployments connect to the Convex prod environment.

---

## 2. Convex Schema Design

### 2.1 Complete Schema Definition

This is the full `convex/schema.ts` file. All 10 tables are defined with proper validators, indexes, and relationships.

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================
  // Table 1: organizations
  // Platform-level table. No orgId (this IS the org record).
  // ============================================================
  organizations: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended")
    ),
    plan: v.union(
      v.literal("basic"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    createdAt: v.number(), // Unix timestamp in ms
  })
    .index("by_clerkOrgId", ["clerkOrgId"])
    .index("by_status", ["status"]),

  // ============================================================
  // Table 2: clients
  // Consulting firm clients. Scoped by orgId.
  // ============================================================
  clients: defineTable({
    orgId: v.string(),
    name: v.string(),
    rfc: v.string(),
    industry: v.string(),
    annualRevenue: v.number(), // MXN
    billingFrequency: v.union(
      v.literal("semanal"),
      v.literal("quincenal"),
      v.literal("mensual")
    ),
    isArchived: v.boolean(),
    assignedTo: v.optional(v.string()), // Clerk userId of assigned ejecutivo
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_industry", ["orgId", "industry"])
    .index("by_orgId_assignedTo", ["orgId", "assignedTo"])
    .index("by_orgId_archived", ["orgId", "isArchived"]),

  // ============================================================
  // Table 3: projections
  // Annual financial projections per client.
  // ============================================================
  projections: defineTable({
    orgId: v.string(),
    clientId: v.id("clients"),
    year: v.number(), // e.g., 2026
    annualSales: v.number(), // Projected annual sales MXN
    totalBudget: v.number(), // Total budget to contract MXN
    commissionRate: v.number(), // e.g., 0.02 for 2%
    seasonalityData: v.array(
      v.object({
        month: v.number(), // 1-12
        monthlySales: v.number(), // Estimated sales for this month
        feFactor: v.number(), // Seasonality factor
      })
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_clientId", ["clientId"])
    .index("by_orgId_year", ["orgId", "year"])
    .index("by_clientId_year", ["clientId", "year"]),

  // ============================================================
  // Table 4: services
  // Service catalog. Global (no orgId) or org-specific overrides.
  // Pre-seeded with the 9 default services.
  // ============================================================
  services: defineTable({
    orgId: v.optional(v.string()), // null = global default, string = org override
    name: v.string(),
    type: v.union(v.literal("base"), v.literal("comodin")),
    minPct: v.number(), // e.g., 0.01 for 1%
    maxPct: v.number(), // e.g., 0.03 for 3%
    defaultPct: v.number(), // e.g., 0.02 for 2%
    isDefault: v.boolean(), // true = platform-seeded
    sortOrder: v.number(), // Display order
  })
    .index("by_orgId", ["orgId"])
    .index("by_name", ["name"]),

  // ============================================================
  // Table 5: projection_services
  // Junction between projections and services for a specific client.
  // ============================================================
  projectionServices: defineTable({
    orgId: v.string(),
    projectionId: v.id("projections"),
    serviceId: v.id("services"),
    serviceName: v.string(), // Denormalized for display
    chosenPct: v.number(), // Percentage chosen for this projection
    isActive: v.boolean(),
    annualAmount: v.number(), // Computed annual allocation
    normalizedWeight: v.number(), // Computed normalized weight
  })
    .index("by_projectionId", ["projectionId"])
    .index("by_orgId", ["orgId"])
    .index("by_projectionId_active", ["projectionId", "isActive"]),

  // ============================================================
  // Table 6: monthly_assignments
  // One record per service per month per projection.
  // ============================================================
  monthlyAssignments: defineTable({
    orgId: v.string(),
    projServiceId: v.id("projectionServices"),
    projectionId: v.id("projections"), // Denormalized for querying
    clientId: v.id("clients"), // Denormalized for querying
    serviceName: v.string(), // Denormalized for display
    month: v.number(), // 1-12
    year: v.number(), // Denormalized from projection
    amount: v.number(), // Adjusted monthly amount (base x FE)
    feFactor: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("info_received"),
      v.literal("in_progress"),
      v.literal("delivered")
    ),
    invoiceStatus: v.union(
      v.literal("not_invoiced"),
      v.literal("invoiced"),
      v.literal("paid")
    ),
  })
    .index("by_orgId", ["orgId"])
    .index("by_projServiceId", ["projServiceId"])
    .index("by_projectionId", ["projectionId"])
    .index("by_clientId_month", ["clientId", "month"])
    .index("by_orgId_year_month", ["orgId", "year", "month"])
    .index("by_orgId_status", ["orgId", "status"])
    .index("by_orgId_invoiceStatus", ["orgId", "invoiceStatus"]),

  // ============================================================
  // Table 7: questionnaire_responses
  // Unified questionnaire per client per projection.
  // ============================================================
  questionnaireResponses: defineTable({
    orgId: v.string(),
    clientId: v.id("clients"),
    projectionId: v.id("projections"),
    responses: v.array(
      v.object({
        questionId: v.string(),
        questionText: v.string(),
        answer: v.string(),
        serviceNames: v.array(v.string()), // Which services need this answer
      })
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_clientId", ["clientId"])
    .index("by_projectionId", ["projectionId"])
    .index("by_orgId_status", ["orgId", "status"]),

  // ============================================================
  // Table 8: quotations
  // Generated quotation per projection_service.
  // ============================================================
  quotations: defineTable({
    orgId: v.string(),
    projServiceId: v.id("projectionServices"),
    clientId: v.id("clients"), // Denormalized
    serviceName: v.string(), // Denormalized
    content: v.string(), // Generated quotation content (markdown/text)
    pdfStorageId: v.optional(v.id("_storage")), // Convex storage reference
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_projServiceId", ["projServiceId"])
    .index("by_clientId", ["clientId"])
    .index("by_orgId_status", ["orgId", "status"]),

  // ============================================================
  // Table 9: contracts
  // Generated contract from an approved quotation.
  // ============================================================
  contracts: defineTable({
    orgId: v.string(),
    quotationId: v.id("quotations"),
    projServiceId: v.id("projectionServices"), // Denormalized
    clientId: v.id("clients"), // Denormalized
    serviceName: v.string(), // Denormalized
    content: v.string(), // Generated contract content
    pdfStorageId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("signed"),
      v.literal("cancelled")
    ),
    signedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_quotationId", ["quotationId"])
    .index("by_clientId", ["clientId"])
    .index("by_orgId_status", ["orgId", "status"]),

  // ============================================================
  // Table 10: deliverables
  // AI-generated deliverables (short + long versions).
  // ============================================================
  deliverables: defineTable({
    orgId: v.string(),
    assignmentId: v.id("monthlyAssignments"),
    projServiceId: v.id("projectionServices"), // Denormalized
    clientId: v.id("clients"), // Denormalized
    serviceName: v.string(), // Denormalized
    month: v.number(), // Denormalized
    year: v.number(), // Denormalized
    shortContent: v.string(), // Generated short version
    longContent: v.string(), // Generated long version
    shortPdfStorageId: v.optional(v.id("_storage")),
    longPdfStorageId: v.optional(v.id("_storage")),
    auditStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("corrected")
    ),
    auditFeedback: v.optional(v.string()), // Auditor agent feedback
    retryCount: v.number(), // Number of Creator retries (max 3)
    aiLog: v.optional(
      v.array(
        v.object({
          role: v.string(), // "creator" | "auditor"
          model: v.string(),
          inputTokens: v.number(),
          outputTokens: v.number(),
          costUsd: v.number(),
          timestamp: v.number(),
        })
      )
    ),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_assignmentId", ["assignmentId"])
    .index("by_clientId", ["clientId"])
    .index("by_orgId_auditStatus", ["orgId", "auditStatus"])
    .index("by_orgId_year_month", ["orgId", "year", "month"]),
});
```

### 2.2 Schema Design Rationale

**Denormalization strategy:** Convex does not support SQL-style joins. Fields like `serviceName`, `clientId`, `month`, and `year` are denormalized onto child tables to avoid cascading lookups. This is the idiomatic Convex approach and is acceptable given that these values rarely change after creation.

**orgId on every table:** All tables except `organizations` carry an `orgId` field. This is the cornerstone of multi-tenant isolation. Even tables that could theoretically derive `orgId` through relationships (e.g., `monthlyAssignments` could get it from `projectionServices`) store it directly for query-level filtering without chained lookups.

**Convex Storage references:** PDF files use `v.id("_storage")` which is Convex's built-in storage reference type, not raw URLs. The URL is generated on-demand via `ctx.storage.getUrl(storageId)`.

---

## 3. Server Functions Architecture

### 3.1 Directory Convention

```
convex/
  schema.ts                          # Schema definition (Section 2)
  auth.config.ts                     # Clerk + Convex auth config
  _generated/                        # Convex auto-generated types
  lib/
    authHelpers.ts                   # Auth middleware (Section 4)
    projectionEngine.ts              # Pure calculation functions (Section 6)
    validators.ts                    # Shared input validators
  functions/
    organizations/
      queries.ts                     # list, getById, getByClerkOrgId
      mutations.ts                   # create, update, updateStatus
    clients/
      queries.ts                     # list, getById, search
      mutations.ts                   # create, update, archive
    projections/
      queries.ts                     # getByClient, getById, getMatrix
      mutations.ts                   # create, update, recalculate
    services/
      queries.ts                     # listGlobal, listByOrg
      mutations.ts                   # createOrgOverride, update
      seed.ts                        # Seed default services
    projectionServices/
      queries.ts                     # listByProjection
      mutations.ts                   # upsert, toggleActive
    monthlyAssignments/
      queries.ts                     # listByProjection, listByClientMonth, listOverdue
      mutations.ts                   # updateStatus, updateInvoiceStatus, bulkCreate
    questionnaires/
      queries.ts                     # getByProjection, getByClient
      mutations.ts                   # create, updateResponses, updateStatus
    quotations/
      queries.ts                     # getByProjService, listByClient
      mutations.ts                   # create, updateContent, updateStatus
      actions.ts                     # generateQuotation (Claude API)
    contracts/
      queries.ts                     # getByQuotation, listByClient
      mutations.ts                   # create, updateContent, updateStatus
      actions.ts                     # generateContract (Claude API)
    deliverables/
      queries.ts                     # getByAssignment, listByClient, listByAuditStatus
      mutations.ts                   # create, updateAuditStatus, markDelivered
      actions.ts                     # generateDeliverable, auditDeliverable (Claude API)
    dashboard/
      queries.ts                     # financialSummary, deliverableStats, overviewByClient
    cron/
      monthlyCheck.ts                # First-of-month projection review
      overdueCheck.ts                # Overdue deliverable alerts
  crons.ts                           # Cron job schedule definitions
```

### 3.2 Queries (Read Operations)

| Module | Query | Description | Indexes Used |
|--------|-------|-------------|--------------|
| organizations | `list` | List all orgs (Super Admin only) | `by_status` |
| organizations | `getByClerkOrgId` | Resolve Clerk org to internal org | `by_clerkOrgId` |
| clients | `list` | List clients for current org | `by_orgId_archived` |
| clients | `search` | Filter by industry, revenue range | `by_orgId_industry` |
| clients | `getById` | Single client detail | primary key |
| projections | `getByClient` | All projections for a client | `by_clientId` |
| projections | `getMatrix` | Full projection matrix (services x months) | `by_clientId_year` + join to `projectionServices` + `monthlyAssignments` |
| monthlyAssignments | `listByProjection` | All months for a projection | `by_projectionId` |
| monthlyAssignments | `listOverdue` | Assignments past due date | `by_orgId_status` |
| dashboard | `financialSummary` | Sales vs. payments by month | `by_orgId_year_month` |
| deliverables | `listByAuditStatus` | Deliverables pending review | `by_orgId_auditStatus` |

### 3.3 Mutations (Write Operations)

| Module | Mutation | Description | Auth |
|--------|----------|-------------|------|
| clients | `create` | Create client with orgId stamp | Admin, Ejecutivo |
| clients | `update` | Update client fields | Admin, Ejecutivo |
| clients | `archive` | Soft-delete (set isArchived=true) | Admin |
| projections | `create` | Create projection + run engine + create projection_services + monthly_assignments | Admin, Ejecutivo |
| projections | `recalculate` | Re-run engine and update all child records | Admin, Ejecutivo |
| projectionServices | `toggleActive` | Toggle service and trigger recalculation | Admin, Ejecutivo |
| monthlyAssignments | `updateInvoiceStatus` | Mark as invoiced/paid (triggers deliverable generation if paid) | Admin, Ejecutivo |
| quotations | `updateStatus` | Advance quotation through lifecycle | Admin, Ejecutivo |
| contracts | `updateStatus` | Advance contract through lifecycle | Admin, Ejecutivo |
| deliverables | `markDelivered` | Mark as delivered + update assignment status | System (from action) |

### 3.4 Actions (External API Calls)

Actions are Convex functions that can call external APIs. They cannot directly read/write the database but can call mutations/queries internally.

| Module | Action | External Service | Description |
|--------|--------|-----------------|-------------|
| quotations | `generateQuotation` | Claude API | Generate quotation content from service data + client info |
| contracts | `generateContract` | Claude API | Generate contract content from approved quotation |
| deliverables | `generateDeliverable` | Claude API | Creator Agent: generate short + long versions |
| deliverables | `auditDeliverable` | Claude API | Auditor Agent: validate deliverable quality |
| email | `sendQuestionnaireLink` | Resend | Send questionnaire URL to client |
| email | `sendDeliverableNotification` | Resend | Notify client of new deliverable |
| email | `sendOverdueAlert` | Resend | Alert ejecutivo of overdue items |

### 3.5 Example Query Pattern

```typescript
// convex/functions/clients/queries.ts
import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireAuth, requireRole } from "../../lib/authHelpers";

export const list = query({
  args: {
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { orgId, role, userId } = await requireAuth(ctx);

    let q = ctx.db
      .query("clients")
      .withIndex("by_orgId_archived", (q) =>
        q.eq("orgId", orgId).eq("isArchived", args.isArchived ?? false)
      );

    const clients = await q.collect();

    // Ejecutivo only sees assigned clients
    if (role === "ejecutivo") {
      return clients.filter((c) => c.assignedTo === userId);
    }

    return clients;
  },
});

export const getById = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const { orgId } = await requireAuth(ctx);
    const client = await ctx.db.get(args.clientId);
    if (!client || client.orgId !== orgId) {
      throw new Error("Client not found");
    }
    return client;
  },
});
```

### 3.6 Example Mutation Pattern

```typescript
// convex/functions/clients/mutations.ts
import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireAuth, requireRole } from "../../lib/authHelpers";

export const create = mutation({
  args: {
    name: v.string(),
    rfc: v.string(),
    industry: v.string(),
    annualRevenue: v.number(),
    billingFrequency: v.union(
      v.literal("semanal"),
      v.literal("quincenal"),
      v.literal("mensual")
    ),
  },
  handler: async (ctx, args) => {
    const { orgId, userId } = await requireAuth(ctx);
    await requireRole(ctx, ["admin", "ejecutivo"]);

    const clientId = await ctx.db.insert("clients", {
      orgId,
      name: args.name,
      rfc: args.rfc,
      industry: args.industry,
      annualRevenue: args.annualRevenue,
      billingFrequency: args.billingFrequency,
      isArchived: false,
      assignedTo: userId,
      createdAt: Date.now(),
    });

    return clientId;
  },
});
```

### 3.7 Example Action Pattern

```typescript
// convex/functions/deliverables/actions.ts
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../_generated/api";
import Anthropic from "@anthropic-ai/sdk";

export const generateDeliverable = action({
  args: {
    assignmentId: v.id("monthlyAssignments"),
  },
  handler: async (ctx, args) => {
    // 1. Fetch context data via internal queries
    const assignment = await ctx.runQuery(
      api.functions.monthlyAssignments.queries.getById,
      { assignmentId: args.assignmentId }
    );

    const client = await ctx.runQuery(
      api.functions.clients.queries.getById,
      { clientId: assignment.clientId }
    );

    // 2. Call Claude API (Creator Agent)
    const anthropic = new Anthropic();
    const shortResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: buildCreatorSystemPrompt(assignment.serviceName, "short"),
      messages: [
        { role: "user", content: buildCreatorUserPrompt(client, assignment, "short") },
      ],
    });

    const longResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: buildCreatorSystemPrompt(assignment.serviceName, "long"),
      messages: [
        { role: "user", content: buildCreatorUserPrompt(client, assignment, "long") },
      ],
    });

    // 3. Save deliverable via mutation
    const deliverableId = await ctx.runMutation(
      api.functions.deliverables.mutations.create,
      {
        assignmentId: args.assignmentId,
        shortContent: extractText(shortResponse),
        longContent: extractText(longResponse),
        aiLog: [
          buildAiLogEntry("creator", shortResponse),
          buildAiLogEntry("creator", longResponse),
        ],
      }
    );

    // 4. Trigger audit
    await ctx.scheduler.runAfter(0, api.functions.deliverables.actions.auditDeliverable, {
      deliverableId,
    });

    return deliverableId;
  },
});
```

---

## 4. Authentication & Authorization

### 4.1 Clerk Organizations Setup

Clerk Organizations is configured as the identity provider. Each consulting firm maps to one Clerk Organization. Users belong to exactly one organization (except Super Admins who operate at the platform level).

**Clerk configuration:**
- Authentication methods: Email + password, Google OAuth
- Organization roles defined in Clerk: `org:admin`, `org:ejecutivo`, `org:viewer`
- Platform-level role (outside orgs): `platform:super_admin` (stored as Clerk user metadata)

### 4.2 Convex Auth Integration

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ],
};
```

The Next.js app wraps the Convex provider with Clerk:

```typescript
// app/providers.tsx
"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### 4.3 Auth Middleware (Server-Side)

```typescript
// convex/lib/authHelpers.ts
import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

type Role = "super_admin" | "admin" | "ejecutivo" | "viewer";

interface AuthInfo {
  userId: string;
  orgId: string;
  role: Role;
}

/**
 * Extracts and validates auth identity from Convex context.
 * Every query/mutation MUST call this as its first operation.
 * Returns orgId which MUST be used in all DB queries.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<AuthInfo> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const orgId = identity.orgId as string | undefined;
  const orgRole = identity.orgRole as string | undefined;
  const isSuperAdmin = (identity.publicMetadata as any)?.role === "super_admin";

  if (isSuperAdmin) {
    return {
      userId: identity.subject,
      orgId: orgId ?? "__platform__",
      role: "super_admin",
    };
  }

  if (!orgId) {
    throw new Error("No active organization. Please select an organization.");
  }

  const role = mapClerkRole(orgRole);

  return {
    userId: identity.subject,
    orgId,
    role,
  };
}

/**
 * Enforces that the current user has one of the allowed roles.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Role[]
): Promise<AuthInfo> {
  const auth = await requireAuth(ctx);
  if (!allowedRoles.includes(auth.role)) {
    throw new Error(
      `Forbidden: role '${auth.role}' is not in [${allowedRoles.join(", ")}]`
    );
  }
  return auth;
}

/**
 * For Super Admin queries that need to access a specific org's data.
 */
export async function requireSuperAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<{ userId: string }> {
  const auth = await requireAuth(ctx);
  if (auth.role !== "super_admin") {
    throw new Error("Forbidden: Super Admin access required");
  }
  return { userId: auth.userId };
}

function mapClerkRole(clerkRole: string | undefined): Role {
  switch (clerkRole) {
    case "org:admin":
      return "admin";
    case "org:ejecutivo":
      return "ejecutivo";
    case "org:viewer":
      return "viewer";
    default:
      return "viewer"; // Default to least privilege
  }
}
```

### 4.4 Role-Permission Matrix

| Resource / Action | Super Admin | Admin | Ejecutivo | Viewer |
|-------------------|:-----------:|:-----:|:---------:|:------:|
| View all orgs | Yes | - | - | - |
| Create/manage orgs | Yes | - | - | - |
| View all clients (in org) | Yes | Yes | Assigned only | Yes |
| Create/edit clients | Yes | Yes | Yes | - |
| Archive clients | Yes | Yes | - | - |
| Create/edit projections | Yes | Yes | Yes | - |
| View projections | Yes | Yes | Assigned clients | Yes |
| Manage service config | Yes | Yes | - | - |
| View dashboard | Yes | Yes | Filtered | Yes |
| Manage templates | Yes | Yes | - | - |
| Trigger deliverable gen | Yes | Yes | Yes | - |
| Download PDFs | Yes | Yes | Yes | Yes |
| Manage invoice status | Yes | Yes | Yes | - |

---

## 5. Multi-Tenant Data Isolation

### 5.1 Isolation Strategy

Projex uses **query-level tenant isolation** with `orgId` as the partition key. This is enforced at the Convex server function layer, not the database layer, meaning:

1. Every table (except `organizations`) has an `orgId` field.
2. Every query filters by `orgId` as the first index predicate.
3. The `orgId` value comes from the authenticated Clerk identity, never from client input.
4. There is no API endpoint that accepts `orgId` as a parameter (except Super Admin endpoints).

### 5.2 Enforcement Pattern

```typescript
// CORRECT: orgId comes from auth, used in index
export const list = query({
  args: {},
  handler: async (ctx) => {
    const { orgId } = await requireAuth(ctx);
    return ctx.db
      .query("clients")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

// WRONG: Never accept orgId from client args
// export const list = query({
//   args: { orgId: v.string() },  // NEVER DO THIS
//   handler: async (ctx, args) => {
//     return ctx.db.query("clients")
//       .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
//       .collect();
//   },
// });
```

### 5.3 Super Admin Cross-Org Access

Super Admin users can access any organization's data by providing a target `orgId`:

```typescript
export const listAllOrgs = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return ctx.db.query("organizations").collect();
  },
});

export const listClientsForOrg = query({
  args: { targetOrgId: v.string() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    return ctx.db
      .query("clients")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.targetOrgId))
      .collect();
  },
});
```

### 5.4 Data Isolation Verification

During development and before launch, automated tests must verify:

1. Creating a client in Org A is invisible to Org B users.
2. Fetching a client by `_id` from Org A fails for Org B users (even with the correct document ID).
3. Super Admin can see data from all orgs.
4. No query or mutation exposes data without `orgId` filtering.

---

## 6. Projection Engine Architecture

### 6.1 Design Principle

The projection engine is implemented as a **pure function library** in `convex/lib/projectionEngine.ts`. It has no side effects, no database access, and no external calls. It takes structured input and returns structured output. The Convex mutation that calls it handles reading inputs from the DB and writing results back.

### 6.2 Type Definitions

```typescript
// convex/lib/projectionEngine.ts

export interface SeasonalityInput {
  month: number; // 1-12
  monthlySales: number;
}

export interface ServiceInput {
  serviceId: string;
  serviceName: string;
  type: "base" | "comodin";
  chosenPct: number; // e.g., 0.02 for 2%
  isActive: boolean;
}

export interface ProjectionInput {
  annualSales: number;
  totalBudget: number;
  commissionRate: number;
  monthlyData: SeasonalityInput[]; // Must have exactly 12 entries
  services: ServiceInput[];
}

export interface MonthlyAllocation {
  month: number;
  amount: number; // Adjusted amount (base x FE)
  feFactor: number;
}

export interface ServiceAllocation {
  serviceId: string;
  serviceName: string;
  chosenPct: number;
  normalizedWeight: number;
  annualAmount: number;
  monthlyAllocations: MonthlyAllocation[];
}

export interface ProjectionOutput {
  annualCommissions: number;
  remainingBudget: number;
  serviceAllocations: ServiceAllocation[];
  commissionAllocations: MonthlyAllocation[]; // Comisiones by month
  seasonalityFactors: { month: number; feFactor: number }[];
  grandTotal: number;
}
```

### 6.3 Engine Implementation

```typescript
export function calculateProjection(input: ProjectionInput): ProjectionOutput {
  const { annualSales, totalBudget, commissionRate, monthlyData, services } = input;

  // STEP 1: Compute seasonality factors
  const averageMonthlySales = annualSales / 12;
  const seasonalityFactors = monthlyData.map((m) => ({
    month: m.month,
    feFactor: averageMonthlySales > 0 ? m.monthlySales / averageMonthlySales : 1,
  }));

  // STEP 2: Compute annual commissions
  const annualCommissions = annualSales * commissionRate;

  // STEP 3: Compute remaining budget
  const remainingBudget = totalBudget - annualCommissions;

  // STEP 4: Get active non-commission services and normalize weights
  const activeServices = services.filter(
    (s) => s.isActive && s.serviceName !== "Comisiones"
  );
  const sumActivePcts = activeServices.reduce((sum, s) => sum + s.chosenPct, 0);

  // STEP 5 & 6: Compute allocations per service
  const serviceAllocations: ServiceAllocation[] = activeServices.map((service) => {
    const normalizedWeight = sumActivePcts > 0 ? service.chosenPct / sumActivePcts : 0;
    const annualAmount = remainingBudget * normalizedWeight;
    const monthlyBase = annualAmount / 12;

    const monthlyAllocations: MonthlyAllocation[] = seasonalityFactors.map((sf) => ({
      month: sf.month,
      amount: Math.round(monthlyBase * sf.feFactor * 100) / 100, // Round to cents
      feFactor: sf.feFactor,
    }));

    return {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      chosenPct: service.chosenPct,
      normalizedWeight,
      annualAmount,
      monthlyAllocations,
    };
  });

  // STEP 7: Commission distribution (proportional to monthly sales)
  const commissionAllocations: MonthlyAllocation[] = monthlyData.map((m) => ({
    month: m.month,
    amount: Math.round(m.monthlySales * commissionRate * 100) / 100,
    feFactor: seasonalityFactors.find((sf) => sf.month === m.month)?.feFactor ?? 1,
  }));

  // If Comisiones is active, add it to serviceAllocations
  const comisionesService = services.find(
    (s) => s.serviceName === "Comisiones" && s.isActive
  );
  if (comisionesService) {
    serviceAllocations.push({
      serviceId: comisionesService.serviceId,
      serviceName: "Comisiones",
      chosenPct: commissionRate,
      normalizedWeight: 0, // Not normalized; calculated directly
      annualAmount: annualCommissions,
      monthlyAllocations: commissionAllocations,
    });
  }

  const grandTotal = serviceAllocations.reduce((sum, sa) => sum + sa.annualAmount, 0);

  return {
    annualCommissions,
    remainingBudget,
    serviceAllocations,
    commissionAllocations,
    seasonalityFactors,
    grandTotal,
  };
}
```

### 6.4 Mutation That Orchestrates the Engine

```typescript
// convex/functions/projections/mutations.ts
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    year: v.number(),
    annualSales: v.number(),
    totalBudget: v.number(),
    commissionRate: v.number(),
    monthlyData: v.array(
      v.object({ month: v.number(), monthlySales: v.number() })
    ),
    services: v.array(
      v.object({
        serviceId: v.id("services"),
        chosenPct: v.number(),
        isActive: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { orgId } = await requireAuth(ctx);
    await requireRole(ctx, ["admin", "ejecutivo"]);

    // Verify client belongs to org
    const client = await ctx.db.get(args.clientId);
    if (!client || client.orgId !== orgId) throw new Error("Client not found");

    // Resolve service names
    const servicesWithNames = await Promise.all(
      args.services.map(async (s) => {
        const svc = await ctx.db.get(s.serviceId);
        return {
          serviceId: s.serviceId as string,
          serviceName: svc!.name,
          type: svc!.type as "base" | "comodin",
          chosenPct: s.chosenPct,
          isActive: s.isActive,
        };
      })
    );

    // Compute seasonality
    const annualSales = args.annualSales;
    const monthlyDataWithFE = args.monthlyData.map((m) => ({
      month: m.month,
      monthlySales: m.monthlySales,
    }));

    // Run pure engine
    const result = calculateProjection({
      annualSales,
      totalBudget: args.totalBudget,
      commissionRate: args.commissionRate,
      monthlyData: monthlyDataWithFE,
      services: servicesWithNames,
    });

    // Persist projection
    const projectionId = await ctx.db.insert("projections", {
      orgId,
      clientId: args.clientId,
      year: args.year,
      annualSales,
      totalBudget: args.totalBudget,
      commissionRate: args.commissionRate,
      seasonalityData: result.seasonalityFactors.map((sf, i) => ({
        month: sf.month,
        monthlySales: args.monthlyData[i].monthlySales,
        feFactor: sf.feFactor,
      })),
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Persist service allocations + monthly assignments
    for (const sa of result.serviceAllocations) {
      const psId = await ctx.db.insert("projectionServices", {
        orgId,
        projectionId,
        serviceId: sa.serviceId as any, // Id type
        serviceName: sa.serviceName,
        chosenPct: sa.chosenPct,
        isActive: true,
        annualAmount: sa.annualAmount,
        normalizedWeight: sa.normalizedWeight,
      });

      for (const ma of sa.monthlyAllocations) {
        await ctx.db.insert("monthlyAssignments", {
          orgId,
          projServiceId: psId,
          projectionId,
          clientId: args.clientId,
          serviceName: sa.serviceName,
          month: ma.month,
          year: args.year,
          amount: ma.amount,
          feFactor: ma.feFactor,
          status: "pending",
          invoiceStatus: "not_invoiced",
        });
      }
    }

    return projectionId;
  },
});
```

---

## 7. AI Integration Architecture

### 7.1 Dual-Agent Architecture

Projex uses two Claude API agents working in sequence:

```
[Payment Confirmed]
       |
       v
+------+-------+
| Creator Agent |  <-- Claude Sonnet
| (Agente      |
|  Creador)    |
+------+-------+
       |
       | short_content + long_content
       v
+------+-------+
| Auditor Agent |  <-- Claude Sonnet
| (Agente      |
|  Auditor)    |
+------+-------+
       |
   approved?
  /         \
YES          NO (+ feedback)
 |            |
 v            v
[PDF Gen]   [Back to Creator]
              (max 3 retries)
```

### 7.2 Creator Agent Flow

**Input assembled from database:**
- Service template (short version template + long version template)
- Client data (name, industry, annual revenue, RFC)
- Questionnaire responses (mapped to this service)
- Month context (which month, FE factor, assigned amount)
- Projection context (annual budget, service scope)

**System prompt structure:**
```
You are a senior {service_name} consultant at a top-tier Mexican consulting firm.
You are generating a professional {document_type} deliverable for {client_name}.

SERVICE TEMPLATE:
{template_content}

QUALITY STANDARDS:
- The document must read as if produced by a professional consulting agency
- Use formal Mexican business Spanish
- Include specific data points from the client information provided
- Follow the exact structure defined in the template
- {version_specific_instructions}
```

**Two calls per deliverable:**
1. Short version call (max 4096 tokens) -- executive summary
2. Long version call (max 8192 tokens) -- comprehensive document

### 7.3 Auditor Agent Flow

**Input:**
- Generated deliverable content (short or long)
- Original template requirements
- Client-submitted questionnaire responses
- Quality criteria from the service template

**System prompt structure:**
```
You are a quality assurance auditor for a consulting firm's deliverables.
Review the following deliverable and determine if it meets all requirements.

EVALUATION CRITERIA:
1. Template compliance: Does it follow the required structure?
2. Data accuracy: Are client-specific details correctly incorporated?
3. Professional quality: Would this pass as agency-produced work?
4. Completeness: Are all required sections present?
5. Consistency: Is the formatting consistent throughout?

Respond with a JSON object:
{
  "approved": boolean,
  "score": number (1-10),
  "issues": string[] | null,
  "feedback": string | null
}
```

**Decision logic:**
- If `approved === true` and `score >= 7`: Proceed to PDF generation.
- If `approved === false` or `score < 7`: Return feedback to Creator Agent for revision.
- After 3 failed attempts: Mark as `rejected`, alert the ejecutivo for manual intervention.

### 7.4 Retry and Error Handling

```typescript
// Retry orchestration in the action
const MAX_RETRIES = 3;

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  const content = await callCreatorAgent(template, clientData, previousFeedback);
  const audit = await callAuditorAgent(content, template, clientData);

  if (audit.approved && audit.score >= 7) {
    // Success: save and proceed to PDF
    await ctx.runMutation(internal.deliverables.saveApproved, {
      deliverableId,
      shortContent: content.short,
      longContent: content.long,
      auditStatus: "approved",
    });
    return;
  }

  previousFeedback = audit.feedback;
  // Log retry attempt
}

// All retries exhausted
await ctx.runMutation(internal.deliverables.markRejected, {
  deliverableId,
  auditFeedback: previousFeedback,
});
// Notify ejecutivo via Resend
```

### 7.5 Cost Estimation

| Operation | Estimated Tokens (in + out) | Cost per Call (USD) |
|-----------|:---------------------------:|:-------------------:|
| Creator (short) | ~2000 in + ~2000 out | ~$0.012 |
| Creator (long) | ~2000 in + ~5000 out | ~$0.025 |
| Auditor | ~3000 in + ~500 out | ~$0.012 |
| **Total per deliverable (1 attempt)** | | **~$0.05** |
| **With 1 retry (avg)** | | **~$0.10** |
| **60 clients x 1 deliverable/month** | | **~$3-6/month** |

Cost tracking is logged in the `deliverables.aiLog` field for per-deliverable cost attribution.

### 7.6 API Key Management

- Claude API key stored as a Convex environment variable (`ANTHROPIC_API_KEY`).
- Resend API key stored as a Convex environment variable (`RESEND_API_KEY`).
- Keys are never exposed to the frontend. Only Convex actions (server-side) access them.
- Set via: `npx convex env set ANTHROPIC_API_KEY sk-ant-...`

---

## 8. File Storage Architecture

### 8.1 Convex Storage

All generated PDFs are stored in Convex's built-in file storage (`_storage` table). This eliminates the need for external storage services (Google Drive, S3).

**Storage flow:**
1. Content is generated (AI or template-based).
2. `react-pdf` renders the content to a PDF buffer on the server (Convex action).
3. The buffer is uploaded to Convex Storage via `ctx.storage.store(blob)`.
4. The returned `storageId` (type `Id<"_storage">`) is saved on the document record.
5. To serve the file, generate a URL via `ctx.storage.getUrl(storageId)`.

### 8.2 PDF Generation Flow

```
[Content (string)]
       |
       v
[react-pdf Renderer]  <-- Runs in Convex action (Node.js runtime)
       |
       | PDF Buffer (Uint8Array)
       v
[ctx.storage.store(blob)]
       |
       | storageId: Id<"_storage">
       v
[Save storageId to document record]
       |
       v
[Client requests PDF]
       |
       v
[ctx.storage.getUrl(storageId)]  --> Signed URL
       |
       v
[Browser downloads PDF]
```

### 8.3 PDF Template Components

Each PDF includes:
- Organization branding (logo, colors, fonts) -- configurable per org
- Header with organization name and service type
- Client details section
- Main content body (from AI-generated text)
- Footer with page numbers, date, and confidentiality notice

### 8.4 File Naming Convention

Files are stored by `storageId` in Convex (no filenames in storage). The download filename is set via the `Content-Disposition` header when serving. Convention:

```
{ClientName}_{ServiceName}_{DocumentType}_{Month}_{Year}.pdf

Examples:
- AcmeCorp_Legal_Cotizacion_Enero_2026.pdf
- AcmeCorp_Marketing_Entregable_Corto_Marzo_2026.pdf
- AcmeCorp_Contable_Contrato_2026.pdf
```

---

## 9. Frontend Architecture

### 9.1 Next.js App Router Structure

```
app/
  layout.tsx                         # Root layout with Providers
  providers.tsx                      # ClerkProvider + ConvexProvider
  (auth)/
    sign-in/[[...sign-in]]/page.tsx  # Clerk sign-in
    sign-up/[[...sign-up]]/page.tsx  # Clerk sign-up
  (platform)/                        # Super Admin routes
    layout.tsx                       # Platform admin layout
    admin/
      page.tsx                       # Org listing dashboard
      organizations/
        page.tsx                     # All organizations
        [orgId]/page.tsx             # Org detail + impersonation
      metrics/page.tsx               # Global platform metrics
  (dashboard)/                       # Organization-scoped routes
    layout.tsx                       # Sidebar + topbar layout
    page.tsx                         # Dashboard home (financial overview)
    clients/
      page.tsx                       # Client list
      new/page.tsx                   # New client form
      [clientId]/
        page.tsx                     # Client detail
        projections/
          new/page.tsx               # New projection wizard
          [projectionId]/
            page.tsx                 # Projection matrix view
            questionnaire/page.tsx   # Questionnaire management
    services/
      page.tsx                       # Service configuration
    templates/
      page.tsx                       # Template management per service
    deliverables/
      page.tsx                       # Deliverable tracking list
      [deliverableId]/page.tsx       # Deliverable detail + PDFs
    settings/
      page.tsx                       # Organization settings
```

### 9.2 Page Layout Hierarchy

```
RootLayout (app/layout.tsx)
  |-- Providers (Clerk + Convex)
  |
  |-- (auth) routes: Full-screen auth pages, no sidebar
  |
  |-- (platform) routes: Super Admin layout
  |     |-- TopBar (platform branding, user menu)
  |     |-- Sidebar (Organizations, Metrics, Settings)
  |     |-- Main content area
  |
  |-- (dashboard) routes: Organization layout
        |-- TopBar (org name, notifications, user menu, org switcher)
        |-- Sidebar (Dashboard, Clients, Services, Templates, Deliverables, Settings)
        |-- Main content area with breadcrumbs
```

### 9.3 Key Components Per Module

**Client Management:**
- `ClientList` -- Data table with search, filters, pagination (shadcn/ui `DataTable`)
- `ClientForm` -- Create/edit form with validation (React Hook Form + Zod)
- `ClientDetail` -- Overview card + tabs (projections, documents, deliverables)

**Projection Engine:**
- `ProjectionWizard` -- Multi-step form: (1) Basic data, (2) Monthly sales, (3) Service config, (4) Review matrix
- `ProjectionMatrix` -- 12x9 grid component with color-coded cells
- `ServiceConfigurator` -- Sliders for percentage selection with min/max bounds
- `SeasonalityChart` -- Bar chart of monthly sales + FE factors (Recharts)

**Service Matrix:**
- `MatrixGrid` -- Interactive grid with cell-click detail panel
- `StatusBadge` -- Color-coded status indicators
- `CellDetailPanel` -- Side panel showing document cycle status

**Dashboard:**
- `FinancialOverviewChart` -- Sales vs. payments line/bar chart (Recharts)
- `BudgetVarianceCard` -- Difference visualization
- `DeliverableStatusPie` -- Status distribution pie chart (Recharts)
- `ClientSummaryCards` -- Grid of per-client status cards

**Deliverable Generator:**
- `DeliverableDetail` -- Content preview (short + long), audit status, retry history
- `PdfPreview` -- Embedded PDF viewer
- `AuditLog` -- Timeline of creator/auditor interactions

### 9.4 State Management

Projex does **not** use a client-side state management library (no Redux, Zustand, etc.). All server state is managed through Convex's reactive queries, which provide real-time subscriptions out of the box.

```typescript
// Example: Real-time client list
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ClientList() {
  const clients = useQuery(api.functions.clients.queries.list, {
    isArchived: false,
  });

  if (clients === undefined) return <LoadingSkeleton />;
  if (clients.length === 0) return <EmptyState />;

  return <DataTable data={clients} columns={clientColumns} />;
}
```

**Local UI state** (form inputs, modal open/close, tab selection) uses React `useState` and `useReducer`. Form state uses React Hook Form.

---

## 10. API & Integration Patterns

### 10.1 Resend Email Integration

Email is sent via Convex actions that call the Resend API.

```typescript
// convex/functions/email/actions.ts
import { action } from "../../_generated/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendQuestionnaireLink = action({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    questionnaireUrl: v.string(),
    orgName: v.string(),
  },
  handler: async (ctx, args) => {
    await resend.emails.send({
      from: `${args.orgName} <noreply@projex-platform.com>`,
      to: args.clientEmail,
      subject: `${args.orgName} - Cuestionario de servicios`,
      html: buildQuestionnaireEmailHtml(args),
    });
  },
});
```

**Email types:**
| Email | Trigger | Recipient |
|-------|---------|-----------|
| Questionnaire link | Projection created | Client contact |
| Deliverable ready | Deliverable approved | Client contact |
| Overdue alert | Cron job (daily) | Assigned ejecutivo |
| Monthly summary | Cron job (1st of month) | Admin |

### 10.2 Convex Cron Jobs

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run on the 1st of every month at 8:00 AM UTC
crons.monthly(
  "monthly-projection-review",
  { day: 1, hourUTC: 14, minuteUTC: 0 }, // 8:00 AM CST
  internal.functions.cron.monthlyCheck.run
);

// Run daily at 9:00 AM UTC to check for overdue deliverables
crons.daily(
  "overdue-deliverable-check",
  { hourUTC: 15, minuteUTC: 0 }, // 9:00 AM CST
  internal.functions.cron.overdueCheck.run
);

export default crons;
```

**Monthly check logic:**
1. Query all active projections for the current month.
2. For each monthly assignment where `status === "pending"`:
   - If questionnaire is not complete, send reminder email to client.
   - If questionnaire is complete but no quotation exists, trigger quotation generation.
3. Generate monthly summary for each org's admin.

**Overdue check logic:**
1. Query all monthly assignments where `status !== "delivered"` and `month < currentMonth`.
2. Send overdue alert emails to assigned ejecutivos.

### 10.3 Webhook Patterns

Projex does not currently expose webhooks. However, Clerk sends webhooks for organization membership changes. These are handled via a Next.js API route:

```
app/api/webhooks/clerk/route.ts  --> Handles org membership sync
```

This webhook is used to keep the Convex `organizations` table in sync with Clerk when:
- A new organization is created in Clerk
- A user is added/removed from an organization
- An organization's metadata changes

---

## 11. Security Considerations

### 11.1 Row-Level Security via orgId Filtering

As detailed in Section 5, every Convex function that reads or writes tenant data must:
1. Call `requireAuth()` to extract `orgId` from the JWT.
2. Use `orgId` as the first predicate in every database index query.
3. Verify `orgId` on fetched documents before returning them.
4. Never accept `orgId` from client-side arguments (except Super Admin endpoints).

### 11.2 API Key Management

| Secret | Storage Location | Access Scope |
|--------|-----------------|--------------|
| `ANTHROPIC_API_KEY` | Convex env vars | Convex actions only |
| `RESEND_API_KEY` | Convex env vars | Convex actions only |
| `CLERK_SECRET_KEY` | Vercel env vars | Next.js API routes only |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel env vars | Client-side (public) |
| `NEXT_PUBLIC_CONVEX_URL` | Vercel env vars | Client-side (public) |
| `CLERK_WEBHOOK_SECRET` | Vercel env vars | Webhook route only |

Keys are never committed to source control. They are set via platform dashboards (Convex CLI for `npx convex env set`, Vercel dashboard for frontend vars).

### 11.3 Input Validation

All Convex function arguments are validated by Convex's built-in validator system (`v.string()`, `v.number()`, etc.) at the framework level before the handler executes. This provides:

- Type safety (invalid types are rejected before handler code runs)
- Required field enforcement (missing fields fail validation)
- Union type enforcement (invalid enum values are rejected)

Additional business-level validation is performed in the handler:

```typescript
// Business validation example
if (args.commissionRate < 0 || args.commissionRate > 0.10) {
  throw new Error("Commission rate must be between 0% and 10%");
}
if (args.monthlyData.length !== 12) {
  throw new Error("Exactly 12 monthly data entries are required");
}
```

### 11.4 Transport Security

- All Convex traffic is encrypted via HTTPS (enforced by Convex Cloud).
- All Vercel traffic is HTTPS by default.
- Clerk JWTs use RS256 signing with automatic key rotation.
- Convex Storage URLs are signed and time-limited.

---

## 12. Key Architecture Decisions (ADRs)

### ADR-1: Convex as the Single Backend

**Context:** Projex needs a database, server functions, file storage, cron jobs, and real-time subscriptions. The team evaluated separate services (Supabase + Vercel API routes + S3 + separate cron service) versus an integrated backend-as-a-service.

**Decision:** Use Convex as the single backend layer providing document database, server functions (queries, mutations, actions), file storage, cron scheduling, and real-time reactive queries.

**Consequences:**
- (+) Single deployment unit for all backend concerns. No infrastructure to manage.
- (+) Built-in real-time subscriptions eliminate the need for WebSocket setup or polling.
- (+) TypeScript-first schema with automatic type generation ensures end-to-end type safety.
- (-) Vendor lock-in to Convex. Migrating away would require re-implementing the query layer, storage, cron, and real-time infrastructure.
- (-) No SQL joins. Requires denormalization and multiple queries for complex data fetching.

---

### ADR-2: Clerk Organizations for Multi-Tenancy

**Context:** Projex is a multi-tenant SaaS platform. Each consulting firm is a separate tenant. The system needs organization-scoped authentication, role-based access control, and invitation management.

**Decision:** Use Clerk Organizations as the identity and tenancy provider. Each consulting firm maps to one Clerk Organization. Roles (`org:admin`, `org:ejecutivo`, `org:viewer`) are defined in Clerk and extracted from the JWT in Convex functions.

**Consequences:**
- (+) Organization management (invitations, role assignment, membership) is handled by Clerk's UI components and APIs.
- (+) JWT tokens carry `orgId` and `orgRole`, enabling server-side enforcement without additional DB lookups.
- (-) Super Admin role requires special handling (platform-level metadata rather than org-level role).
- (-) Clerk is an external dependency. Downtime blocks all authentication.

---

### ADR-3: Query-Level Tenant Isolation (Not Database-Level)

**Context:** Multi-tenant data isolation can be implemented at the database level (separate databases per tenant), table level (separate tables per tenant), or query level (shared tables with `orgId` filtering).

**Decision:** Use query-level isolation with `orgId` on every table. Every Convex function extracts `orgId` from the authenticated identity and uses it as the first filter predicate in all database queries.

**Consequences:**
- (+) Simple architecture. One schema, one set of server functions.
- (+) Cost-effective. No per-tenant infrastructure overhead.
- (+) Easy to implement cross-tenant reporting for Super Admin.
- (-) A bug in a single query function could leak data across tenants. Requires disciplined code review and automated testing.
- (-) No database-level guarantee of isolation. Relies entirely on application-level enforcement.

---

### ADR-4: Pure Function Projection Engine

**Context:** The projection engine replicates complex Excel calculation logic (7-step algorithm with seasonality, normalization, and commission handling). This logic needs to be testable, deterministic, and fast.

**Decision:** Implement the projection engine as a pure TypeScript function library (`convex/lib/projectionEngine.ts`) with no side effects, no database access, and no external calls. The Convex mutation handles I/O; the engine handles math.

**Consequences:**
- (+) Fully testable with unit tests. Can run regression tests comparing output to known Excel results.
- (+) Deterministic: same inputs always produce same outputs.
- (+) Portable: the calculation logic can be reused client-side for previews.
- (-) Requires a mutation to orchestrate the I/O around the pure function, adding a layer of indirection.

---

### ADR-5: Dual-Agent AI Architecture (Creator + Auditor)

**Context:** The core value proposition of Projex is generating "agency-quality" professional deliverables via AI. Single-shot AI generation may produce inconsistent quality.

**Decision:** Use a dual-agent architecture where the Creator Agent generates the deliverable and the Auditor Agent validates it against quality criteria. If the Auditor rejects, the Creator retries with feedback (up to 3 times). This runs as a Convex action pipeline.

**Consequences:**
- (+) Quality safety net. The Auditor catches errors before delivery to clients.
- (+) Self-improving loop. Creator feedback from the Auditor improves subsequent attempts.
- (+) Measurable quality via audit scores and pass rates.
- (-) 2-3x the API cost per deliverable (Creator + Auditor calls, plus retries).
- (-) Longer end-to-end generation time (sequential API calls).
- (-) The Auditor itself is an AI model and may not catch all quality issues.

---

### ADR-6: Convex Storage Over External File Services

**Context:** Generated PDFs need persistent storage with URL-based access. Options include Google Drive (original plan), AWS S3, Cloudflare R2, or Convex's built-in storage.

**Decision:** Use Convex's built-in file storage (`_storage`) for all generated PDFs. References are stored as `v.id("_storage")` on document records. URLs are generated on-demand via `ctx.storage.getUrl()`.

**Consequences:**
- (+) No additional service to configure or pay for. Storage is included in Convex pricing.
- (+) Tight integration with the database. Storage IDs are first-class Convex types.
- (+) Signed URLs with automatic expiry for security.
- (-) Less flexibility than S3 (no custom bucket policies, lifecycle rules, or CDN integration).
- (-) Convex storage limits may become a constraint at very high document volumes.

---

### ADR-7: react-pdf for PDF Generation

**Context:** Projex needs to generate branded PDF documents (quotations, contracts, deliverables) from AI-generated content. Options include Google Docs API, Puppeteer/Playwright (HTML-to-PDF), LaTeX, or react-pdf.

**Decision:** Use `@react-pdf/renderer` to generate PDFs. Templates are defined as React components with the react-pdf primitives (`Document`, `Page`, `View`, `Text`, `Image`). Rendering happens in Convex actions (Node.js environment).

**Consequences:**
- (+) Same technology (React) for UI and PDF templates. Familiar to the development team.
- (+) Full programmatic control over layout, fonts, colors, and branding.
- (+) No external service dependency for PDF generation.
- (-) Complex layouts may be harder to achieve than with HTML/CSS-to-PDF approaches.
- (-) react-pdf rendering can be CPU-intensive for large documents. Must monitor Convex action execution times.

---

### ADR-8: No Payment Gateway (Manual Billing)

**Context:** Projex needs subscription management for consulting firms. The team considered Stripe integration for automated billing.

**Decision:** Do not integrate Stripe or any payment gateway. Subscriptions are managed manually by the platform team. Organization plan and status are updated directly in the admin panel.

**Consequences:**
- (+) Eliminates significant implementation complexity (payment flows, webhook handling, failed payment recovery, refund logic).
- (+) Direct client relationships with personalized service terms.
- (-) Manual overhead for the platform team to manage billing.
- (-) No self-service onboarding for new organizations.
- (-) Will need to revisit when scaling beyond ~20 organizations.

---

### ADR-9: Spanish-Only UI with English Codebase

**Context:** Projex targets Mexican consulting firms. The primary users are Spanish speakers. However, the development team works in English.

**Decision:** All code (variable names, comments, function names, schema fields) is written in English. The user-facing UI (labels, messages, button text) is in Spanish. Business domain terms that are inherently Spanish (e.g., "ejecutivo", "cotizacion", "entregable") are kept in Spanish in the UI but use English translations in the codebase (e.g., `quotation`, `deliverable`, `accountExecutive`).

**Consequences:**
- (+) Clean, consistent English codebase that is accessible to any developer.
- (+) Spanish UI provides natural experience for target users.
- (-) Requires maintaining a mental mapping between English code terms and Spanish UI terms.
- (-) If internationalization is needed later, the existing Spanish strings will need to be extracted into translation files.

---

### ADR-10: Denormalized Fields for Convex Query Performance

**Context:** Convex does not support joins. Fetching related data requires multiple sequential queries (e.g., to display a monthly assignment's service name, you would need to look up `projectionServices` then `services`).

**Decision:** Denormalize frequently-displayed fields onto child records at write time. Specifically: `serviceName`, `clientId`, `month`, and `year` are stored on `monthlyAssignments`, `quotations`, `contracts`, and `deliverables` even though they could be derived from parent records.

**Consequences:**
- (+) Single-query reads for list views and dashboards. No cascading lookups.
- (+) Better performance for index-based queries (can filter by `serviceName` or `month` directly).
- (-) Data duplication. If a service name changes, all child records must be updated.
- (-) Slightly larger storage footprint per record.
- Mitigation: Service names and client IDs rarely change after creation. If they do, a batch mutation updates all denormalized references.

---

*End of Architecture Decision Document.*
