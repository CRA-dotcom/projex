"use node";

import { action, internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

// ─── Constants ───────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;
const AI_UNAVAILABLE_PLACEHOLDER = "[AI no disponible — configurar API key]";

// Cost estimate per token (Claude Sonnet pricing as of 2025)
const INPUT_COST_PER_TOKEN = 3 / 1_000_000; // $3 per 1M input tokens
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000; // $15 per 1M output tokens

// ─── Types ───────────────────────────────────────────────────────────

type AiLogEntry = {
  role: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: number;
};

type TemplateVariable = {
  key: string;
  label: string;
  source: string;
  required: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "placeholder") {
    console.warn(
      "[AI Pipeline] ANTHROPIC_API_KEY not configured. Using placeholder content."
    );
    return null;
  }
  return new Anthropic({ apiKey });
}

function resolveNonAiVariables(
  html: string,
  variables: TemplateVariable[],
  context: {
    client?: Record<string, unknown>;
    projection?: Record<string, unknown>;
    service?: Record<string, unknown>;
  }
): { html: string; aiVariables: TemplateVariable[] } {
  const aiVariables: TemplateVariable[] = [];
  let result = html;

  for (const variable of variables) {
    const { key, source } = variable;
    const placeholder = `{{${key}}}`;

    if (source === "ai") {
      aiVariables.push(variable);
      continue;
    }

    let value: string | undefined;

    if (source === "client" && context.client && key in context.client) {
      const raw = context.client[key];
      value = typeof raw === "number" ? raw.toLocaleString("es-MX") : String(raw ?? "");
    } else if (source === "projection" && context.projection && key in context.projection) {
      const raw = context.projection[key];
      value = typeof raw === "number" ? raw.toLocaleString("es-MX") : String(raw ?? "");
    } else if (source === "service" && context.service && key in context.service) {
      const raw = context.service[key];
      value = typeof raw === "number" ? raw.toLocaleString("es-MX") : String(raw ?? "");
    }

    if (value !== undefined) {
      result = result.replace(new RegExp(escapeRegex(placeholder), "g"), value);
    }
  }

  return { html: result, aiVariables };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function callClaudeWithRetry(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  maxRetries: number = MAX_RETRIES
): Promise<{ text: string; log: AiLogEntry }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock && "text" in textBlock ? textBlock.text : "";

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const costUsd =
        inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;

      return {
        text,
        log: {
          role: "generate",
          model: MODEL,
          inputTokens,
          outputTokens,
          costUsd: Math.round(costUsd * 1_000_000) / 1_000_000, // Round to 6 decimals
          timestamp: Date.now(),
        },
      };
    } catch (err) {
      lastError = err;
      console.error(
        `[AI Pipeline] Claude API attempt ${attempt + 1}/${maxRetries} failed:`,
        err
      );

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ─── Actions ─────────────────────────────────────────────────────────

/**
 * Generate a deliverable using AI.
 * Fetches all required data, resolves non-AI template variables,
 * then calls Claude to fill AI variables.
 */
export const generateDeliverable = action({
  args: {
    assignmentId: v.id("monthlyAssignments"),
    projServiceId: v.id("projectionServices"),
    clientId: v.id("clients"),
    templateType: v.union(
      v.literal("deliverable_short"),
      v.literal("deliverable_long")
    ),
  },
  handler: async (ctx, args): Promise<string> => {
    // 1. Fetch all required data in parallel
    const [assignment, client, projService] = await Promise.all([
      ctx.runQuery(internal.functions.deliverables.internalQueries.getAssignmentData, {
        assignmentId: args.assignmentId,
      }),
      ctx.runQuery(internal.functions.deliverables.internalQueries.getClientData, {
        clientId: args.clientId,
      }),
      ctx.runQuery(internal.functions.deliverables.internalQueries.getProjServiceData, {
        projServiceId: args.projServiceId,
      }),
    ]);

    if (!assignment) throw new Error("Asignacion no encontrada.");
    if (!client) throw new Error("Cliente no encontrado.");
    if (!projService) throw new Error("Servicio de proyeccion no encontrado.");

    // Fetch projection and questionnaire
    const [projection, questionnaire] = await Promise.all([
      ctx.runQuery(
        internal.functions.deliverables.internalQueries.getProjectionByProjService,
        { projectionId: projService.projectionId }
      ),
      ctx.runQuery(
        internal.functions.deliverables.internalQueries.getQuestionnaireForClient,
        { clientId: args.clientId, projectionId: projService.projectionId }
      ),
    ]);

    // Find template
    const template = await ctx.runQuery(
      internal.functions.deliverables.internalQueries.findTemplate,
      {
        serviceName: projService.serviceName,
        type: args.templateType,
        orgId: assignment.orgId,
      }
    );

    const aiLogs: AiLogEntry[] = [];
    let finalContent: string;

    if (template) {
      // 2. Resolve non-AI variables
      const context = {
        client: client as unknown as Record<string, unknown>,
        projection: projection as unknown as Record<string, unknown>,
        service: projService as unknown as Record<string, unknown>,
      };

      const { html, aiVariables } = resolveNonAiVariables(
        template.htmlTemplate,
        template.variables,
        context
      );

      // 3. Fill AI variables using Claude
      const anthropic = getAnthropicClient();
      let resolvedHtml = html;

      if (aiVariables.length > 0 && anthropic) {
        const questionnaireContext = questionnaire?.responses
          ? questionnaire.responses
              .map((r: { questionText: string; answer: string }) => `P: ${r.questionText}\nR: ${r.answer}`)
              .join("\n\n")
          : "Sin respuestas de cuestionario disponibles.";

        const projectionContext = projection
          ? `Ventas anuales: $${projection.annualSales.toLocaleString("es-MX")}, Presupuesto total: $${projection.totalBudget.toLocaleString("es-MX")}, Comision: ${projection.commissionRate}%`
          : "Sin datos de proyeccion.";

        for (const aiVar of aiVariables) {
          try {
            const result = await callClaudeWithRetry(
              anthropic,
              `Eres un consultor profesional de ${projService.serviceName}. Genera contenido para un ${args.templateType === "deliverable_short" ? "resumen ejecutivo" : "informe detallado"} empresarial.`,
              `Variable: ${aiVar.label}.\n\nContexto del cliente: ${client.name}, industria: ${client.industry}.\n\nDatos financieros: ${projectionContext}\n\nServicio: ${projService.serviceName} (${projService.chosenPct}% del presupuesto, monto anual: $${projService.annualAmount.toLocaleString("es-MX")})\n\nRespuestas del cuestionario:\n${questionnaireContext}\n\nGenera el contenido en espanol profesional. Responde unicamente con el contenido solicitado, sin encabezados ni explicaciones adicionales.`
            );

            resolvedHtml = resolvedHtml.replace(
              new RegExp(escapeRegex(`{{${aiVar.key}}}`), "g"),
              result.text
            );
            // Also replace the [AI_PENDIENTE] placeholder if present
            resolvedHtml = resolvedHtml.replace(
              new RegExp(escapeRegex("[AI_PENDIENTE]"), "g"),
              ""
            );
            aiLogs.push(result.log);
          } catch (err) {
            console.error(
              `[AI Pipeline] Failed to generate AI variable "${aiVar.key}":`,
              err
            );
            resolvedHtml = resolvedHtml.replace(
              new RegExp(escapeRegex(`{{${aiVar.key}}}`), "g"),
              AI_UNAVAILABLE_PLACEHOLDER
            );
          }
        }
      } else if (aiVariables.length > 0 && !anthropic) {
        // No API key: replace all AI placeholders
        for (const aiVar of aiVariables) {
          resolvedHtml = resolvedHtml.replace(
            new RegExp(escapeRegex(`{{${aiVar.key}}}`), "g"),
            AI_UNAVAILABLE_PLACEHOLDER
          );
        }
      }

      finalContent = resolvedHtml;
    } else {
      // No template found: generate content directly with AI
      const anthropic = getAnthropicClient();

      if (anthropic) {
        const questionnaireContext = questionnaire?.responses
          ? questionnaire.responses
              .map((r: { questionText: string; answer: string }) => `P: ${r.questionText}\nR: ${r.answer}`)
              .join("\n\n")
          : "Sin respuestas de cuestionario disponibles.";

        try {
          const isShort = args.templateType === "deliverable_short";
          const result = await callClaudeWithRetry(
            anthropic,
            `Eres un consultor profesional de ${projService.serviceName}. Genera un ${isShort ? "resumen ejecutivo breve" : "informe detallado completo"} empresarial en formato HTML.`,
            `Cliente: ${client.name}\nIndustria: ${client.industry}\nRFC: ${client.rfc}\nServicio: ${projService.serviceName}\nMes: ${assignment.month}/${assignment.year}\nMonto mensual: $${assignment.amount.toLocaleString("es-MX")}\n\nRespuestas del cuestionario:\n${questionnaireContext}\n\nGenera un ${isShort ? "resumen ejecutivo (1-2 parrafos)" : "informe detallado con secciones: Resumen Ejecutivo, Analisis, Hallazgos, Recomendaciones, Proximos Pasos"} en espanol profesional. Responde en formato HTML.`
          );

          finalContent = result.text;
          aiLogs.push(result.log);
        } catch (err) {
          console.error("[AI Pipeline] Failed to generate content:", err);
          finalContent = `<p>${AI_UNAVAILABLE_PLACEHOLDER}</p>`;
        }
      } else {
        finalContent = `<p>${AI_UNAVAILABLE_PLACEHOLDER}</p>`;
      }
    }

    // 4. Save deliverable
    const isShort = args.templateType === "deliverable_short";
    const deliverableId = await ctx.runMutation(
      internal.functions.deliverables.mutations.saveGenerated,
      {
        orgId: assignment.orgId,
        assignmentId: args.assignmentId,
        projServiceId: args.projServiceId,
        clientId: args.clientId,
        serviceName: projService.serviceName,
        month: assignment.month,
        year: assignment.year,
        shortContent: isShort ? finalContent : "",
        longContent: isShort ? "" : finalContent,
        aiLog: aiLogs,
      }
    );

    console.log(
      `[AI Pipeline] Deliverable generated: ${deliverableId}, type: ${args.templateType}, AI calls: ${aiLogs.length}, total cost: $${aiLogs.reduce((sum, l) => sum + l.costUsd, 0).toFixed(6)}`
    );

    return deliverableId;
  },
});

/**
 * Audit a deliverable using AI.
 * Validates completeness, professional tone, and accuracy against questionnaire data.
 */
export const auditDeliverable = action({
  args: { deliverableId: v.id("deliverables") },
  handler: async (ctx, args) => {
    const deliverable = await ctx.runQuery(
      internal.functions.deliverables.internalQueries.getDeliverableData,
      { deliverableId: args.deliverableId }
    );

    if (!deliverable) {
      throw new Error("Entregable no encontrado.");
    }

    const content = deliverable.shortContent || deliverable.longContent;
    if (!content) {
      throw new Error("El entregable no tiene contenido para auditar.");
    }

    // Get questionnaire data for validation
    const projService = await ctx.runQuery(
      internal.functions.deliverables.internalQueries.getProjServiceData,
      { projServiceId: deliverable.projServiceId }
    );

    let questionnaireContext = "Sin datos de cuestionario disponibles.";
    if (projService) {
      const questionnaire = await ctx.runQuery(
        internal.functions.deliverables.internalQueries.getQuestionnaireForClient,
        {
          clientId: deliverable.clientId,
          projectionId: projService.projectionId,
        }
      );

      if (questionnaire?.responses) {
        questionnaireContext = questionnaire.responses
          .map((r: { questionText: string; answer: string }) => `P: ${r.questionText}\nR: ${r.answer}`)
          .join("\n\n");
      }
    }

    const anthropic = getAnthropicClient();

    if (!anthropic) {
      console.warn("[AI Pipeline] No API key for audit. Marking as pending.");
      await ctx.runMutation(internal.functions.deliverables.mutations.updateAudit, {
        id: args.deliverableId,
        auditStatus: "approved",
        auditFeedback:
          "Auditoria automatica no disponible (API key no configurada). Aprobado por defecto.",
        aiLog: [],
      });
      return { approved: true, feedback: "Auto-approved (no API key)" };
    }

    try {
      const result = await callClaudeWithRetry(
        anthropic,
        "Eres un auditor de calidad de documentos empresariales. Tu trabajo es revisar entregables de consultoria y validar su calidad.",
        `Revisa este entregable:\n\n${content}\n\nDatos del cuestionario del cliente para validacion:\n${questionnaireContext}\n\nValida los siguientes criterios:\n1. Completitud: El documento cubre todos los puntos relevantes?\n2. Tono profesional: El lenguaje es apropiado para un entregable empresarial?\n3. Precision: Los datos mencionados son consistentes con la informacion del cuestionario?\n4. Estructura: El documento tiene una estructura logica y clara?\n\nResponde UNICAMENTE con un JSON valido (sin markdown, sin backticks) con este formato:\n{"approved": true/false, "feedback": "explicacion detallada de la evaluacion"}`
      );

      // Update the log role for audit
      const auditLog: AiLogEntry = { ...result.log, role: "audit" };

      // Parse Claude's response
      let approved = false;
      let feedback = result.text;

      try {
        // Try to extract JSON from the response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          approved = Boolean(parsed.approved);
          feedback = parsed.feedback || result.text;
        }
      } catch {
        console.warn(
          "[AI Pipeline] Could not parse audit JSON, treating as rejected:",
          result.text
        );
        approved = false;
        feedback = `Error parsing audit response. Raw: ${result.text}`;
      }

      const auditStatus = approved ? "approved" : "rejected";

      await ctx.runMutation(internal.functions.deliverables.mutations.updateAudit, {
        id: args.deliverableId,
        auditStatus,
        auditFeedback: feedback,
        aiLog: [auditLog],
      });

      // If rejected and retryCount < 3, schedule regeneration
      if (!approved && deliverable.retryCount < 3) {
        await ctx.runMutation(
          internal.functions.deliverables.mutations.incrementRetry,
          { id: args.deliverableId }
        );

        // Schedule regeneration via the same action
        await ctx.scheduler.runAfter(
          5000, // 5 second delay
          internal.functions.deliverables.actions.regenerateDeliverable,
          { deliverableId: args.deliverableId, feedback }
        );
      }

      console.log(
        `[AI Pipeline] Audit complete for ${args.deliverableId}: ${auditStatus}, cost: $${auditLog.costUsd.toFixed(6)}`
      );

      return { approved, feedback };
    } catch (err) {
      console.error("[AI Pipeline] Audit failed:", err);
      await ctx.runMutation(internal.functions.deliverables.mutations.updateAudit, {
        id: args.deliverableId,
        auditStatus: "rejected",
        auditFeedback: `Error en auditoria automatica: ${String(err)}`,
        aiLog: [],
      });
      return { approved: false, feedback: `Audit error: ${String(err)}` };
    }
  },
});

