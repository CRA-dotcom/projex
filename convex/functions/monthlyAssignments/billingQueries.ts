import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgIdSafe } from "../../lib/authHelpers";

/**
 * S6-06: Billing Frequency Breakdown
 * Given a client and month, returns the monthly assignments
 * broken down by the client's billing frequency.
 */
export const getBillingBreakdown = query({
  args: {
    clientId: v.id("clients"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    // Get client to determine billing frequency
    const client = await ctx.db.get(args.clientId);
    if (!client || client.orgId !== orgId) return [];

    // Get all monthly assignments for this client and month
    const assignments = await ctx.db
      .query("monthlyAssignments")
      .withIndex("by_clientId_month", (q) =>
        q.eq("clientId", args.clientId).eq("month", args.month)
      )
      .collect()
      .then((mas) => mas.filter((m) => m.orgId === orgId && m.year === args.year));

    const frequency = client.billingFrequency;
    const periods =
      frequency === "semanal" ? 4 : frequency === "quincenal" ? 2 : 1;

    const frequencyLabel =
      frequency === "semanal"
        ? "Semanal"
        : frequency === "quincenal"
          ? "Quincenal"
          : "Mensual";

    return assignments.map((assignment) => {
      const periodAmount = assignment.amount / periods;
      const breakdown = Array.from({ length: periods }, (_, i) => ({
        period: i + 1,
        label: `${frequencyLabel} ${i + 1}`,
        amount: Math.round(periodAmount * 100) / 100,
      }));

      return {
        ...assignment,
        clientName: client.name,
        billingFrequency: frequency,
        frequencyLabel,
        periods,
        breakdown,
      };
    });
  },
});

/**
 * S6-07: List all monthly assignments for the org with invoice tracking info.
 * Supports optional filters by year/month, service, and invoiceStatus.
 */
export const listForInvoiceTracking = query({
  args: {
    year: v.optional(v.number()),
    month: v.optional(v.number()),
    serviceName: v.optional(v.string()),
    invoiceStatus: v.optional(
      v.union(
        v.literal("not_invoiced"),
        v.literal("invoiced"),
        v.literal("paid")
      )
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    let assignments;

    // Use the most selective index available
    if (args.invoiceStatus) {
      assignments = await ctx.db
        .query("monthlyAssignments")
        .withIndex("by_orgId_invoiceStatus", (q) =>
          q.eq("orgId", orgId).eq("invoiceStatus", args.invoiceStatus!)
        )
        .collect();
    } else if (args.year && args.month) {
      assignments = await ctx.db
        .query("monthlyAssignments")
        .withIndex("by_orgId_year_month", (q) =>
          q.eq("orgId", orgId).eq("year", args.year!).eq("month", args.month!)
        )
        .collect();
    } else {
      assignments = await ctx.db
        .query("monthlyAssignments")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .collect();
    }

    // Apply remaining filters in memory
    let filtered = assignments;

    if (args.year && !(args.invoiceStatus === undefined && args.month)) {
      filtered = filtered.filter((a) => a.year === args.year);
    }
    if (args.month && args.invoiceStatus) {
      filtered = filtered.filter((a) => a.month === args.month);
    }
    if (args.serviceName) {
      filtered = filtered.filter((a) => a.serviceName === args.serviceName);
    }

    // Enrich with client names
    const clientIds = [...new Set(filtered.map((a) => a.clientId))];
    const clients = await Promise.all(clientIds.map((id) => ctx.db.get(id)));
    const clientMap = new Map(
      clients.filter(Boolean).map((c) => [c!._id, c!.name])
    );

    return filtered.map((a) => ({
      ...a,
      clientName: clientMap.get(a.clientId) ?? "Cliente desconocido",
    }));
  },
});
