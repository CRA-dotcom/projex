import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgIdSafe, requireSuperAdmin } from "../../lib/authHelpers";

/**
 * Get branding for the current user's org (org admin use).
 */
export const getByOrgId = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;

    return await ctx.db
      .query("orgBranding")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .unique();
  },
});

/**
 * Get branding for a specific org (super admin use).
 */
export const getByOrgIdForAdmin = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    return await ctx.db
      .query("orgBranding")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .unique();
  },
});

/**
 * Get the logo URL for a branding record (super admin use).
 */
export const getLogoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
