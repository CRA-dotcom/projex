import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgId, requireAuth } from "../../lib/authHelpers";

export const updateStatus = mutation({
  args: {
    id: v.id("monthlyAssignments"),
    status: v.union(
      v.literal("pending"),
      v.literal("info_received"),
      v.literal("in_progress"),
      v.literal("delivered")
    ),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const orgId = await getOrgId(ctx);
    const ma = await ctx.db.get(args.id);
    if (!ma || ma.orgId !== orgId) throw new Error("No encontrado.");
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateInvoiceStatus = mutation({
  args: {
    id: v.id("monthlyAssignments"),
    invoiceStatus: v.union(
      v.literal("not_invoiced"),
      v.literal("invoiced"),
      v.literal("paid")
    ),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const orgId = await getOrgId(ctx);
    const ma = await ctx.db.get(args.id);
    if (!ma || ma.orgId !== orgId) throw new Error("No encontrado.");
    await ctx.db.patch(args.id, { invoiceStatus: args.invoiceStatus });
  },
});

export const updateAmount = mutation({
  args: {
    id: v.id("monthlyAssignments"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const orgId = await getOrgId(ctx);
    const ma = await ctx.db.get(args.id);
    if (!ma || ma.orgId !== orgId) throw new Error("No encontrado.");
    await ctx.db.patch(args.id, { amount: args.amount });
  },
});
