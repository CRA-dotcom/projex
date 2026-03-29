#!/usr/bin/env node
/**
 * Reload all 20 HTML templates into Convex using the upsertTemplate mutation.
 * This updates only the htmlTemplate content (preserving variables).
 *
 * Usage:
 *   CONVEX_DEPLOY_KEY="..." node scripts/reload-templates-html.mjs
 *
 * Or for local dev:
 *   npx convex run functions/deliverableTemplates/seed:upsertTemplate '...'
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HTML_DIR = path.join(ROOT, "docs", "templates", "html");

// Template name mapping (file -> DB name, service, type)
const TEMPLATES = [
  // Legal (4)
  { file: "legal-quotation", name: "Legal - Propuesta de Servicios", service: "Legal", type: "quotation" },
  { file: "legal-questionnaire", name: "Legal - Cuestionario Onboarding", service: "Legal", type: "questionnaire" },
  { file: "legal-deliverable-short", name: "Legal - Executive Governance Brief", service: "Legal", type: "deliverable_short" },
  { file: "legal-deliverable-long", name: "Legal - Master Corporate Governance Blueprint", service: "Legal", type: "deliverable_long" },
  // Contabilidad (3)
  { file: "contabilidad-quotation", name: "Contabilidad - Propuesta Económica", service: "Contabilidad", type: "quotation" },
  { file: "contabilidad-deliverable-short", name: "Contabilidad - Informe Mensual Gobierno Contable", service: "Contabilidad", type: "deliverable_short" },
  { file: "contabilidad-deliverable-long", name: "Contabilidad - Informe Auditoría Interna", service: "Contabilidad", type: "deliverable_long" },
  // TI (4)
  { file: "ti-questionnaire", name: "TI - Cuestionario Calificación Tecnológica", service: "TI", type: "questionnaire" },
  { file: "ti-deliverable-short", name: "TI - Diagnóstico Corto", service: "TI", type: "deliverable_short" },
  { file: "ti-deliverable-long", name: "TI - Diagnóstico Largo", service: "TI", type: "deliverable_long" },
  { file: "ti-quotation", name: "TI - Cotización Servicios", service: "TI", type: "quotation" },
  // Financiero (3)
  { file: "financiero-questionnaire", name: "Financiero - Cuestionario Diagnóstico", service: "Financiero", type: "questionnaire" },
  { file: "financiero-deliverable-short", name: "Financiero - Reporte Diagnóstico Corto", service: "Financiero", type: "deliverable_short" },
  { file: "financiero-deliverable-long", name: "Financiero - Reporte Diagnóstico Largo", service: "Financiero", type: "deliverable_long" },
  // Marketing (3)
  { file: "marketing-questionnaire", name: "Marketing - Cuestionario Plan Anual", service: "Marketing", type: "questionnaire" },
  { file: "marketing-deliverable-short", name: "Marketing - Plan Anual Compacto", service: "Marketing", type: "deliverable_short" },
  { file: "marketing-deliverable-long", name: "Marketing - Plan Anual Completo", service: "Marketing", type: "deliverable_long" },
  // Admin (3)
  { file: "admin-questionnaire", name: "Admin - Cuestionario Diagnóstico", service: "Admin", type: "questionnaire" },
  { file: "admin-deliverable-short", name: "Admin - Executive Blueprint", service: "Admin", type: "deliverable_short" },
  { file: "admin-deliverable-long", name: "Admin - Manual Operativo Master", service: "Admin", type: "deliverable_long" },
];

const DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;
if (!DEPLOY_KEY) {
  console.error("ERROR: Set CONVEX_DEPLOY_KEY environment variable.");
  process.exit(1);
}

let ok = 0;
let fail = 0;

for (const tpl of TEMPLATES) {
  const htmlPath = path.join(HTML_DIR, `${tpl.file}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.error(`  SKIP (file not found): ${tpl.file}.html`);
    fail++;
    continue;
  }

  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  const args = JSON.stringify({
    name: tpl.name,
    serviceName: tpl.service,
    type: tpl.type,
    htmlTemplate: htmlContent,
  });

  // Write args to a temp file to avoid shell escaping issues
  const tmpFile = path.join(ROOT, `.tmp-tpl-${tpl.file}.json`);
  fs.writeFileSync(tmpFile, args);

  try {
    const cmd = `CONVEX_DEPLOY_KEY="${DEPLOY_KEY}" npx convex run --prod functions/deliverableTemplates/seed:upsertTemplate "$(cat ${JSON.stringify(tmpFile)})"`;
    const result = execSync(cmd, { cwd: ROOT, encoding: "utf-8", timeout: 30000 });
    console.log(`  OK: ${tpl.name} -> ${result.trim()}`);
    ok++;
  } catch (err) {
    console.error(`  FAIL: ${tpl.name} -> ${err.message}`);
    fail++;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

console.log(`\nDone: ${ok} updated, ${fail} failed out of ${TEMPLATES.length} templates.`);
