import { describe, it, expect } from "vitest";
import {
  calculateFeFactor,
  generateSeasonalityData,
  generateEvenSeasonality,
  calculateProjection,
  validateServiceLimits,
  type ServiceConfig,
  type MonthlyData,
  type ProjectionInput,
  type ServiceAllocation,
} from "../projectionEngine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService(overrides: Partial<ServiceConfig> = {}): ServiceConfig {
  return {
    serviceId: "svc-1",
    serviceName: "SEO",
    type: "base",
    minPct: 0.05,
    maxPct: 0.3,
    chosenPct: 0.2,
    isActive: true,
    ...overrides,
  };
}

function evenSeasonality(annualSales: number): MonthlyData[] {
  return generateEvenSeasonality(annualSales);
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
        chosenPct: 0.05,
      }),
    ],
    seasonalityData: evenSeasonality(annualSales),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. FE Factor calculation
// ---------------------------------------------------------------------------

describe("calculateFeFactor", () => {
  it("returns correct FE for normal monthly sales", () => {
    // Annual = 1,200,000 -> monthly avg = 100,000
    // Monthly = 150,000 -> FE = 1.5
    expect(calculateFeFactor(150_000, 1_200_000)).toBeCloseTo(1.5);
  });

  it("returns 1 when annual sales are zero (avoid division by zero)", () => {
    expect(calculateFeFactor(0, 0)).toBe(1);
  });

  it("returns 1 when sales are evenly distributed", () => {
    // monthly = annual / 12 = 100,000
    expect(calculateFeFactor(100_000, 1_200_000)).toBeCloseTo(1);
  });

  it("returns < 1 for low-season month", () => {
    expect(calculateFeFactor(50_000, 1_200_000)).toBeCloseTo(0.5);
  });
});

// ---------------------------------------------------------------------------
// 2. Even seasonality generation
// ---------------------------------------------------------------------------

