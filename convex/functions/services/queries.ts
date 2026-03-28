import { query } from "../../_generated/server";
import { v } from "convex/values";

export const listGlobal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("services")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .collect();
  },
});

export const listByOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    const orgServices = await ctx.db
      .query("services")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
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
