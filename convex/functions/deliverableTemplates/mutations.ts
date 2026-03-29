import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin } from "../../lib/authHelpers";

const variableValidator = v.object({
  key: v.string(),
  label: v.string(),
  source: v.union(
    v.literal("client"),
    v.literal("projection"),
    v.literal("service"),
    v.literal("ai"),
    v.literal("manual")
  ),
  required: v.boolean(),
});

const typeValidator = v.union(
  v.literal("quotation"),
  v.literal("contract"),
  v.literal("deliverable_short"),
  v.literal("deliverable_long"),
  v.literal("questionnaire")
);

export const create = mutation({
  args: {
    orgId: v.optional(v.string()),
    serviceId: v.optional(v.id("services")),
    serviceName: v.string(),
    type: typeValidator,
    name: v.string(),
    htmlTemplate: v.string(),
    variables: v.array(variableValidator),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const now = Date.now();
    return await ctx.db.insert("deliverableTemplates", {
      orgId: args.orgId,
      serviceId: args.serviceId,
      serviceName: args.serviceName,
      type: args.type,
      name: args.name,
      htmlTemplate: args.htmlTemplate,
      variables: args.variables,
      version: 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("deliverableTemplates"),
    name: v.optional(v.string()),
    htmlTemplate: v.optional(v.string()),
    variables: v.optional(v.array(variableValidator)),
    serviceName: v.optional(v.string()),
    serviceId: v.optional(v.id("services")),
    orgId: v.optional(v.string()),
    type: v.optional(typeValidator),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Template no encontrado.");

    const patch: Record<string, unknown> = {
      version: existing.version + 1,
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) patch.name = args.name;
    if (args.htmlTemplate !== undefined) patch.htmlTemplate = args.htmlTemplate;
    if (args.variables !== undefined) patch.variables = args.variables;
    if (args.serviceName !== undefined) patch.serviceName = args.serviceName;
    if (args.serviceId !== undefined) patch.serviceId = args.serviceId;
    if (args.orgId !== undefined) patch.orgId = args.orgId;
    if (args.type !== undefined) patch.type = args.type;

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const toggleActive = mutation({
  args: { id: v.id("deliverableTemplates") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Template no encontrado.");

    await ctx.db.patch(args.id, {
      isActive: !existing.isActive,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const duplicate = mutation({
  args: {
    id: v.id("deliverableTemplates"),
    orgId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Template no encontrado.");

    const now = Date.now();
    return await ctx.db.insert("deliverableTemplates", {
      orgId: args.orgId ?? existing.orgId,
      serviceId: existing.serviceId,
      serviceName: existing.serviceName,
      type: existing.type,
      name: args.name ?? `${existing.name} (copia)`,
      htmlTemplate: existing.htmlTemplate,
      variables: existing.variables,
      version: 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});
