"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useOrgConfig() {
  const config = useQuery(api.functions.orgConfigs.queries.getByOrgId);

  return {
    isLoading: config === undefined,
    config: config ?? null,
    flags: {
      advancedConfigVisible: config?.featureFlags?.advancedConfigVisible ?? false,
      customServicesVisible: config?.featureFlags?.customServicesVisible ?? false,
      seasonalityEditable: config?.featureFlags?.seasonalityEditable ?? false,
      manualOverrideAllowed: config?.featureFlags?.manualOverrideAllowed ?? false,
    },
  };
}
