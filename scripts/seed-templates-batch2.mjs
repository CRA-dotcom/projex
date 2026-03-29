#!/usr/bin/env node
/**
 * Seed 13 HTML templates (TI, Financiero, Marketing, Admin) into Convex.
 *
 * Usage:
 *   CONVEX_DEPLOY_KEY="..." node scripts/seed-templates-batch2.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HTML_DIR = path.join(ROOT, "docs", "templates", "html");

// ── Template definitions ────────────────────────────────────────────
const TEMPLATES = [
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

// ── Source mapping ──────────────────────────────────────────────────
function mapSource(rawSource) {
  if (!rawSource) return "manual";
  const s = rawSource.toLowerCase();
  if (s.includes("client") || s === "client_record") return "client";
  if (s.includes("projection") || s === "projection_record") return "projection";
  if (s.includes("service") || s === "service_record") return "service";
  if (s.includes("ai") || s === "calculated") return "ai";
  return "manual";
}

// ── Flatten nested variables from JSON metadata ─────────────────────
function extractVariables(variablesObj) {
  if (!variablesObj || typeof variablesObj !== "object") return [];
  if (Array.isArray(variablesObj)) {
    return variablesObj.map((v) => ({
      key: v.key, label: v.label || v.key,
      source: mapSource(v.source), required: v.required ?? false,
    }));
  }
  const result = [];
  for (const [groupKey, group] of Object.entries(variablesObj)) {
    if (typeof group !== "object" || group === null) continue;
    if (group.type || group.source) {
      result.push({ key: groupKey, label: group.description || groupKey, source: mapSource(group.source), required: true });
      continue;
    }
    if (Array.isArray(group)) {
      for (const key of group) {
        let source = "manual";
        if (key.startsWith("ai_")) source = "ai";
        else if (key.startsWith("client_")) source = "client";
        result.push({ key, label: key.replace(/_/g, " "), source, required: false });
      }
      continue;
    }
    for (const [varKey, varDef] of Object.entries(group)) {
      if (typeof varDef !== "object" || varDef === null) continue;
      result.push({ key: varKey, label: varDef.description || varKey, source: mapSource(varDef.source), required: true });
    }
  }
  return result;
}

// ── Find JSON metadata file ─────────────────────────────────────────
function findJsonFile(baseName) {
  const metaPath = path.join(HTML_DIR, `${baseName}.meta.json`);
  const jsonPath = path.join(HTML_DIR, `${baseName}.json`);
  if (fs.existsSync(metaPath)) return metaPath;
  if (fs.existsSync(jsonPath)) return jsonPath;
  return null;
}

// ── Main ────────────────────────────────────────────────────────────
const DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;
if (!DEPLOY_KEY) {
  console.error("ERROR: Set CONVEX_DEPLOY_KEY environment variable");
  process.exit(1);
}

console.log(`\nSeeding ${TEMPLATES.length} templates into Convex...\n`);

let success = 0;
let skipped = 0;
let errors = 0;

for (const tpl of TEMPLATES) {
  const htmlPath = path.join(HTML_DIR, `${tpl.file}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.error(`  SKIP  ${tpl.name} — HTML not found: ${tpl.file}.html`);
    skipped++;
    continue;
  }

  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  let variables = [];
  const jsonPath = findJsonFile(tpl.file);
  if (jsonPath) {
    try {
      const meta = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      variables = extractVariables(meta.variables);
    } catch (e) {
      console.warn(`  WARN  Could not parse JSON for ${tpl.file}: ${e.message}`);
    }
  } else {
    console.warn(`  WARN  No JSON metadata found for ${tpl.file} — empty variables`);
  }

  const args = {
    serviceName: tpl.service,
    type: tpl.type,
    name: tpl.name,
    htmlTemplate: htmlContent,
    variables,
  };

  // Write args to temp file, then pass via shell $(cat ...)
  const tmpFile = `/tmp/seed-tpl-${tpl.file}.json`;
  fs.writeFileSync(tmpFile, JSON.stringify(args));

  try {
    const output = execSync(
      `npx convex run --prod functions/deliverableTemplates/seed:seedTemplate "$(cat '${tmpFile}')"`,
      {
        cwd: ROOT,
        env: { ...process.env, CONVEX_DEPLOY_KEY: DEPLOY_KEY },
        timeout: 60000,
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
        shell: "/bin/bash",
      }
    );
    if (output.includes("already_exists")) {
      console.log(`  EXISTS ${tpl.name}`);
    } else {
      console.log(`  OK     ${tpl.name}`);
    }
    success++;
  } catch (e) {
    console.error(`  FAIL  ${tpl.name}: ${(e.stderr || e.message).substring(0, 300)}`);
    errors++;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

console.log(`\nDone: ${success} succeeded, ${skipped} skipped, ${errors} errors.\n`);
process.exit(errors > 0 ? 1 : 0);
