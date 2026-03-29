import { describe, it, expect } from "vitest";

// --- Template Resolver ---
import {
  resolveTemplate,
  generateSampleContext,
  type TemplateVariable,
  type TemplateContext,
} from "../../../src/lib/templateResolver";

// --- PDF Branding Wrapper ---
import {
  wrapWithBranding,
  type BrandingConfig,
} from "../../../src/lib/pdfBrandingWrapper";

// --- Projection Engine ---
import {
  calculateProjection,
  generateEvenSeasonality,
  generateSeasonalityData,
  DEFAULT_ENGINE_CONFIG,
  type EngineConfig,
  type ProjectionInput,
  type ServiceConfig,
} from "../projectionEngine";

// --- Validators ---
import { isValidRFC, INDUSTRIES } from "../validators";

// --- Utilities ---
import { cn, formatCurrency, formatPercent } from "../../../src/lib/utils";

// ===========================================================================
// Helpers
// ===========================================================================

function makeService(overrides: Partial<ServiceConfig> = {}): ServiceConfig {
  return {
    serviceId: "svc-1",
    serviceName: "SEO",
    type: "base",
    minPct: 0.05,
    maxPct: 0.3,
    chosenPct: 0.2,
    isActive: true,
    isCommission: false,
    ...overrides,
  };
}

function makeInput(overrides: Partial<ProjectionInput> = {}): ProjectionInput {
  const annualSales = overrides.annualSales ?? 1_200_000;
  return {
    annualSales,
    totalBudget: 120_000,
    commissionRate: 0.05,
    services: [
      makeService({ serviceId: "svc-1", serviceName: "SEO", chosenPct: 0.3 }),
      makeService({ serviceId: "svc-2", serviceName: "PPC", chosenPct: 0.2 }),
      makeService({
        serviceId: "svc-com",
        serviceName: "Comisiones",
        isCommission: true,
        chosenPct: 0.05,
      }),
    ],
    seasonalityData: generateEvenSeasonality(annualSales),
    ...overrides,
  };
}

function baseBranding(overrides: Partial<BrandingConfig> = {}): BrandingConfig {
  return {
    companyName: "Acme Corp",
    primaryColor: "#1a2b3c",
    secondaryColor: "#4d5e6f",
    fontFamily: "Inter",
    ...overrides,
  };
}

// ===========================================================================
// 1. Template Resolution (10 tests)
// ===========================================================================

