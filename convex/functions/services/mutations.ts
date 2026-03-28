import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgId, requireAdmin } from "../../lib/authHelpers";

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
