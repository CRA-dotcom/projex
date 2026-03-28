import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgId, requireAuth } from "../../lib/authHelpers";

export const create = mutation({
  args: {
    name: v.string(),
    rfc: v.string(),
    industry: v.string(),
    annualRevenue: v.number(),
    billingFrequency: v.union(
      v.literal("semanal"),
      v.literal("quincenal"),
      v.literal("mensual")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const orgId = await getOrgId(ctx);

    return await ctx.db.insert("clients", {
      orgId,
      name: args.name,
      rfc: args.rfc.toUpperCase(),
      industry: args.industry,
      annualRevenue: args.annualRevenue,
      billingFrequency: args.billingFrequency,
      isArchived: false,
      assignedTo: identity.subject,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.optional(v.string()),
    rfc: v.optional(v.string()),
    industry: v.optional(v.string()),
    annualRevenue: v.optional(v.number()),
    billingFrequency: v.optional(
      v.union(
        v.literal("semanal"),
        v.literal("quincenal"),
        v.literal("mensual")
      )
    ),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);
    const client = await ctx.db.get(args.id);
    if (!client || client.orgId !== orgId) {
      throw new Error("Cliente no encontrado.");
    }

    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (filtered.rfc) {
      filtered.rfc = (filtered.rfc as string).toUpperCase();
    }

    await ctx.db.patch(id, filtered);
  },
});

export const archive = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);
    const client = await ctx.db.get(args.id);
    if (!client || client.orgId !== orgId) {
      throw new Error("Cliente no encontrado.");
    }
    await ctx.db.patch(args.id, { isArchived: true });
  },
});

export const restore = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);
    const client = await ctx.db.get(args.id);
    if (!client || client.orgId !== orgId) {
      throw new Error("Cliente no encontrado.");
    }
    await ctx.db.patch(args.id, { isArchived: false });
  },
});
