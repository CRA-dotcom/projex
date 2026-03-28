"use client";

import { Briefcase } from "lucide-react";

export default function ServiciosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="text-accent" size={28} />
        <h1 className="text-2xl font-bold">Servicios</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Briefcase className="mx-auto mb-4 text-muted-foreground" size={48} />
        <p className="text-lg font-medium">Servicios del Sistema</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Configuración de los 9 servicios disponibles y sus benchmarks de mercado.
        </p>
      </div>
    </div>
  );
}
