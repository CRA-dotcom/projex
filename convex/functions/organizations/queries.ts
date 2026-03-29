import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin, getOrgIdSafe } from "../../lib/authHelpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.db.query("organizations").collect();
  },
});

export const getByClerkOrgId = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    // Only return org if caller belongs to it
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();
    if (!org || org.clerkOrgId !== orgId) return null;
    return org;
  },
});

export const getById = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;
    const org = await ctx.db.get(args.id);
    if (!org || org.clerkOrgId !== orgId) return null;
    return org;
  },
});

export const getByIdForAdmin = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});
