import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgIdSafe } from "../../lib/authHelpers";

export const getByProjection = query({
  args: { projectionId: v.id("projections") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;

    const questionnaire = await ctx.db
      .query("questionnaireResponses")
      .withIndex("by_projectionId", (q) =>
        q.eq("projectionId", args.projectionId)
      )
      .first();

    if (!questionnaire || questionnaire.orgId !== orgId) return null;
    return questionnaire;
  },
});

export const getById = query({
  args: { id: v.id("questionnaireResponses") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;

    const questionnaire = await ctx.db.get(args.id);
    if (!questionnaire || questionnaire.orgId !== orgId) return null;
    return questionnaire;
  },
});

export const getByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    const questionnaires = await ctx.db
      .query("questionnaireResponses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    return questionnaires
      .filter((q) => q.orgId === orgId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listByOrg = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("sent"),
        v.literal("in_progress"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    let questionnaires;
    if (args.status) {
      questionnaires = await ctx.db
        .query("questionnaireResponses")
        .withIndex("by_orgId_status", (q) =>
          q.eq("orgId", orgId).eq("status", args.status!)
        )
        .collect();
    } else {
      questionnaires = await ctx.db
        .query("questionnaireResponses")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .collect();
    }

    return questionnaires.sort((a, b) => b.createdAt - a.createdAt);
  },
});
