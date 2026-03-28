"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "text-muted-foreground bg-secondary" },
  active: { label: "Activa", color: "text-accent bg-accent/10" },
  archived: { label: "Archivada", color: "text-warning bg-warning/10" },
};

export default function ProyeccionesPage() {
  const projections = useQuery(api.functions.projections.queries.list, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-accent" size={28} />
          <h1 className="text-2xl font-bold">Proyecciones</h1>
          {projections && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
              {projections.length}
            </span>
          )}
        </div>
        <Link
          href="/proyecciones/nueva"
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary hover:bg-accent/90 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Nueva Proyección
        </Link>
      </div>

      {projections === undefined ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-card"
            />
          ))}
        </div>
      ) : projections.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <TrendingUp
            className="mx-auto mb-4 text-muted-foreground"
            size={48}
          />
          <p className="text-lg font-medium">No hay proyecciones</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea una proyección financiera para un cliente.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {projections.map((proj) => {
            const status = STATUS_LABELS[proj.status];
            return (
              <Link
                key={proj._id}
                href={`/proyecciones/${proj._id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30 cursor-pointer"
              >
                <div>
                  <p className="font-medium">{proj.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    Año {proj.year} &middot; Comisión{" "}
                    {(proj.commissionRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-accent">
                      {formatCurrency(proj.totalBudget)}
                    </p>
                    <p className="text-xs text-muted-foreground">presupuesto</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      status.color
                    )}
                  >
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
