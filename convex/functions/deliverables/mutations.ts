import { mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgId } from "../../lib/authHelpers";
import { internal } from "../../_generated/api";

// ─── Public mutations ────────────────────────────────────────────────

/**
 * Manual creation of a deliverable (for non-AI deliverables).
 */
export const create = mutation({
  args: {
    assignmentId: v.id("monthlyAssignments"),
    projServiceId: v.id("projectionServices"),
    clientId: v.id("clients"),
    serviceName: v.string(),
    month: v.number(),
    year: v.number(),
    shortContent: v.string(),
    longContent: v.string(),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.orgId !== orgId) {
      throw new Error("Asignacion no encontrada.");
    }

    return await ctx.db.insert("deliverables", {
      orgId,
      assignmentId: args.assignmentId,
      projServiceId: args.projServiceId,
      clientId: args.clientId,
      serviceName: args.serviceName,
      month: args.month,
      year: args.year,
      shortContent: args.shortContent,
      longContent: args.longContent,
      auditStatus: "pending",
      retryCount: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Mark a deliverable as delivered (set deliveredAt timestamp).
 */
export const markDelivered = mutation({
  args: { id: v.id("deliverables") },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);
    const deliverable = await ctx.db.get(args.id);
    if (!deliverable || deliverable.orgId !== orgId) {
      throw new Error("Entregable no encontrado.");
    }

    await ctx.db.patch(args.id, { deliveredAt: Date.now() });
  },
});

/**
 * Manual override of audit status.
 */
export const updateAuditStatus = mutation({
  args: {
    id: v.id("deliverables"),
    auditStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("corrected")
    ),
    auditFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);
    const deliverable = await ctx.db.get(args.id);
    if (!deliverable || deliverable.orgId !== orgId) {
      throw new Error("Entregable no encontrado.");
    }

    const patch: Record<string, unknown> = {
      auditStatus: args.auditStatus,
    };
    if (args.auditFeedback !== undefined) {
      patch.auditFeedback = args.auditFeedback;
    }

    await ctx.db.patch(args.id, patch);
  },
});

/**
 * Deliver a deliverable to the client.
 * - Verifies audit status is "approved"
 * - Sets deliveredAt timestamp
 * - Updates corresponding monthlyAssignment status to "delivered"
 * - Schedules email notification to client
 */
export const deliver = mutation({
  args: {
    deliverableId: v.id("deliverables"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const deliverable = await ctx.db.get(args.deliverableId);
    if (!deliverable) {
      throw new Error("Deliverable not found");
    }

    const orgId =
      (identity as Record<string, unknown>).org_id ?? identity.tokenIdentifier;
    if (deliverable.orgId !== orgId) {
      throw new Error("Unauthorized: org mismatch");
    }

    if (deliverable.auditStatus !== "approved") {
      throw new Error(
        `Cannot deliver: audit status is "${deliverable.auditStatus}", must be "approved"`
      );
    }

    await ctx.db.patch(args.deliverableId, {
      deliveredAt: Date.now(),
    });

    await ctx.db.patch(deliverable.assignmentId, {
      status: "delivered" as const,
    });

    const client = await ctx.db.get(deliverable.clientId);
    const clientName = client?.name ?? "Cliente";

    await ctx.scheduler.runAfter(
      0,
      internal.functions.email.send.sendEmailInternal,
      {
        to: "cliente@projex-platform.com",
        subject: `Entregable disponible - ${deliverable.serviceName}`,
        html: `<p>Estimado ${clientName}, su entregable de ${deliverable.serviceName} para ${deliverable.month}/${deliverable.year} esta disponible.</p>`,
      }
    );

    return { success: true, deliverableId: args.deliverableId };
  },
});

// ─── Internal mutations (used by actions) ────────────────────────────

const aiLogValidator = v.array(
  v.object({
    role: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    timestamp: v.number(),
  })
);

/**
 * Internal: save a generated deliverable from the AI pipeline.
 */
export const saveGenerated = internalMutation({
  args: {
    orgId: v.string(),
    assignmentId: v.id("monthlyAssignments"),
    projServiceId: v.id("projectionServices"),
    clientId: v.id("clients"),
    serviceName: v.string(),
    month: v.number(),
    year: v.number(),
    shortContent: v.string(),
    longContent: v.string(),
    aiLog: aiLogValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("deliverables", {
      orgId: args.orgId,
      assignmentId: args.assignmentId,
      projServiceId: args.projServiceId,
      clientId: args.clientId,
      serviceName: args.serviceName,
      month: args.month,
      year: args.year,
      shortContent: args.shortContent,
      longContent: args.longContent,
      auditStatus: "pending",
      retryCount: 0,
      aiLog: args.aiLog,
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal: update audit results from the AI auditor.
 */
export const updateAudit = internalMutation({
  args: {
    id: v.id("deliverables"),
    auditStatus: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("corrected")
    ),
    auditFeedback: v.string(),
    aiLog: aiLogValidator,
  },
  handler: async (ctx, args) => {
    const deliverable = await ctx.db.get(args.id);
    if (!deliverable) {
      throw new Error("Entregable no encontrado.");
    }

    const existingLog = deliverable.aiLog ?? [];

    await ctx.db.patch(args.id, {
      auditStatus: args.auditStatus,
      auditFeedback: args.auditFeedback,
      aiLog: [...existingLog, ...args.aiLog],
    });
  },
});

/**
 * Internal: increment retry count for regeneration.
 */
export const incrementRetry = internalMutation({
  args: { id: v.id("deliverables") },
  handler: async (ctx, args) => {
    const deliverable = await ctx.db.get(args.id);
    if (!deliverable) return;
    await ctx.db.patch(args.id, { retryCount: deliverable.retryCount + 1 });
  },
});

/**
 * Internal: update deliverable after AI regeneration.
 */
export const updateAfterRegeneration = internalMutation({
  args: {
    id: v.id("deliverables"),
    shortContent: v.optional(v.string()),
    longContent: v.optional(v.string()),
    auditStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("corrected")
    ),
    auditFeedback: v.string(),
    aiLog: aiLogValidator,
  },
  handler: async (ctx, args) => {
    const deliverable = await ctx.db.get(args.id);
    if (!deliverable) {
      throw new Error("Entregable no encontrado.");
    }

    const existingLog = deliverable.aiLog ?? [];
    const patch: Record<string, unknown> = {
      auditStatus: args.auditStatus,
      auditFeedback: args.auditFeedback,
      aiLog: [...existingLog, ...args.aiLog],
    };

    if (args.shortContent !== undefined) {
      patch.shortContent = args.shortContent;
    }
    if (args.longContent !== undefined) {
      patch.longContent = args.longContent;
    }

    await ctx.db.patch(args.id, patch);
  },
});
