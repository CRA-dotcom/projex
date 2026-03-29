"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { FileSignature, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  signed: "Firmado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted-foreground/20 text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400",
  signed: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

type StatusFilter = "all" | "draft" | "sent" | "signed" | "cancelled";

export default function ContratosPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const contracts = useQuery(
    api.functions.contracts.queries.listByOrg,
    statusFilter === "all" ? {} : { status: statusFilter }
  );

  const clients = useQuery(api.functions.clients.queries.list, {});

  // Build client name map
  const clientMap = new Map<string, string>();
  if (clients) {
    for (const c of clients) {
      clientMap.set(c._id, c.name);
    }
  }

  // Filter by search (client name or service name)
  const filtered = contracts?.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const clientName = clientMap.get(c.clientId) ?? "";
    return (
      clientName.toLowerCase().includes(term) ||
      c.serviceName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSignature className="text-accent" size={28} />
          <h1 className="text-2xl font-bold">Contratos</h1>
          {filtered && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length}
            </span>
          )}
        </div>
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
            placeholder="Buscar por cliente o servicio..."
            className="w-full rounded-md border border-border bg-secondary py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "draft", "sent", "signed", "cancelled"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                  statusFilter === s
                    ? "bg-accent text-primary"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {s === "all" ? "Todos" : STATUS_LABELS[s]}
              </button>
            )
          )}
        </div>
      </div>

      {/* List */}
      {filtered === undefined ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-card"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <FileSignature
            className="mx-auto mb-4 text-muted-foreground"
            size={48}
          />
          <p className="text-lg font-medium">No hay contratos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Los contratos se generan a partir de cotizaciones aprobadas.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const clientName = clientMap.get(c.clientId) ?? "Cliente";
            return (
              <Link
                key={c._id}
                href={`/contratos/${c._id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <FileSignature className="text-accent" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {c.serviceName}{" "}
                      <span className="text-muted-foreground font-normal">
                        &mdash; {clientName}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Creado{" "}
                      {new Date(c.createdAt).toLocaleDateString("es-MX")}
                      {c.signedAt &&
                        ` \u00B7 Firmado ${new Date(c.signedAt).toLocaleDateString("es-MX")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_COLORS[c.status]
                    )}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                  <ChevronRight
                    className="text-muted-foreground"
                    size={16}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
