import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgId, requireAuth } from "../../lib/authHelpers";

export const toggleActive = mutation({
  args: {
    id: v.id("projectionServices"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const orgId = await getOrgId(ctx);
    const ps = await ctx.db.get(args.id);
    if (!ps || ps.orgId !== orgId) throw new Error("No encontrado.");
    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});

export const updateChosenPct = mutation({
  args: {
    id: v.id("projectionServices"),
    chosenPct: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const orgId = await getOrgId(ctx);
    const ps = await ctx.db.get(args.id);
    if (!ps || ps.orgId !== orgId) throw new Error("No encontrado.");
    await ctx.db.patch(args.id, { chosenPct: args.chosenPct });
  },
});
