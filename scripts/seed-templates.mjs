#!/usr/bin/env node
/**
 * Seed 7 deliverable HTML templates into Convex (Legal + Contabilidad).
 *
 * Writes each template's args to a temp file, then uses `npx convex run`
 * with a subshell to read the file content as the args parameter.
 *
 * Usage:
 *   CONVEX_DEPLOY_KEY="..." node scripts/seed-templates.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HTML_DIR = path.join(ROOT, "docs", "templates", "html");

// ── Template definitions ────────────────────────────────────────────
const TEMPLATES = [
  { file: "legal-quotation", service: "Legal", type: "quotation" },
  { file: "legal-questionnaire", service: "Legal", type: "questionnaire" },
  { file: "legal-deliverable-short", service: "Legal", type: "deliverable_short" },
  { file: "legal-deliverable-long", service: "Legal", type: "deliverable_long" },
  { file: "contabilidad-quotation", service: "Contabilidad", type: "quotation" },
  { file: "contabilidad-deliverable-short", service: "Contabilidad", type: "deliverable_short" },
  { file: "contabilidad-deliverable-long", service: "Contabilidad", type: "deliverable_long" },
];

const SOURCE_MAP = {
  client: "client", projection: "projection", service: "service",
  ai: "ai", manual: "manual", branding: "manual", system: "manual",
  consultant: "manual", questionnaire: "manual",
};

function parseLegalVariables(vars) {
  return vars.map((v) => ({
    key: v.key,
    label: v.label || v.key,
    source: SOURCE_MAP[v.source] || "manual",
    required: v.required ?? false,
  }));
}

function parseContabilidadVariables(varsObj) {
  const result = [];
  for (const [, keys] of Object.entries(varsObj)) {
    if (!Array.isArray(keys)) continue;
    for (const key of keys) {
      let source = "manual";
      if (key.startsWith("ai_")) source = "ai";
      else if (key.startsWith("client_")) source = "client";
      else if (key.startsWith("svc_") || key.startsWith("subtotal") || key.startsWith("total")) source = "service";
      result.push({
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        source,
        required: false,
      });
    }
  }
  return result;
}

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
    console.error(`  SKIP  ${tpl.file} -- HTML not found`);
    skipped++;
    continue;
  }

  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  let variables = [];
  let name = tpl.file;
  const jsonPath = findJsonFile(tpl.file);
  if (jsonPath) {
    try {
      const meta = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      name = meta.name || tpl.file;
      if (Array.isArray(meta.variables)) {
        variables = parseLegalVariables(meta.variables);
      } else if (typeof meta.variables === "object" && meta.variables !== null) {
        variables = parseContabilidadVariables(meta.variables);
      }
    } catch (e) {
      console.warn(`  WARN  Could not parse JSON for ${tpl.file}: ${e.message}`);
    }
  }

  const args = {
    serviceName: tpl.service,
    type: tpl.type,
    name,
    htmlTemplate: htmlContent,
    variables,
  };

  // Write to temp file
  const tmpFile = path.join(os.tmpdir(), `seed-tpl-${tpl.file}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(args));

  console.log(`  Seeding: ${name} (${tpl.type}, ${variables.length} vars, ${htmlContent.length} chars)...`);

  try {
    // Use bash -c with cat to read args from file, avoiding shell argument limits
    const cmd = `bash -c 'npx convex run --prod functions/deliverableTemplates/seed:seedTemplate "$(cat "${tmpFile}")"'`;
    const output = execSync(cmd, {
      cwd: ROOT,
      env: { ...process.env, CONVEX_DEPLOY_KEY: DEPLOY_KEY },
      timeout: 60000,
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const trimmed = output.trim();
    if (trimmed.includes("already_exists")) {
      console.log(`  EXISTS ${name}`);
    } else {
      console.log(`  OK    ${name} -> ${trimmed}`);
    }
    success++;
  } catch (e) {
    const errMsg = (e.stderr || e.message || "").substring(0, 500);
    console.error(`  FAIL  ${name}: ${errMsg}`);
    errors++;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

console.log(`\nDone: ${success} succeeded, ${skipped} skipped, ${errors} errors.\n`);
process.exit(errors > 0 ? 1 : 0);
