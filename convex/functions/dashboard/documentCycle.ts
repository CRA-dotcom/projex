import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getOrgIdSafe } from "../../lib/authHelpers";

/**
 * S9-04: Document Cycle Tracking.
 * Returns the full document pipeline per service for a given client.
 * Pipeline: Projection -> Quotation -> Contract -> Deliverables
 */
export const getDocumentCycle = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return null;

    const client = await ctx.db.get(args.clientId);
    if (!client || client.orgId !== orgId) return null;

    // Get active (or draft) projections for this client
    const projections = await ctx.db
      .query("projections")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const activeProjections = projections.filter(
      (p) => p.status === "active" || p.status === "draft"
    );

    if (activeProjections.length === 0) {
      return {
        clientName: client.name,
        services: [],
      };
    }

    // Use the most recent active projection (or draft if no active)
    const projection =
      activeProjections.find((p) => p.status === "active") ??
      activeProjections[0];

    // Get projection services
    const projServices = await ctx.db
      .query("projectionServices")
      .withIndex("by_projectionId", (q) =>
        q.eq("projectionId", projection._id)
      )
      .collect();

    const activeServices = projServices.filter((ps) => ps.isActive);

    // Get all quotations, contracts, deliverables for this client in bulk
    const [quotations, contracts, deliverables] = await Promise.all([
      ctx.db
        .query("quotations")
        .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
        .collect(),
      ctx.db
        .query("contracts")
        .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
        .collect(),
      ctx.db
        .query("deliverables")
        .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
        .collect(),
    ]);

    // Build per-service pipeline
    const services = activeServices.map((ps) => {
      // Find quotation for this projService
      const quotation = quotations.find(
        (q) => q.projServiceId === ps._id
      );

      // Find contract for this projService
      const contract = contracts.find(
        (c) => c.projServiceId === ps._id
      );

      // Find deliverables for this projService
      const serviceDeliverables = deliverables
        .filter((d) => d.projServiceId === ps._id)
        .sort((a, b) => a.month - b.month)
        .map((d) => ({
          id: d._id,
          month: d.month,
          year: d.year,
          status: d.auditStatus,
          deliveredAt: d.deliveredAt ?? null,
        }));

      return {
        projServiceId: ps._id,
        serviceName: ps.serviceName,
        projection: {
          id: projection._id,
          status: projection.status,
          year: projection.year,
          amount: ps.annualAmount,
        },
        quotation: quotation
          ? {
              id: quotation._id,
              status: quotation.status,
              createdAt: quotation.createdAt,
            }
          : null,
        contract: contract
          ? {
              id: contract._id,
              status: contract.status,
              signedAt: contract.signedAt ?? null,
              createdAt: contract.createdAt,
            }
          : null,
        deliverables: serviceDeliverables,
      };
    });

    return {
      clientName: client.name,
      services,
    };
  },
});
