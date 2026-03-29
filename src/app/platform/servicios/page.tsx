"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Briefcase } from "lucide-react";

export default function ServiciosPage() {
  const services = useQuery(api.functions.services.queries.listAllForAdmin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Servicios Globales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catalogo de servicios disponibles en la plataforma
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {services === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Briefcase size={40} className="mb-3 opacity-40" />
            <p className="text-sm">No hay servicios registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">% Default</th>
                <th className="px-6 py-3">Rango %</th>
                <th className="px-6 py-3">Orden</th>
                <th className="px-6 py-3">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((service) => (
                <tr key={service._id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {service.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        service.type === "base"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {service.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {service.defaultPct}%
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {service.minPct}% - {service.maxPct}%
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {service.sortOrder}
                  </td>
                  <td className="px-6 py-4">
                    {service.isDefault ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-500 text-xs">
                        &#10003;
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
