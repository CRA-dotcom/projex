import { query } from "../../_generated/server";
import { getOrgIdSafe } from "../../lib/authHelpers";

export const listGlobal = query({
  args: {},
  handler: async (ctx) => {
    // Requires auth but returns global defaults
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];
    return await ctx.db
      .query("services")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .collect();
  },
});

export const listAllForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const { requireSuperAdmin } = await import("../../lib/authHelpers");
    try {
      await requireSuperAdmin(ctx);
    } catch {
      return [];
    }
    return await ctx.db.query("services").collect();
  },
});

export const listByOrg = query({
  args: {},
  handler: async (ctx) => {
    // Derives orgId from auth - never from client input
    const orgId = await getOrgIdSafe(ctx);
    if (!orgId) return [];

    // Check if the organization has assignedServiceIds
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", orgId))
      .unique();

    if (org?.assignedServiceIds && org.assignedServiceIds.length > 0) {
      // Return only the specifically assigned services
      const services = await Promise.all(
        org.assignedServiceIds.map((id) => ctx.db.get(id))
      );
      return services.filter((s) => s !== null);
    }

    // Fall back to org-specific overrides or global defaults
    const orgServices = await ctx.db
      .query("services")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    if (orgServices.length > 0) {
      return orgServices;
    }

    return await ctx.db
      .query("services")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .collect();
  },
});
