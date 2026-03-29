import { internalMutation } from "../../_generated/server";

export const backfillServiceFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const services = await ctx.db.query("services").collect();
    let updated = 0;

    for (const service of services) {
      const needsIsCommission = (service as any).isCommission === undefined;
      const needsIsCustom = (service as any).isCustom === undefined;

      if (needsIsCommission || needsIsCustom) {
        await ctx.db.patch(service._id, {
          isCommission: service.name === "Comisiones",
          isCustom: false,
        });
        updated++;
      }
    }

    return { updated, total: services.length };
  },
});