describe("Template Resolution", () => {
  it("resolves client source variables", () => {
    const vars: TemplateVariable[] = [
      { key: "name", label: "Nombre", source: "client", required: true },
    ];
    const ctx: TemplateContext = {
      client: {
        name: "Empresa X",
        rfc: "EMP920101ABC",
        industry: "Tech",
        annualRevenue: 5_000_000,
        billingFrequency: "mensual",
      },
    };
    const result = resolveTemplate("Hola {{name}}", vars, ctx);
    expect(result.html).toBe("Hola Empresa X");
    expect(result.resolved).toHaveLength(1);
    expect(result.missing).toHaveLength(0);
  });

  it("resolves projection source variables", () => {
    const vars: TemplateVariable[] = [
      { key: "year", label: "Ano", source: "projection", required: true },
      { key: "totalBudget", label: "Presupuesto", source: "projection", required: true },
    ];
    const ctx: TemplateContext = {
      projection: { year: 2026, annualSales: 5_000_000, totalBudget: 500_000, commissionRate: 10 },
    };
    const result = resolveTemplate("Ano: {{year}}, Presupuesto: {{totalBudget}}", vars, ctx);
    expect(result.html).toContain("2,026"); // toLocaleString es-MX formats numbers
    expect(result.html).toContain("500,000");
    expect(result.missing).toHaveLength(0);
  });

  it("resolves service source variables", () => {
    const vars: TemplateVariable[] = [
      { key: "name", label: "Servicio", source: "service", required: true },
      { key: "chosenPct", label: "%", source: "service", required: true },
    ];
    const ctx: TemplateContext = {
      service: { name: "Marketing Digital", type: "base", chosenPct: 15, annualAmount: 75_000 },
    };
    const result = resolveTemplate("{{name}} al {{chosenPct}}%", vars, ctx);
    expect(result.html).toContain("Marketing Digital");
    expect(result.html).toContain("15");
    expect(result.missing).toHaveLength(0);
  });

  it("manual source returns [PENDIENTE] when value not provided", () => {
    const vars: TemplateVariable[] = [
      { key: "customNote", label: "Nota", source: "manual", required: true },
    ];
    const result = resolveTemplate("Nota: {{customNote}}", vars, {});
    expect(result.html).toBe("Nota: [PENDIENTE]");
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0].value).toBe("[PENDIENTE]");
  });

  it("ai source returns [AI_PENDIENTE]", () => {
    const vars: TemplateVariable[] = [
      { key: "summary", label: "Resumen", source: "ai", required: true },
    ];
    const result = resolveTemplate("Resumen: {{summary}}", vars, {});
    expect(result.html).toBe("Resumen: [AI_PENDIENTE]");
    expect(result.resolved[0].value).toBe("[AI_PENDIENTE]");
  });

  it("tracks missing required variables in missing array", () => {
    const vars: TemplateVariable[] = [
      { key: "name", label: "Nombre", source: "client", required: true },
    ];
    // No client context provided
    const result = resolveTemplate("{{name}}", vars, {});
    expect(result.missing).toContain("name");
    expect(result.html).toContain("[FALTA: name]");
  });

  it("missing optional variables don't appear in missing array", () => {
    const vars: TemplateVariable[] = [
      { key: "name", label: "Nombre", source: "client", required: false },
    ];
    const result = resolveTemplate("{{name}}", vars, {});
    expect(result.missing).toHaveLength(0);
  });

  it("HTML with no variables returns unchanged", () => {
    const html = "<h1>Titulo</h1><p>Sin variables</p>";
    const result = resolveTemplate(html, [], {});
    expect(result.html).toBe(html);
    expect(result.resolved).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it("resolves multiple variables in same template", () => {
    const vars: TemplateVariable[] = [
      { key: "name", label: "Nombre", source: "client", required: true },
      { key: "rfc", label: "RFC", source: "client", required: true },
      { key: "year", label: "Ano", source: "projection", required: true },
    ];
    const ctx: TemplateContext = {
      client: { name: "Corp A", rfc: "COR920101ABC", industry: "Tech", annualRevenue: 1_000_000, billingFrequency: "mensual" },
      projection: { year: 2026, annualSales: 1_000_000, totalBudget: 100_000, commissionRate: 5 },
    };
    const result = resolveTemplate("{{name}} ({{rfc}}) - {{year}}", vars, ctx);
    expect(result.html).toContain("Corp A");
    expect(result.html).toContain("COR920101ABC");
    expect(result.resolved).toHaveLength(3);
  });

  it("preserves nested/complex HTML structure", () => {
    const html = '<div class="wrapper"><table><tr><td>{{name}}</td></tr></table></div>';
    const vars: TemplateVariable[] = [
      { key: "name", label: "Nombre", source: "client", required: true },
    ];
    const ctx: TemplateContext = {
      client: { name: "Test", rfc: "TST920101ABC", industry: "Tech", annualRevenue: 100, billingFrequency: "anual" },
    };
    const result = resolveTemplate(html, vars, ctx);
    expect(result.html).toContain('<div class="wrapper">');
    expect(result.html).toContain("<table>");
    expect(result.html).toContain("<td>Test</td>");
  });
});

// ===========================================================================
// 2. PDF Branding Wrapper (4 tests)
// ===========================================================================

describe("PDF Branding Wrapper", () => {
  it("wraps content with header containing company name", () => {
    const result = wrapWithBranding("<p>Hello</p>", baseBranding());
    expect(result).toContain("Acme Corp");
    expect(result).toContain("pdf-header-company");
    expect(result).toContain("<p>Hello</p>");
  });

  it("applies primary and secondary colors in CSS", () => {
    const branding = baseBranding({ primaryColor: "#ff0000", secondaryColor: "#00ff00" });
    const result = wrapWithBranding("<p>test</p>", branding);
    expect(result).toContain("#ff0000");
    expect(result).toContain("#00ff00");
  });

  it("includes footer text when provided", () => {
    const branding = baseBranding({ footerText: "Confidencial 2026" });
    const result = wrapWithBranding("<p>body</p>", branding);
    expect(result).toContain("Confidencial 2026");
  });

  it("handles missing optional fields (accentColor, headerText)", () => {
    // No accentColor -> falls back to primaryColor; no headerText -> no header-text div in body
    const branding = baseBranding(); // no accentColor, no headerText
    const result = wrapWithBranding("<p>ok</p>", branding);
    // accentColor falls back to primaryColor in h1 border
    expect(result).toContain(`border-bottom: 1px solid ${branding.primaryColor}`);
    // The header-text div (with actual content) should NOT be rendered in the HTML body
    expect(result).not.toContain('<div class="pdf-header-text">');
  });
});

