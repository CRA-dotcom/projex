"use client";

import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="text-accent" size={28} />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Clientes Activos", value: "—" },
          { label: "Proyecciones", value: "—" },
          { label: "Entregables Pendientes", value: "—" },
          { label: "Facturación del Mes", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent/30"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">
          Bienvenido a Projex. Selecciona una organización para comenzar.
        </p>
      </div>
    </div>
  );
}
