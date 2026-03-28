"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ServiciosPage() {
  const services = useQuery(api.functions.services.queries.listByOrg);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="text-accent" size={28} />
        <h1 className="text-2xl font-bold">Servicios</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Configuración de los 9 servicios disponibles y sus benchmarks de mercado.
      </p>

      {services === undefined ? (
        <div className="space-y-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium">Servicio</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-center font-medium">Min %</th>
                <th className="px-4 py-3 text-center font-medium">Max %</th>
                <th className="px-4 py-3 text-center font-medium">Default %</th>
              </tr>
            </thead>
            <tbody>
              {services
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((service) => (
                  <tr key={service._id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{service.name}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        service.type === "base" ? "bg-info/10 text-info" : "bg-warning/10 text-warning"
                      )}>
                        {service.type === "base" ? "Base" : "Comodín"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {service.name === "Comisiones" ? "—" : `${(service.minPct * 100).toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {service.name === "Comisiones" ? "—" : `${(service.maxPct * 100).toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-accent">
                      {service.name === "Comisiones" ? "= Tasa" : `${(service.defaultPct * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
