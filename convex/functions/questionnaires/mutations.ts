import { mutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { getOrgId } from "../../lib/authHelpers";

// Default questions per service
const DEFAULT_QUESTIONS = [
  {
    key: "info_general",
    text: "Información general del servicio requerido",
  },
  {
    key: "documentos",
    text: "Documentos requeridos para este servicio",
  },
  {
    key: "observaciones",
    text: "Observaciones especiales o requerimientos adicionales",
  },
];

export const generate = mutation({
  args: {
    projectionId: v.id("projections"),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);

    // Verify projection belongs to org
    const projection = await ctx.db.get(args.projectionId);
    if (!projection || projection.orgId !== orgId) {
      throw new Error("Proyección no encontrada.");
    }

    // Check if questionnaire already exists
    const existing = await ctx.db
      .query("questionnaireResponses")
      .withIndex("by_projectionId", (q) =>
        q.eq("projectionId", args.projectionId)
      )
      .first();
    if (existing) {
      throw new Error("Ya existe un cuestionario para esta proyección.");
    }

    // Get active projection services
    const projServices = await ctx.db
      .query("projectionServices")
      .withIndex("by_projectionId_active", (q) =>
        q.eq("projectionId", args.projectionId).eq("isActive", true)
      )
      .collect();

    if (projServices.length === 0) {
      throw new Error("No hay servicios activos en esta proyección.");
    }

    // Build questions: for each default question, aggregate all service names
    // Since questions are generic and apply to all services, we deduplicate
    // by question key, and list all service names on each question.
    const allServiceNames = projServices.map((ps) => ps.serviceName);

    // For deduplication: each generic question appears once with all service names
    const responses = DEFAULT_QUESTIONS.map((q, idx) => ({
      questionId: `q_${idx + 1}_${q.key}`,
      questionText: q.text,
      answer: "",
      serviceNames: allServiceNames,
    }));

    // Also add per-service specific questions for differentiation
    for (const ps of projServices) {
      responses.push({
        questionId: `q_svc_${ps._id}_detalle`,
        questionText: `Detalle específico para el servicio: ${ps.serviceName}`,
        answer: "",
        serviceNames: [ps.serviceName],
      });
    }

    const id = await ctx.db.insert("questionnaireResponses", {
      orgId,
      clientId: projection.clientId,
      projectionId: args.projectionId,
      responses,
      status: "draft",
      createdAt: Date.now(),
    });

    return id;
  },
});

export const updateResponses = mutation({
  args: {
    id: v.id("questionnaireResponses"),
    responses: v.array(
      v.object({
        questionId: v.string(),
        questionText: v.string(),
        answer: v.string(),
        serviceNames: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);
    const questionnaire = await ctx.db.get(args.id);
    if (!questionnaire || questionnaire.orgId !== orgId) {
      throw new Error("Cuestionario no encontrado.");
    }
    if (questionnaire.status === "completed") {
      throw new Error("No se puede editar un cuestionario completado.");
    }

    // Update status to in_progress if it was sent
    const newStatus =
      questionnaire.status === "sent" ? "in_progress" : questionnaire.status;

    await ctx.db.patch(args.id, {
      responses: args.responses,
      status: newStatus as "draft" | "sent" | "in_progress" | "completed",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("questionnaireResponses"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);
    const questionnaire = await ctx.db.get(args.id);
    if (!questionnaire || questionnaire.orgId !== orgId) {
      throw new Error("Cuestionario no encontrado.");
    }

    const patch: Record<string, unknown> = { status: args.status };
    if (args.status === "completed") {
      patch.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, patch);
  },
});

export const submit = mutation({
  args: {
    id: v.id("questionnaireResponses"),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx);
    const questionnaire = await ctx.db.get(args.id);
    if (!questionnaire || questionnaire.orgId !== orgId) {
      throw new Error("Cuestionario no encontrado.");
    }
    if (questionnaire.status === "completed") {
      throw new Error("Este cuestionario ya fue completado.");
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Get client info for notification email
    const client = await ctx.db.get(questionnaire.clientId);
    const clientName = client?.name ?? "Cliente";

    // Get the assigned ejecutivo email
    const assignedTo = client?.assignedTo;
    if (assignedTo) {
      // The identity subject is the user ID; for notification we need their email.
      // We'll send a generic notification. In production, resolve user email from Clerk.
      // For now, schedule email with a placeholder that can be configured.
      await ctx.scheduler.runAfter(
        0,
        internal.functions.email.send.sendEmailInternal,
        {
          to: "ejecutivo@projex-platform.com", // In production, resolve from Clerk
          subject: `Cuestionario completado - ${clientName}`,
          html: `<p>El cliente <strong>${clientName}</strong> ha completado su cuestionario.</p><p>Revisa las respuestas en la plataforma.</p>`,
        }
      );
    }

    return { success: true };
  },
});
