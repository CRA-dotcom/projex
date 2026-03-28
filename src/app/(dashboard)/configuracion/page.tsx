"use client";

import { Settings } from "lucide-react";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-accent" size={28} />
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Settings className="mx-auto mb-4 text-muted-foreground" size={48} />
        <p className="text-lg font-medium">Configuración de la Organización</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona tu equipo, plan y preferencias.
        </p>
      </div>
    </div>
  );
}