// ===========================================================================
// 3. Projection Engine Config Modes (5 tests)
// ===========================================================================

describe("Projection Engine - Config Modes", () => {
  it("default config (undefined) matches weighted mode", () => {
    const input = makeInput();
    const resultUndefined = calculateProjection(input);
    const resultDefault = calculateProjection(input, DEFAULT_ENGINE_CONFIG);
    expect(resultUndefined.grandTotal).toBeCloseTo(resultDefault.grandTotal);
    expect(resultUndefined.remainingBudget).toBeCloseTo(resultDefault.remainingBudget);
  });

  it("fixed calculation mode uses fixedMonthlyAmount", () => {
    const fixedConfig: EngineConfig = {
      calculationMode: "fixed",
      commissionMode: "proportional",
      seasonalityEnabled: true,
    };
    const input = makeInput({
      services: [
        makeService({ serviceId: "svc-1", serviceName: "SEO", fixedMonthlyAmount: 5000 }),
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", isCommission: true, chosenPct: 0.05 }),
      ],
    });
    const result = calculateProjection(input, fixedConfig);
    const seo = result.services.find((s) => s.serviceName === "SEO")!;
    expect(seo.annualAmount).toBeCloseTo(5000 * 12);
    seo.monthlyAmounts.forEach((m) => {
      expect(m.adjustedAmount).toBeCloseTo(5000);
    });
  });

  it("fixed commission mode calculates flat commission", () => {
    const config: EngineConfig = {
      calculationMode: "weighted",
      commissionMode: "fixed_monthly",
      seasonalityEnabled: true,
    };
    const budget = 120_000;
    const rate = 0.1;
    const input = makeInput({
      totalBudget: budget,
      commissionRate: rate,
      services: [
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", isCommission: true, chosenPct: rate }),
      ],
    });
    const result = calculateProjection(input, config);
    const com = result.services.find((s) => s.serviceName === "Comisiones")!;
    const expectedMonthly = rate * budget / 12; // 1000
    com.monthlyAmounts.forEach((m) => {
      expect(m.adjustedAmount).toBeCloseTo(expectedMonthly);
    });
  });

  it("seasonality disabled forces FE=1 for all months", () => {
    const monthlySales = [50, 150, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    const annual = monthlySales.reduce((a, b) => a + b, 0);
    const config: EngineConfig = {
      calculationMode: "weighted",
      commissionMode: "proportional",
      seasonalityEnabled: false,
    };
    const input = makeInput({
      annualSales: annual,
      totalBudget: 1200,
      commissionRate: 0,
      services: [makeService({ serviceId: "svc-1", serviceName: "SEO", chosenPct: 1.0 })],
      seasonalityData: generateSeasonalityData(monthlySales, annual),
    });
    const result = calculateProjection(input, config);
    const seo = result.services.find((s) => s.serviceName === "SEO")!;
    seo.monthlyAmounts.forEach((m) => {
      expect(m.feFactor).toBe(1);
    });
  });

  it("isCommission flag correctly identifies commission service", () => {
    const input = makeInput({
      services: [
        makeService({ serviceId: "svc-1", serviceName: "SEO", isCommission: false, chosenPct: 0.5 }),
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", isCommission: true, chosenPct: 0.05 }),
      ],
    });
    const result = calculateProjection(input);
    const com = result.services.find((s) => s.serviceName === "Comisiones")!;
    // Commission service amount = annualSales * commissionRate
    expect(com.annualAmount).toBeCloseTo(1_200_000 * 0.05);
  });
});

// ===========================================================================
// 4. Utility Functions (4 tests)
// ===========================================================================

describe("Utility Functions", () => {
  it("formatCurrency formats MXN correctly", () => {
    const result = formatCurrency(1234.5);
    // Should contain the currency symbol and formatted number
    expect(result).toContain("1,234.50");
  });

  it("formatPercent formats correctly", () => {
    const result = formatPercent(0.156);
    // 15.6%
    expect(result).toContain("15.6");
    expect(result).toContain("%");
  });

  it("cn merges class names", () => {
    const result = cn("px-2", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("cn resolves conflicting Tailwind classes", () => {
    // tailwind-merge should keep only the last conflicting class
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });
});

// ===========================================================================
// 5. Validators (4 tests)
// ===========================================================================

describe("Validators", () => {
  it("valid persona moral RFC passes", () => {
    expect(isValidRFC("EEJ920101ABC")).toBe(true);
  });

  it("valid persona fisica RFC passes", () => {
    expect(isValidRFC("GACL920101AB3")).toBe(true);
  });

  it("invalid RFC fails", () => {
    expect(isValidRFC("123")).toBe(false);
    expect(isValidRFC("")).toBe(false);
    expect(isValidRFC("TOO-SHORT")).toBe(false);
  });

  it("INDUSTRIES list is non-empty and contains known values", () => {
    expect(INDUSTRIES.length).toBeGreaterThan(0);
    expect(INDUSTRIES).toContain("Manufactura");
    expect(INDUSTRIES).toContain("Tecnología");
  });
});

// ===========================================================================
// 6. Engine Edge Cases (4 tests)
// ===========================================================================

describe("Engine Edge Cases", () => {
  it("all services inactive results in zero allocations", () => {
    const input = makeInput({
      services: [
        makeService({ serviceId: "svc-1", isActive: false }),
        makeService({ serviceId: "svc-2", serviceName: "PPC", isActive: false }),
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", isCommission: true, isActive: false }),
      ],
    });
    const result = calculateProjection(input);
    result.services.forEach((s) => {
      expect(s.annualAmount).toBe(0);
    });
  });

  it("single active service gets 100% of remaining budget", () => {
    const input = makeInput({
      annualSales: 1_200_000,
      totalBudget: 120_000,
      commissionRate: 0.05,
      services: [
        makeService({ serviceId: "svc-1", serviceName: "SEO", chosenPct: 0.5 }),
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", isCommission: true, chosenPct: 0.05 }),
      ],
    });
    const result = calculateProjection(input);
    const seo = result.services.find((s) => s.serviceName === "SEO")!;
    const remaining = 120_000 - 1_200_000 * 0.05; // 60,000
    expect(seo.annualAmount).toBeCloseTo(remaining);
    expect(seo.normalizedWeight).toBeCloseTo(1.0);
  });

  it("commission only scenario has no remaining budget distribution", () => {
    const input = makeInput({
      annualSales: 1_200_000,
      totalBudget: 120_000,
      commissionRate: 0.1,
      services: [
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", isCommission: true, chosenPct: 0.1 }),
      ],
    });
    const result = calculateProjection(input);
    // All budget goes to commissions: 1,200,000 * 0.1 = 120,000
    expect(result.annualCommissions).toBeCloseTo(120_000);
    // No non-commission services to distribute to
    const nonCommission = result.services.filter((s) => s.serviceName !== "Comisiones");
    expect(nonCommission).toHaveLength(0);
  });

  it("very large numbers don't overflow", () => {
    const input = makeInput({
      annualSales: 1_000_000_000_000, // 1 trillion
      totalBudget: 100_000_000_000,
      commissionRate: 0.05,
      services: [
        makeService({ serviceId: "svc-1", serviceName: "SEO", chosenPct: 1.0 }),
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", isCommission: true, chosenPct: 0.05 }),
      ],
      seasonalityData: generateEvenSeasonality(1_000_000_000_000),
    });
    const result = calculateProjection(input);
    expect(Number.isFinite(result.grandTotal)).toBe(true);
    expect(result.grandTotal).toBeGreaterThan(0);
    result.services.forEach((s) => {
      expect(Number.isFinite(s.annualAmount)).toBe(true);
    });
  });
});

// ===========================================================================
// 7. generateSampleContext (2 bonus tests)
// ===========================================================================

describe("generateSampleContext", () => {
  it("generates client context when client source variables exist", () => {
    const vars: TemplateVariable[] = [
      { key: "name", label: "Nombre", source: "client", required: true },
    ];
    const ctx = generateSampleContext(vars);
    expect(ctx.client).toBeDefined();
    expect(ctx.client!.name).toBeTruthy();
  });

  it("generates manual context with example labels", () => {
    const vars: TemplateVariable[] = [
      { key: "customNote", label: "Nota", source: "manual", required: true },
    ];
    const ctx = generateSampleContext(vars);
    expect(ctx.manual).toBeDefined();
    expect(ctx.manual!["customNote"]).toContain("Nota");
  });
});
