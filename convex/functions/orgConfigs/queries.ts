import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgIdSafe, requireSuperAdmin } from "../../lib/authHelpers";

export const getByOrgId = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;
    return await ctx.db
      .query("orgConfigs")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .unique();
  },
});

export const getByOrgIdForAdmin = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    try {
      await requireSuperAdmin(ctx);
    } catch {
      return null;
    }
    return await ctx.db
      .query("orgConfigs")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .unique();
  },
});
