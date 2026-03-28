import { query } from "../../_generated/server";
import { getOrgIdSafe } from "../../lib/authHelpers";

export const listGlobal = query({
  args: {},
  handler: async (ctx) => {
    // Requires auth but returns global defaults
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];
    return await ctx.db
      .query("services")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .collect();
  },
});

export const listByOrg = query({
  args: {},
  handler: async (ctx) => {
    // Derives orgId from auth - never from client input
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    const orgServices = await ctx.db
      .query("services")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    if (orgServices.length > 0) {
      return orgServices;
    }

    return await ctx.db
      .query("services")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .collect();
  },
});
