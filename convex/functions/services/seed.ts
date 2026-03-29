import { internalMutation } from "../../_generated/server";

const DEFAULT_SERVICES = [
  { name: "Legal", type: "base" as const, minPct: 0.01, maxPct: 0.03, defaultPct: 0.02, isCommission: false, isCustom: false, sortOrder: 1 },
  { name: "Contable", type: "base" as const, minPct: 0.02, maxPct: 0.04, defaultPct: 0.03, isCommission: false, isCustom: false, sortOrder: 2 },
  { name: "TI", type: "base" as const, minPct: 0.04, maxPct: 0.07, defaultPct: 0.055, isCommission: false, isCustom: false, sortOrder: 3 },
  { name: "Marketing", type: "base" as const, minPct: 0.10, maxPct: 0.15, defaultPct: 0.125, isCommission: false, isCustom: false, sortOrder: 4 },
  { name: "RH", type: "base" as const, minPct: 0.03, maxPct: 0.05, defaultPct: 0.04, isCommission: false, isCustom: false, sortOrder: 5 },
  { name: "Admin", type: "base" as const, minPct: 0.03, maxPct: 0.05, defaultPct: 0.04, isCommission: false, isCustom: false, sortOrder: 6 },
  { name: "Comisiones", type: "comodin" as const, minPct: 0, maxPct: 0, defaultPct: 0, isCommission: true, isCustom: false, sortOrder: 7 },
  { name: "Logística", type: "comodin" as const, minPct: 0.04, maxPct: 0.08, defaultPct: 0.06, isCommission: false, isCustom: false, sortOrder: 8 },
  { name: "Construcción", type: "comodin" as const, minPct: 0.02, maxPct: 0.05, defaultPct: 0.035, isCommission: false, isCustom: false, sortOrder: 9 },
];

export const seedDefaultServices = internalMutation({
  args: {},
  handler: async (ctx) => {
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
