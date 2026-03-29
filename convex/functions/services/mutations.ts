import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgId, requireAdmin, requireSuperAdmin } from "../../lib/authHelpers";

export const createOrgOverride = mutation({
  args: {
    sourceServiceId: v.id("services"),
    minPct: v.number(),
    maxPct: v.number(),
    defaultPct: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = await getOrgId(ctx);
    const source = await ctx.db.get(args.sourceServiceId);
    if (!source) throw new Error("Servicio base no encontrado.");

    // Check if override already exists
    const existing = await ctx.db
      .query("services")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const existingOverride = existing.find((s) => s.name === source.name);

    if (existingOverride) {
      await ctx.db.patch(existingOverride._id, {
        minPct: args.minPct,
        maxPct: args.maxPct,
        defaultPct: args.defaultPct,
      });
      return existingOverride._id;
    }

    return await ctx.db.insert("services", {
      orgId,
      name: source.name,
      type: source.type,
      minPct: args.minPct,
      maxPct: args.maxPct,
      defaultPct: args.defaultPct,
      isDefault: false,
      sortOrder: source.sortOrder,
    });
  },
});

export const resetToDefault = mutation({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = await getOrgId(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (!service || service.orgId !== orgId || service.isDefault) {
      throw new Error("No se puede resetear este servicio.");
    }
    await ctx.db.delete(args.serviceId);
  },
});

/**
 * Super Admin: Create a custom service (optionally for a specific org).
 */
export const createCustomForAdmin = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("base"), v.literal("comodin")),
    orgId: v.optional(v.string()),
    minPct: v.number(),
    maxPct: v.number(),
    defaultPct: v.number(),
    isCommission: v.optional(v.boolean()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    return await ctx.db.insert("services", {
      orgId: args.orgId,
      name: args.name,
      type: args.type,
      minPct: args.minPct,
      maxPct: args.maxPct,
      defaultPct: args.defaultPct,
      isDefault: !args.orgId,
      isCommission: args.isCommission ?? false,
      isCustom: !!args.orgId,
      sortOrder: args.sortOrder,
    });
  },
});

/**
 * Super Admin: Update benchmarks and isCommission on any service.
 */
export const updateForAdmin = mutation({
  args: {
    serviceId: v.id("services"),
    minPct: v.optional(v.number()),
    maxPct: v.optional(v.number()),
    defaultPct: v.optional(v.number()),
    isCommission: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (!service) throw new Error("Servicio no encontrado.");

    const patch: Record<string, unknown> = {};
    if (args.minPct !== undefined) patch.minPct = args.minPct;
    if (args.maxPct !== undefined) patch.maxPct = args.maxPct;
    if (args.defaultPct !== undefined) patch.defaultPct = args.defaultPct;
    if (args.isCommission !== undefined) patch.isCommission = args.isCommission;

    await ctx.db.patch(args.serviceId, patch);
    return args.serviceId;
  },
});
