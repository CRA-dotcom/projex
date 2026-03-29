import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgIdSafe } from "../../lib/authHelpers";

export const getById = query({
  args: { id: v.id("quotations") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;
    const quotation = await ctx.db.get(args.id);
    if (!quotation || quotation.orgId !== orgId) return null;
    return quotation;
  },
});

export const getByProjService = query({
  args: { projServiceId: v.id("projectionServices") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;

    const quotation = await ctx.db
      .query("quotations")
      .withIndex("by_projServiceId", (q) =>
        q.eq("projServiceId", args.projServiceId)
      )
      .first();

    if (!quotation || quotation.orgId !== orgId) return null;
    return quotation;
  },
});

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    const quotations = await ctx.db
      .query("quotations")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    return quotations
      .filter((q) => q.orgId === orgId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listByOrg = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("sent"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    let quotations;
    if (args.status) {
      quotations = await ctx.db
        .query("quotations")
        .withIndex("by_orgId_status", (q) =>
          q.eq("orgId", orgId).eq("status", args.status!)
        )
        .collect();
    } else {
      quotations = await ctx.db
        .query("quotations")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .collect();
    }

    return quotations.sort((a, b) => b.createdAt - a.createdAt);
  },
});
