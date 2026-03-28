import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgIdSafe } from "../../lib/authHelpers";

export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    search: v.optional(v.string()),
    industry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    const identity = await ctx.auth.getUserIdentity();
    const role = (identity?.orgRole as string) ?? "org:member";

    let clients = await ctx.db
      .query("clients")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    if (!args.includeArchived) {
      clients = clients.filter((c) => !c.isArchived);
    }

    if (role === "org:member") {
      clients = clients.filter((c) => c.assignedTo === identity?.subject);
    }

    if (args.industry) {
      clients = clients.filter((c) => c.industry === args.industry);
    }

    if (args.search) {
      const term = args.search.toLowerCase();
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.rfc.toLowerCase().includes(term)
      );
    }

    return clients.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;
    const client = await ctx.db.get(args.id);
    if (!client || client.orgId !== orgId) return null;
    return client;
  },
});

export const getIndustries = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    const industries = [...new Set(clients.map((c) => c.industry))];
    return industries.sort();
  },
});
