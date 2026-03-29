import { internalAction, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

// Create test data and generate ONE deliverable
export const generateTestDeliverable = internalAction({
  args: {},
  handler: async (ctx) => {
    // Step 1: Get or create test data
    const testData = await ctx.runMutation(
      internal.functions.deliverables.testGenerate.setupTestData
    );

    if (!testData) {
      return { error: "No se pudo crear los datos de prueba" };
    }

    console.log("Test data ready:", testData);

    // Step 2: Call the real generateDeliverable action
    const { generateDeliverable } = await import("./actions");

    // We need to call it differently since it's a public action
    // Instead, let's call the AI directly here
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === "placeholder") {
      return { error: "ANTHROPIC_API_KEY no configurada" };
    }

    const anthropic = new Anthropic({ apiKey });

    // Build the prompt
    const prompt = `Eres un consultor profesional de ${testData.serviceName}.
Genera un entregable largo (deliverable_long) empresarial completo para:

EMPRESA: ${testData.clientName}
INDUSTRIA: ${testData.clientIndustry}
RFC: ${testData.clientRfc}
FACTURACIÓN ANUAL: $${testData.annualRevenue.toLocaleString()} MXN
SERVICIO: ${testData.serviceName}
MONTO ASIGNADO: $${testData.serviceAmount.toLocaleString()} MXN/año
AÑO: ${testData.year}

Genera un diagnóstico completo con:
1. Resumen Ejecutivo (hallazgos clave, métricas, nivel de madurez)
2. Análisis detallado por área (mínimo 5 hallazgos con evidencia)
3. Matriz de riesgos (5 riesgos con probabilidad e impacto)
4. Recomendaciones estratégicas (5 recomendaciones con plazo e impacto)
5. Plan de implementación (quick wins 0-30 días, corto plazo 30-90, mediano plazo 90-180)
6. KPIs sugeridos (5 indicadores con meta y método de medición)
7. Conclusiones y próximos pasos

El contenido debe ser profesional, específico a la industria ${testData.clientIndustry},
con datos numéricos realistas y recomendaciones accionables.
Responde en español. Genera el contenido en formato HTML con tags semánticos (h2, h3, p, table, ul).`;

    console.log("Calling Claude API...");
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const endTime = Date.now();
    const content = response.content[0].type === "text" ? response.content[0].text : "";
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costUsd =
      (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

    console.log(`Claude API response:
  Input tokens: ${inputTokens}
  Output tokens: ${outputTokens}
  Cost: $${costUsd.toFixed(4)} USD
  Time: ${endTime - startTime}ms`);

    // Step 3: Save the deliverable
    const deliverableId = await ctx.runMutation(
      internal.functions.deliverables.testGenerate.saveTestDeliverable,
      {
        orgId: testData.orgId,
        assignmentId: testData.assignmentId,
        projServiceId: testData.projServiceId,
        clientId: testData.clientId,
        serviceName: testData.serviceName,
        month: testData.month,
        year: testData.year,
        longContent: content,
        shortContent: `<h2>Resumen Ejecutivo - ${testData.serviceName}</h2><p>Entregable generado para ${testData.clientName}. Ver versión completa para detalles.</p>`,
        inputTokens,
        outputTokens,
        costUsd,
      }
    );

    return {
      deliverableId,
      inputTokens,
      outputTokens,
      costUsd: `$${costUsd.toFixed(4)} USD`,
      timeMs: endTime - startTime,
    };
  },
});

export const setupTestData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find existing client or use first one
    const clients = await ctx.db.query("clients").take(1);
    let client = clients[0];

    if (!client) {
      // Create a fictional client
      const clientId = await ctx.db.insert("clients", {
        orgId: "org_3BY3jSGEOQ0fvmriJzX6Y9ZS1gd",
        name: "Grupo Industrial Ficticio S.A. de C.V.",
        rfc: "GIF200115AB3",
        industry: "Manufactura",
        annualRevenue: 85000000,
        billingFrequency: "mensual",
        isArchived: false,
        createdAt: Date.now(),
      });
      client = (await ctx.db.get(clientId))!;
    }

    // Find existing projection or create one
    const projections = await ctx.db
      .query("projections")
      .withIndex("by_clientId", (q) => q.eq("clientId", client._id))
      .take(1);
    let projection = projections[0];

    if (!projection) {
      const projId = await ctx.db.insert("projections", {
        orgId: client.orgId,
        clientId: client._id,
        year: 2026,
        annualSales: client.annualRevenue,
        totalBudget: 30000000,
        commissionRate: 0.02,
        seasonalityData: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          monthlySales: client.annualRevenue / 12,
          feFactor: 1,
        })),
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      projection = (await ctx.db.get(projId))!;
    }

    // Find or create a projection service (Legal)
    const projServices = await ctx.db
      .query("projectionServices")
      .withIndex("by_projectionId", (q) =>
        q.eq("projectionId", projection._id)
      )
      .take(1);
    let projService = projServices[0];

    if (!projService) {
      // Find Legal service
      const services = await ctx.db.query("services").collect();
      const legalService = services.find((s) => s.name === "Legal");
      if (!legalService) return null;

      const psId = await ctx.db.insert("projectionServices", {
        orgId: client.orgId,
        projectionId: projection._id,
        serviceId: legalService._id,
        serviceName: "Legal",
        chosenPct: 0.02,
        isActive: true,
        annualAmount: 600000,
        normalizedWeight: 0.15,
      });
      projService = (await ctx.db.get(psId))!;
    }

    // Find or create monthly assignment
    const assignments = await ctx.db
      .query("monthlyAssignments")
      .withIndex("by_projServiceId", (q) =>
        q.eq("projServiceId", projService._id)
      )
      .take(1);
    let assignment = assignments[0];

    if (!assignment) {
      const maId = await ctx.db.insert("monthlyAssignments", {
        orgId: client.orgId,
        projServiceId: projService._id,
        projectionId: projection._id,
        clientId: client._id,
        serviceName: projService.serviceName,
        month: 3,
        year: 2026,
        amount: 50000,
        feFactor: 1,
        status: "in_progress",
        invoiceStatus: "not_invoiced",
      });
      assignment = (await ctx.db.get(maId))!;
    }

    return {
      orgId: client.orgId,
      clientId: client._id,
      clientName: client.name,
      clientIndustry: client.industry,
      clientRfc: client.rfc,
      annualRevenue: client.annualRevenue,
      projectionId: projection._id,
      projServiceId: projService._id,
      serviceName: projService.serviceName,
      serviceAmount: projService.annualAmount,
      assignmentId: assignment._id,
      month: assignment.month,
      year: assignment.year,
    };
  },
});

export const saveTestDeliverable = internalMutation({
  args: {
    orgId: v.string(),
    assignmentId: v.id("monthlyAssignments"),
    projServiceId: v.id("projectionServices"),
    clientId: v.id("clients"),
    serviceName: v.string(),
    month: v.number(),
    year: v.number(),
    longContent: v.string(),
    shortContent: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("deliverables", {
      orgId: args.orgId,
      assignmentId: args.assignmentId,
      projServiceId: args.projServiceId,
      clientId: args.clientId,
      serviceName: args.serviceName,
      month: args.month,
      year: args.year,
      shortContent: args.shortContent,
      longContent: args.longContent,
      auditStatus: "pending",
      retryCount: 0,
      aiLog: [
        {
          role: "creator",
          model: "claude-sonnet-4-20250514",
          inputTokens: args.inputTokens,
          outputTokens: args.outputTokens,
          costUsd: args.costUsd,
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
    });
  },
});
