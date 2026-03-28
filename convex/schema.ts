import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    createdAt: v.number(),
  })
    .index("by_clerkOrgId", ["clerkOrgId"])
    .index("by_status", ["status"]),

  clients: defineTable({
    orgId: v.string(),
    name: v.string(),
    rfc: v.string(),
    industry: v.string(),
    annualRevenue: v.number(),
    billingFrequency: v.union(
      v.literal("semanal"),
      v.literal("quincenal"),
      v.literal("mensual")
    ),
    isArchived: v.boolean(),
    assignedTo: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_industry", ["orgId", "industry"])
    .index("by_orgId_assignedTo", ["orgId", "assignedTo"])
    .index("by_orgId_archived", ["orgId", "isArchived"]),

  projections: defineTable({
    orgId: v.string(),
    clientId: v.id("clients"),
    year: v.number(),
    annualSales: v.number(),
    totalBudget: v.number(),
    commissionRate: v.number(),
    seasonalityData: v.array(
      v.object({
        month: v.number(),
        monthlySales: v.number(),
        feFactor: v.number(),
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

  services: defineTable({
    orgId: v.optional(v.string()),
    name: v.string(),
    type: v.union(v.literal("base"), v.literal("comodin")),
    minPct: v.number(),
    maxPct: v.number(),
    defaultPct: v.number(),
    isDefault: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_name", ["name"]),

  projectionServices: defineTable({
    orgId: v.string(),
    projectionId: v.id("projections"),
    serviceId: v.id("services"),
    serviceName: v.string(),
    chosenPct: v.number(),
    isActive: v.boolean(),
    annualAmount: v.number(),
    normalizedWeight: v.number(),
  })
    .index("by_projectionId", ["projectionId"])
    .index("by_orgId", ["orgId"])
    .index("by_projectionId_active", ["projectionId", "isActive"]),

  monthlyAssignments: defineTable({
    orgId: v.string(),
    projServiceId: v.id("projectionServices"),
    projectionId: v.id("projections"),
    clientId: v.id("clients"),
    serviceName: v.string(),
    month: v.number(),
    year: v.number(),
    amount: v.number(),
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

  questionnaireResponses: defineTable({
    orgId: v.string(),
    clientId: v.id("clients"),
    projectionId: v.id("projections"),
    responses: v.array(
      v.object({
        questionId: v.string(),
        questionText: v.string(),
        answer: v.string(),
        serviceNames: v.array(v.string()),
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

  quotations: defineTable({
    orgId: v.string(),
    projServiceId: v.id("projectionServices"),
    clientId: v.id("clients"),
    serviceName: v.string(),
    content: v.string(),
    pdfStorageId: v.optional(v.id("_storage")),
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

  contracts: defineTable({
    orgId: v.string(),
    quotationId: v.id("quotations"),
    projServiceId: v.id("projectionServices"),
    clientId: v.id("clients"),
    serviceName: v.string(),
    content: v.string(),
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

  deliverables: defineTable({
    orgId: v.string(),
    assignmentId: v.id("monthlyAssignments"),
    projServiceId: v.id("projectionServices"),
    clientId: v.id("clients"),
    serviceName: v.string(),
    month: v.number(),
    year: v.number(),
    shortContent: v.string(),
    longContent: v.string(),
    shortPdfStorageId: v.optional(v.id("_storage")),
    longPdfStorageId: v.optional(v.id("_storage")),
    auditStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("corrected")
    ),
    auditFeedback: v.optional(v.string()),
    retryCount: v.number(),
    aiLog: v.optional(
      v.array(
        v.object({
          role: v.string(),
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
