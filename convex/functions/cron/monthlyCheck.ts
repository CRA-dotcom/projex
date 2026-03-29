import { internalAction, internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

/**
 * Internal query: fetch all active projections (system-level, no auth).
 */
export const listActiveProjections = internalQuery({
  args: {},
  handler: async (ctx) => {
    const projections = await ctx.db.query("projections").collect();
    return projections
      .filter((p) => p.status === "active")
      .map((p) => ({
        _id: p._id,
        orgId: p.orgId,
        clientId: p.clientId,
        year: p.year,
      }));
  },
});

/**
 * Internal query: fetch assignments for a specific month/year (system-level).
 */
export const listAssignmentsForMonth = internalQuery({
  args: { month: v.number(), year: v.number() },
  handler: async (ctx, args) => {
    const assignments = await ctx.db.query("monthlyAssignments").collect();
    return assignments
      .filter((a) => a.month === args.month && a.year === args.year)
      .map((a) => ({
        orgId: a.orgId,
        projectionId: a.projectionId,
        serviceName: a.serviceName,
        status: a.status,
        clientId: a.clientId,
      }));
  },
});

/**
 * Monthly cron action: review active projections and assignments due this month.
 * Runs on the 1st of each month.
 */
export const run: ReturnType<typeof internalAction> = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const activeProjections = await ctx.runQuery(
      internal.functions.cron.monthlyCheck.listActiveProjections
    );

    // Filter to projections for the current year
    const relevantProjections = activeProjections.filter(
      (p: { year: number }) => p.year === currentYear
    );

    const dueThisMonth = await ctx.runQuery(
      internal.functions.cron.monthlyCheck.listAssignmentsForMonth,
      { month: currentMonth, year: currentYear }
    );

    // Group by orgId
    const byOrg: Record<string, { total: number; pending: number }> = {};
    for (const a of dueThisMonth) {
      if (!byOrg[a.orgId]) {
        byOrg[a.orgId] = { total: 0, pending: 0 };
      }
      byOrg[a.orgId].total += 1;
      if (a.status === "pending") {
        byOrg[a.orgId].pending += 1;
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      month: currentMonth,
      year: currentYear,
      activeProjections: relevantProjections.length,
      assignmentsDueThisMonth: dueThisMonth.length,
      byOrg,
    };

    console.log(
      `[monthlyCheck] Month ${currentMonth}/${currentYear}: ${relevantProjections.length} active projections, ${dueThisMonth.length} assignments due`,
      summary
    );

    // TODO (Sprint 9): Send monthly summary email to org admins

    return summary;
  },
});
