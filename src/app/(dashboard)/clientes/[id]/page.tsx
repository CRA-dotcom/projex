"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Edit,
  Archive,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

const FREQ_LABELS: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as Id<"clients">;

  const client = useQuery(api.functions.clients.queries.getById, {
    id: clientId,
  });
  const projections = useQuery(api.functions.projections.queries.getByClient, {
    clientId,
  });
  const archiveClient = useMutation(api.functions.clients.mutations.archive);
  const restoreClient = useMutation(api.functions.clients.mutations.restore);
  const [archiving, setArchiving] = useState(false);

  if (client === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  if (client === null) {
    return (
      <div className="space-y-4">
        <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft size={14} /> Volver a Clientes
        </Link>
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium">Cliente no encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Este cliente no existe o fue eliminado.</p>
        </div>
      </div>
    );
  }

  async function handleArchive() {
    setArchiving(true);
    try {
      if (client!.isArchived) {
        await restoreClient({ id: clientId });
      } else {
        await archiveClient({ id: clientId });
      }
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        Volver a Clientes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <Building2 className="text-accent" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              RFC: {client.rfc} &middot; {client.industry}
            </p>
          </div>
          {client.isArchived && (
            <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
              Archivado
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/clientes/${clientId}/editar`}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <Edit size={14} />
            Editar
          </Link>
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
          >
            {client.isArchived ? (
              <>
                <RotateCcw size={14} />
                Restaurar
              </>
            ) : (
              <>
                <Archive size={14} />
                Archivar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Facturación Anual</p>
          <p className="mt-1 text-2xl font-bold text-accent">
            {formatCurrency(client.annualRevenue)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Frecuencia de Facturación</p>
          <p className="mt-1 text-2xl font-bold">
            {FREQ_LABELS[client.billingFrequency]}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Industria</p>
          <p className="mt-1 text-2xl font-bold">{client.industry}</p>
        </div>
      </div>

      {/* Projections Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Proyecciones</h2>
          <Link
            href={`/proyecciones/nueva?clientId=${clientId}`}
            className="flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent/90 transition-colors cursor-pointer"
          >
            <TrendingUp size={14} />
            Nueva Proyección
          </Link>
        </div>
        {!projections || projections.length === 0 ? (
          <div className="mt-4 text-center py-8">
            <TrendingUp className="mx-auto mb-3 text-muted-foreground" size={36} />
            <p className="text-sm text-muted-foreground">
              No hay proyecciones para este cliente.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {projections.map((proj) => (
              <Link
                key={proj._id}
                href={`/proyecciones/${proj._id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 hover:border-accent/30 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-medium">Año {proj.year}</p>
                  <p className="text-xs text-muted-foreground">
                    Comisión {(proj.commissionRate * 100).toFixed(1)}% &middot; {proj.status === "draft" ? "Borrador" : proj.status === "active" ? "Activa" : "Archivada"}
                  </p>
                </div>
                <p className="font-medium text-accent">{formatCurrency(proj.totalBudget)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
