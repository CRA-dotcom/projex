"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Users, Search, Plus, Archive, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

const FREQ_LABELS: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const clients = useQuery(api.functions.clients.queries.list, {
    search: search || undefined,
    includeArchived: showArchived,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-accent" size={28} />
          <h1 className="text-2xl font-bold">Clientes</h1>
          {clients && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
              {clients.length}
            </span>
          )}
        </div>
        <Link
          href="/clientes/nuevo"
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary hover:bg-accent/90 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Nuevo Cliente
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o RFC..."
            className="w-full rounded-md border border-border bg-secondary py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors cursor-pointer ${
            showArchived
              ? "border-warning bg-warning/10 text-warning"
              : "border-border text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Archive size={14} />
          Archivados
        </button>
      </div>

      {/* Client List */}
      {clients === undefined ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-card"
            />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
          <p className="text-lg font-medium">No hay clientes aún</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primer cliente para comenzar a generar proyecciones.
          </p>
          <Link
            href="/clientes/nuevo"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary hover:bg-accent/90 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Crear Cliente
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Link
              key={client._id}
              href={`/clientes/${client._id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Building2 className="text-accent" size={20} />
                </div>
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    RFC: {client.rfc} &middot; {client.industry} &middot;{" "}
                    {FREQ_LABELS[client.billingFrequency]}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-accent">
                  {formatCurrency(client.annualRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">anual</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
