import { internalAction, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";

/**
 * Internal query: fetch all pending assignments (no auth required, system-level).
 */
export const listAllPendingAssignments = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Scan by status across all orgs — cron runs as system, no auth context
    const pending = await ctx.db.query("monthlyAssignments").collect();
    return pending
      .filter((a) => a.status === "pending")
      .map((a) => ({
        orgId: a.orgId,
        serviceName: a.serviceName,
        clientId: a.clientId,
        month: a.month,
        year: a.year,
      }));
  },
});

/**
 * Daily cron action: identify overdue assignments (pending for past months).
 */
export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const allPending = await ctx.runQuery(
      internal.functions.cron.overdueCheck.listAllPendingAssignments
    );

    // Filter to overdue (past months only)
    const overdue = allPending.filter(
      (a: { year: number; month: number }) =>
        a.year < currentYear ||
        (a.year === currentYear && a.month < currentMonth)
    );

    // Group by orgId for summary
    const byOrg: Record<string, number> = {};
    for (const a of overdue) {
      byOrg[a.orgId] = (byOrg[a.orgId] || 0) + 1;
    }

    const summary = {
      timestamp: now.toISOString(),
      totalOverdue: overdue.length,
      byOrg,
    };

    console.log(
      `[overdueCheck] Found ${overdue.length} overdue assignments across ${Object.keys(byOrg).length} org(s)`,
      summary
    );

    // TODO (Sprint 9): Send email notifications to org admins

    return summary;
  },
});
