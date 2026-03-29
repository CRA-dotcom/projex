import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

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

    // Verify org access
    const orgId = (identity as any).org_id ?? identity.tokenIdentifier;
    if (deliverable.orgId !== orgId) {
      throw new Error("Unauthorized: org mismatch");
    }

    // Verify audit status is approved
    if (deliverable.auditStatus !== "approved") {
      throw new Error(
        `Cannot deliver: audit status is "${deliverable.auditStatus}", must be "approved"`
      );
    }

    // Set deliveredAt
    await ctx.db.patch(args.deliverableId, {
      deliveredAt: Date.now(),
    });

    // Update corresponding monthlyAssignment status to "delivered"
    await ctx.db.patch(deliverable.assignmentId, {
      status: "delivered" as const,
    });

    // Resolve client name for the email
    const client = await ctx.db.get(deliverable.clientId);
    const clientName = client?.name ?? "Cliente";

    // Schedule email notification to client
    await ctx.scheduler.runAfter(
      0,
      internal.functions.email.send.sendEmailInternal,
      {
        to: "cliente@projex-platform.com", // In production, resolve client email from Clerk/contacts
        subject: `Entregable disponible - ${deliverable.serviceName}`,
        html: `<p>Estimado ${clientName}, su entregable de ${deliverable.serviceName} para ${deliverable.month}/${deliverable.year} está disponible.</p>`,
      }
    );

    return { success: true, deliverableId: args.deliverableId };
  },
});