/**
 * Internal action: Regenerate a rejected deliverable with feedback context.
 */
export const regenerateDeliverable = internalAction({
  args: {
    deliverableId: v.id("deliverables"),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    const deliverable = await ctx.runQuery(
      internal.functions.deliverables.internalQueries.getDeliverableData,
      { deliverableId: args.deliverableId }
    );

    if (!deliverable) {
      console.error("[AI Pipeline] Deliverable not found for regeneration.");
      return;
    }

    if (deliverable.retryCount >= 3) {
      console.warn(
        `[AI Pipeline] Max retries reached for ${args.deliverableId}. Skipping regeneration.`
      );
      return;
    }

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      console.warn("[AI Pipeline] No API key for regeneration.");
      return;
    }

    const currentContent = deliverable.shortContent || deliverable.longContent;
    const isShort = Boolean(deliverable.shortContent);

    try {
      const result = await callClaudeWithRetry(
        anthropic,
        `Eres un consultor profesional de ${deliverable.serviceName}. Debes corregir un entregable empresarial que fue rechazado en auditoria de calidad.`,
        `Entregable actual:\n\n${currentContent}\n\nFeedback del auditor:\n${args.feedback}\n\nCorrige el entregable incorporando el feedback del auditor. Mantiene el formato HTML. Responde unicamente con el contenido corregido.`
      );

      const correctionLog: AiLogEntry = { ...result.log, role: "correction" };

      await ctx.runMutation(
        internal.functions.deliverables.mutations.updateAfterRegeneration,
        {
          id: args.deliverableId,
          shortContent: isShort ? result.text : undefined,
          longContent: isShort ? undefined : result.text,
          auditStatus: "corrected" as const,
          auditFeedback: `Corregido automaticamente basado en feedback: ${args.feedback}`,
          aiLog: [correctionLog],
        }
      );

      console.log(
        `[AI Pipeline] Regenerated deliverable ${args.deliverableId}, cost: $${correctionLog.costUsd.toFixed(6)}`
      );
    } catch (err) {
      console.error("[AI Pipeline] Regeneration failed:", err);
    }
  },
});
