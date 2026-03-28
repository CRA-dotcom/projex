import { mutation } from "../../_generated/server";
import { requireSuperAdmin } from "../../lib/authHelpers";

const DEFAULT_SERVICES = [
  { name: "Legal", type: "base" as const, minPct: 0.01, maxPct: 0.03, defaultPct: 0.02, sortOrder: 1 },
  { name: "Contable", type: "base" as const, minPct: 0.02, maxPct: 0.04, defaultPct: 0.03, sortOrder: 2 },
  { name: "TI", type: "base" as const, minPct: 0.04, maxPct: 0.07, defaultPct: 0.055, sortOrder: 3 },
  { name: "Marketing", type: "base" as const, minPct: 0.10, maxPct: 0.15, defaultPct: 0.125, sortOrder: 4 },
  { name: "RH", type: "base" as const, minPct: 0.03, maxPct: 0.05, defaultPct: 0.04, sortOrder: 5 },
  { name: "Admin", type: "base" as const, minPct: 0.03, maxPct: 0.05, defaultPct: 0.04, sortOrder: 6 },
  { name: "Comisiones", type: "comodin" as const, minPct: 0, maxPct: 0, defaultPct: 0, sortOrder: 7 },
  { name: "Logística", type: "comodin" as const, minPct: 0.04, maxPct: 0.08, defaultPct: 0.06, sortOrder: 8 },
  { name: "Construcción", type: "comodin" as const, minPct: 0.02, maxPct: 0.05, defaultPct: 0.035, sortOrder: 9 },
];

export const seedDefaultServices = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.query("services").filter((q) => q.eq(q.field("isDefault"), true)).collect();
    if (existing.length > 0) {
      return { seeded: false, message: "Los servicios por defecto ya existen." };
    }

    for (const service of DEFAULT_SERVICES) {
      await ctx.db.insert("services", {
        ...service,
        orgId: undefined,
        isDefault: true,
      });
    }

    return { seeded: true, message: `${DEFAULT_SERVICES.length} servicios creados.` };
  },
});