describe("generateEvenSeasonality", () => {
  it("generates 12 months with FE = 1", () => {
    const data = generateEvenSeasonality(1_200_000);
    expect(data).toHaveLength(12);
    data.forEach((m) => {
      expect(m.feFactor).toBe(1);
      expect(m.monthlySales).toBeCloseTo(100_000);
    });
  });

  it("handles zero annual sales", () => {
    const data = generateEvenSeasonality(0);
    expect(data).toHaveLength(12);
    data.forEach((m) => {
      expect(m.monthlySales).toBe(0);
      expect(m.feFactor).toBe(1); // 0/0 case returns 1
    });
  });

  it("months are numbered 1-12", () => {
    const data = generateEvenSeasonality(120);
    expect(data.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

// ---------------------------------------------------------------------------
// 3. Custom seasonality generation
// ---------------------------------------------------------------------------

describe("generateSeasonalityData", () => {
  it("calculates FE factors from monthly sales array", () => {
    const monthlySales = [80, 120, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    const annual = monthlySales.reduce((a, b) => a + b, 0); // 1200
    const data = generateSeasonalityData(monthlySales, annual);

    expect(data).toHaveLength(12);
    // avg = 100, so month 1 FE = 80/100 = 0.8, month 2 FE = 120/100 = 1.2
    expect(data[0].feFactor).toBeCloseTo(0.8);
    expect(data[1].feFactor).toBeCloseTo(1.2);
    expect(data[2].feFactor).toBeCloseTo(1.0);
  });
});

// ---------------------------------------------------------------------------
// 4. Weighted budget distribution
// ---------------------------------------------------------------------------

describe("calculateProjection - budget distribution", () => {
  it("distributes remaining budget by normalized weights (single service)", () => {
    const input = makeInput({
      annualSales: 1_200_000,
      totalBudget: 120_000,
      commissionRate: 0.05,
      services: [
        makeService({ serviceId: "svc-1", serviceName: "SEO", chosenPct: 1.0 }),
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", chosenPct: 0.05 }),
      ],
    });

    const result = calculateProjection(input);
    // commissions = 1,200,000 * 0.05 = 60,000
    expect(result.annualCommissions).toBeCloseTo(60_000);
    // remaining = 120,000 - 60,000 = 60,000
    expect(result.remainingBudget).toBeCloseTo(60_000);

    const seo = result.services.find((s) => s.serviceName === "SEO")!;
    expect(seo.normalizedWeight).toBeCloseTo(1.0);
    expect(seo.annualAmount).toBeCloseTo(60_000);
  });

  it("distributes remaining budget by normalized weights (multiple services)", () => {
    const input = makeInput({
      annualSales: 1_200_000,
      totalBudget: 120_000,
      commissionRate: 0.05,
      services: [
        makeService({ serviceId: "svc-1", serviceName: "SEO", chosenPct: 0.3 }),
        makeService({ serviceId: "svc-2", serviceName: "PPC", chosenPct: 0.2 }),
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", chosenPct: 0.05 }),
      ],
    });

    const result = calculateProjection(input);
    const remaining = 120_000 - 1_200_000 * 0.05; // 60,000

    const seo = result.services.find((s) => s.serviceName === "SEO")!;
    const ppc = result.services.find((s) => s.serviceName === "PPC")!;

    // SEO weight = 0.3 / (0.3 + 0.2) = 0.6
    expect(seo.normalizedWeight).toBeCloseTo(0.6);
    expect(seo.annualAmount).toBeCloseTo(remaining * 0.6);

    // PPC weight = 0.2 / 0.5 = 0.4
    expect(ppc.normalizedWeight).toBeCloseTo(0.4);
    expect(ppc.annualAmount).toBeCloseTo(remaining * 0.4);
  });

  it("handles all services inactive (no allocation)", () => {
    const input = makeInput({
      services: [
        makeService({ serviceId: "svc-1", serviceName: "SEO", isActive: false }),
        makeService({ serviceId: "svc-2", serviceName: "PPC", isActive: false }),
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", isActive: false }),
      ],
    });

    const result = calculateProjection(input);
    result.services.forEach((s) => {
      expect(s.annualAmount).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. Commission proportional calculation
// ---------------------------------------------------------------------------

describe("calculateProjection - commissions", () => {
  it("calculates commissions proportional to monthly sales", () => {
    const monthlySales = [80, 120, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    const annual = monthlySales.reduce((a, b) => a + b, 0);
    const rate = 0.1;

    const input = makeInput({
      annualSales: annual,
      totalBudget: 500,
      commissionRate: rate,
      services: [
        makeService({ serviceId: "svc-com", serviceName: "Comisiones", chosenPct: rate }),
      ],
      seasonalityData: generateSeasonalityData(monthlySales, annual),
    });

    const result = calculateProjection(input);
    const comService = result.services.find((s) => s.serviceName === "Comisiones")!;

    expect(comService.annualAmount).toBeCloseTo(annual * rate);
    // month 1 commission = 80 * 0.1 = 8
    expect(comService.monthlyAmounts[0].adjustedAmount).toBeCloseTo(8);
    // month 2 commission = 120 * 0.1 = 12
    expect(comService.monthlyAmounts[1].adjustedAmount).toBeCloseTo(12);
  });
});

// ---------------------------------------------------------------------------
// 6. Zero edge cases
// ---------------------------------------------------------------------------

describe("calculateProjection - zero edge cases", () => {
  it("handles zero budget", () => {
    const input = makeInput({ totalBudget: 0 });
    const result = calculateProjection(input);
    // remaining = 0 - commissions (negative)
    expect(result.remainingBudget).toBe(-1_200_000 * 0.05);
  });

  it("handles zero annual sales", () => {
    const input = makeInput({
      annualSales: 0,
      seasonalityData: evenSeasonality(0),
    });
    const result = calculateProjection(input);
    expect(result.annualCommissions).toBe(0);
    expect(result.remainingBudget).toBe(120_000);
  });

  it("handles zero commission rate", () => {
    const input = makeInput({ commissionRate: 0 });
    const result = calculateProjection(input);
    expect(result.annualCommissions).toBe(0);
    expect(result.remainingBudget).toBe(120_000);
  });
});

// ---------------------------------------------------------------------------
// 7. validateServiceLimits
// ---------------------------------------------------------------------------

describe("validateServiceLimits", () => {
  it("returns valid when all services are within limits", () => {
    const configs: ServiceConfig[] = [
      makeService({ serviceId: "svc-1", serviceName: "SEO", maxPct: 0.5 }),
    ];
    const allocations: ServiceAllocation[] = [
      {
        serviceId: "svc-1",
        serviceName: "SEO",
        type: "base",
        chosenPct: 0.2,
        isActive: true,
        normalizedWeight: 1,
        annualAmount: 100_000, // 10% of 1M
        monthlyAmounts: [],
      },
    ];

    const result = validateServiceLimits(allocations, configs, 1_000_000);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("returns violations when service exceeds max percentage", () => {
    const configs: ServiceConfig[] = [
      makeService({ serviceId: "svc-1", serviceName: "SEO", maxPct: 0.05 }),
    ];
    const allocations: ServiceAllocation[] = [
      {
        serviceId: "svc-1",
        serviceName: "SEO",
        type: "base",
        chosenPct: 0.2,
        isActive: true,
        normalizedWeight: 1,
        annualAmount: 100_000, // 10% of 1M -> exceeds 5%
        monthlyAmounts: [],
      },
    ];

    const result = validateServiceLimits(allocations, configs, 1_000_000);
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toContain("SEO");
  });

  it("skips inactive services", () => {
    const configs: ServiceConfig[] = [
      makeService({ serviceId: "svc-1", serviceName: "SEO", maxPct: 0.01 }),
    ];
    const allocations: ServiceAllocation[] = [
      {
        serviceId: "svc-1",
        serviceName: "SEO",
        type: "base",
        chosenPct: 0.2,
        isActive: false, // inactive - should be skipped
        normalizedWeight: 0,
        annualAmount: 500_000,
        monthlyAmounts: [],
      },
    ];

    const result = validateServiceLimits(allocations, configs, 1_000_000);
    expect(result.valid).toBe(true);
  });

  it("skips Comisiones service", () => {
    const configs: ServiceConfig[] = [
      makeService({ serviceId: "svc-com", serviceName: "Comisiones", maxPct: 0.01 }),
    ];
    const allocations: ServiceAllocation[] = [
      {
        serviceId: "svc-com",
        serviceName: "Comisiones",
        type: "base",
        chosenPct: 0.05,
        isActive: true,
        normalizedWeight: 0,
        annualAmount: 500_000,
        monthlyAmounts: [],
      },
    ];

    const result = validateServiceLimits(allocations, configs, 1_000_000);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Monthly totals correctness
// ---------------------------------------------------------------------------

describe("calculateProjection - monthly totals", () => {
  it("monthly totals equal sum of all service adjusted amounts per month", () => {
    const input = makeInput();
    const result = calculateProjection(input);

    for (const mt of result.monthlyTotals) {
      const expected = result.services.reduce((sum, s) => {
        const ma = s.monthlyAmounts.find((m) => m.month === mt.month);
        return sum + (ma?.adjustedAmount ?? 0);
      }, 0);
      expect(mt.total).toBeCloseTo(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Grand total matches sum of service allocations
// ---------------------------------------------------------------------------

describe("calculateProjection - grand total", () => {
  it("grand total equals sum of all service annual amounts", () => {
    const input = makeInput();
    const result = calculateProjection(input);

    const sumAnnual = result.services.reduce((s, svc) => s + svc.annualAmount, 0);
    expect(result.grandTotal).toBeCloseTo(sumAnnual);
  });

  it("grand total equals total budget when all services active with even seasonality", () => {
    // With even seasonality and all services active, grand total = commissions + remaining = totalBudget
    const input = makeInput({
      annualSales: 1_200_000,
      totalBudget: 120_000,
      commissionRate: 0.05,
    });
    const result = calculateProjection(input);
    expect(result.grandTotal).toBeCloseTo(120_000);
  });
});
