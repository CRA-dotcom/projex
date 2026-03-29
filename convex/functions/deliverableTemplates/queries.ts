import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin } from "../../lib/authHelpers";

export const list = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("quotation"),
        v.literal("contract"),
        v.literal("deliverable_short"),
        v.literal("deliverable_long"),
        v.literal("questionnaire")
      )
    ),
    orgId: v.optional(v.string()),
    serviceId: v.optional(v.id("services")),
  },
  handler: async (ctx, args) => {
    try {
      await requireSuperAdmin(ctx);
    } catch {
      return [];
    }

    let results;

    if (args.type) {
      results = await ctx.db
        .query("deliverableTemplates")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    } else if (args.serviceId) {
      results = await ctx.db
        .query("deliverableTemplates")
        .withIndex("by_serviceId", (q) => q.eq("serviceId", args.serviceId!))
        .collect();
    } else if (args.orgId) {
      results = await ctx.db
        .query("deliverableTemplates")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId!))
        .collect();
    } else {
      results = await ctx.db.query("deliverableTemplates").collect();
    }

    // Apply additional filters if multiple were provided
    if (args.type && args.orgId) {
      results = results.filter((t) => t.orgId === args.orgId);
    }
    if (args.type && args.serviceId) {
      results = results.filter((t) => t.serviceId === args.serviceId);
    }
    if (args.orgId && args.serviceId && !args.type) {
      results = results.filter((t) => t.serviceId === args.serviceId);
    }

    return results;
  },
});

export const getById = query({
  args: { id: v.id("deliverableTemplates") },
  handler: async (ctx, args) => {
    try {
      await requireSuperAdmin(ctx);
    } catch {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});
