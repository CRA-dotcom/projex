import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin } from "../../lib/authHelpers";

export const upsert = mutation({
  args: {
    orgId: v.string(),
    companyName: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    accentColor: v.optional(v.string()),
    fontFamily: v.string(),
    headerText: v.optional(v.string()),
    footerText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const existing = await ctx.db
      .query("orgBranding")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .unique();

    const data = {
      orgId: args.orgId,
      companyName: args.companyName,
      logoStorageId: args.logoStorageId,
      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,
      accentColor: args.accentColor,
      fontFamily: args.fontFamily,
      headerText: args.headerText,
      footerText: args.footerText,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("orgBranding", data);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
