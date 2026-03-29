# Template Conversion Plan

**Status:** Pending (do after Sprint 9)
**Source:** Google Drive — `DESC - Proyecto Automatización/Plantillas Entregables/`
**Target:** Projex `deliverableTemplates` table (HTML with {{variables}})

---

## Summary

30 files analyzed → 22 client-facing templates + 5 internal methodologies + 3 Excel tools

---

## Templates to Convert (22 files → HTML)

### Legal — Gobierno Corporativo

| # | File | Template Type | Priority |
|---|------|--------------|----------|
| L1 | `01_DESC_Propuesta_Servicios_Profesionales.docx` | `quotation` | HIGH |
| L2 | `02_DESC_Cuestionario_Onboarding.pdf` | `questionnaire` | HIGH |
| L3 | `04_DESC_Executive_Governance_Brief.docx` | `deliverable_short` | HIGH |
| L4 | `05_DESC_Master_Corporate_Governance_Blueprint.docx` | `deliverable_long` | HIGH |

**Variables:** `[NOMBRE DEL CLIENTE]`, `[X.X]/5.0` (IMG score), `[N]` (counts), `$[X]+IVA` (fees), shareholder matrix `[Nombre 1-5]`, scorecard dimensions

---

### Contabilidad — Servicio Premium

| # | File | Template Type | Priority |
|---|------|--------------|----------|
| C1 | `03_Plantilla_Cotizacion_Servicio.pdf` | `quotation` | HIGH |
| C2 | `04_Entregable_Mensual.pdf` | `deliverable_short` | HIGH |
| C3 | `05_Entregable_Trimestral_Anual.pdf` | `deliverable_long` | HIGH |

**Variables:** `Folio:`, `Fecha:`, `Empresa:`, `RFC:`, `Asesor:`, 12-service pricing table, KPI cards, P&L line items, risk semaphores, signature blocks

---

### Financiero — Diagnóstico Financiero

| # | File | Template Type | Priority |
|---|------|--------------|----------|
| F1 | `Cuestionario_Diagnostico_Financiero.docx` | `questionnaire` | HIGH |
| F2 | `Reporte_Diagnostico_Version_Corta.docx` | `deliverable_short` | HIGH |
| F3 | `Reporte_Diagnostico_Version_Larga.docx` | `deliverable_long` | HIGH |

**Variables:** `[Nombre]`, `[DD/MM/AAAA]`, `[Año -2]`/`[Año Actual]`, `[MXN / Miles]`, financial ratios `[X.Xx]`, P&L/Balance data `[XXX]`, benchmarks

---

### Marketing — Plan Anual

| # | File | Template Type | Priority |
|---|------|--------------|----------|
| M1 | `Cuestionario_Plan_Marketing.pdf` | `questionnaire` | MEDIUM |
| M2 | `Plan_Anual_Marketing_TEMPLATE.pdf` | `deliverable_short` | MEDIUM |
| M3 | `Plan_Anual_Marketing_TEMPLATE_v2.pdf` | `deliverable_long` | MEDIUM |

**Variables:** `Nombre/Razón Social`, `Sector/Industria`, buyer persona fields, KPI targets, budget amounts, competitor data

---

### TI — Diagnóstico Tecnológico

| # | File | Template Type | Priority |
|---|------|--------------|----------|
| T1 | `01_Cuestionario_Calificacion_Tecnologica.docx` | `questionnaire` | HIGH |
| T2 | `03_Diagnostico_Corto.docx` | `deliverable_short` | HIGH |
| T3 | `04_Diagnostico_Largo.docx` | `deliverable_long` | HIGH |
| T4 | `05_Plantilla_Cotizacion.docx` | `quotation` | HIGH |

**Variables:** `EMPRESA`, `INDUSTRIA`, `FOLIO`, `CONSULTOR`, `___/100` (scores), `[Hallazgo XX]`, `[Quick Win X]`, `$_,___ USD`, SLA metrics

---

### Administración — Manual de Procedimientos

| # | File | Template Type | Priority |
|---|------|--------------|----------|
| A1 | `GEN_Activo1_Cuestionario.pdf` | `questionnaire` | MEDIUM |
| A2 | `GEN_Activo3_Plantillas.pdf` (Option A) | `deliverable_short` | MEDIUM |
| A3 | `GEN_Activo4_Master_Manual_Operativo.pdf` | `deliverable_long` | HIGH |

**Variables:** `[FIRMA CONSULTORA]` (whitelabel!), `[NOMBRE LEGAL]`, `[RFC]`, `[GIRO]`, `$[X]` (authorization thresholds), KPIs, policy fields

---

## Internal References (NOT templates — store as reference docs)

| # | File | Service | Purpose |
|---|------|---------|---------|
| I1 | `03_DESC_Metodologia_Analisis_Interno.pdf` | Legal | Scoring framework (EMG-DESC) |
| I2 | `02_Metodologia_Analisis_Interno.pdf` | Contabilidad | 10-phase Shadow CFO process |
| I3 | `02_Metodologia_Interna.docx` | TI | Qualification scoring methodology |
| I4 | `GEN_Activo2_Metodologia.pdf` | Admin | 5-phase gap analysis framework |
| I5 | `Manual de Referncia Maestro.txt` | Admin | AI system prompt / style guide |

**These feed AI context** — the AI agent should read these when generating deliverables for each service.

---

## Excel Tools (keep as downloadable attachments)

| # | File | Service | Purpose |
|---|------|---------|---------|
| E1 | `Plantilla_Analisis_Financiero.xlsx` | Financiero | Auto-calc financial ratios |
| E2 | `Cashflow_MVP_12w.xlsx` | Financiero | 12-week cashflow dashboard |
| E3 | `Calculadora_Proyeccion_Servicios.xlsx` | General | Original projection calculator |

---

## Conversion Process (post Sprint 9)

For each template:
1. Read the source file (PDF/DOCX)
2. Extract the structure (sections, tables, fields)
3. Convert to HTML preserving layout
4. Replace all `[placeholders]` and blank fields with `{{variable_name}}`
5. Define the variables array (key, label, source: client/projection/service/ai/manual)
6. Apply branding wrapper compatibility (colors, fonts, logo via `{{branding_*}}`)
7. Upload to Projex via `deliverableTemplates.create` mutation
8. Test preview with sample data
9. Test PDF generation with branding

**Estimated effort:** 6 services × ~30 min each = ~3 hours with parallel agents

---

## Variable Mapping Convention

| Source Placeholder | Projex Variable | Source |
|---|---|---|
| `[NOMBRE DEL CLIENTE]` / `EMPRESA` | `{{client_name}}` | client |
| `[RFC]` | `{{client_rfc}}` | client |
| `[INDUSTRIA]` / `[SECTOR]` | `{{client_industry}}` | client |
| `[FECHA]` | `{{current_date}}` | manual |
| `[FIRMA CONSULTORA]` | `{{branding_company_name}}` | branding |
| `$[X] + IVA` | `{{service_amount}}` | projection |
| `[AÑO]` | `{{projection_year}}` | projection |
| `[Hallazgo 1]` | `{{ai_finding_1}}` | ai |
| `[Recomendación 1]` | `{{ai_recommendation_1}}` | ai |
| `[FOLIO]` | `{{document_folio}}` | manual |
