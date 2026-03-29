import { query } from "../../_generated/server";
import { v } from "convex/values";

// NO auth required - accessed by token
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const questionnaire = await ctx.db
      .query("questionnaireResponses")
      .withIndex("by_accessToken", (q) => q.eq("accessToken", args.token))
      .first();
    if (!questionnaire) return null;

    // Get client name for display
    const client = await ctx.db.get(questionnaire.clientId);

    // Get org branding
    const branding = await ctx.db
      .query("orgBranding")
      .withIndex("by_orgId", (q) => q.eq("orgId", questionnaire.orgId))
      .first();

    return {
      ...questionnaire,
      clientName: client?.name ?? "Cliente",
      branding: branding ?? null,
    };
  },
});
