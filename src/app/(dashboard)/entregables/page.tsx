"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { FileOutput, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const AUDIT_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  corrected: "Corregido",
};

const AUDIT_COLORS: Record<string, string> = {
  pending: "bg-muted-foreground/20 text-muted-foreground",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  corrected: "bg-blue-500/20 text-blue-400",
};

type AuditFilter = "all" | "pending" | "approved" | "rejected" | "corrected";

export default function EntregablesPage() {
  const [statusFilter, setStatusFilter] = useState<AuditFilter>("all");
  const [search, setSearch] = useState("");

  const deliverables = useQuery(
    api.functions.deliverables.queries.listByOrg,
    {}
  );

  const clients = useQuery(api.functions.clients.queries.list, {});

  const clientMap = new Map<string, string>();
  if (clients) {
    for (const c of clients) {
      clientMap.set(c._id, c.name);
    }
  }

  const filtered = deliverables?.filter((d) => {
    if (statusFilter !== "all" && d.auditStatus !== statusFilter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    const clientName = clientMap.get(d.clientId) ?? "";
    return (
      clientName.toLowerCase().includes(term) ||
      d.serviceName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileOutput className="text-accent" size={28} />
          <h1 className="text-2xl font-bold">Entregables</h1>
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
          {(["all", "pending", "approved", "rejected", "corrected"] as const).map(
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
                {s === "all" ? "Todos" : AUDIT_LABELS[s]}
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
          <FileOutput
            className="mx-auto mb-4 text-muted-foreground"
            size={48}
          />
          <p className="text-lg font-medium">No hay entregables</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Los entregables se generan a partir de las asignaciones mensuales.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const clientName = clientMap.get(d.clientId) ?? "Cliente";
            return (
              <Link
                key={d._id}
                href={`/entregables/${d._id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <FileOutput className="text-accent" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {d.serviceName}{" "}
                      <span className="text-muted-foreground font-normal">
                        &mdash; {clientName}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.month}/{d.year}
                      {d.deliveredAt &&
                        ` \u00B7 Entregado ${new Date(d.deliveredAt).toLocaleDateString("es-MX")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      AUDIT_COLORS[d.auditStatus]
                    )}
                  >
                    {AUDIT_LABELS[d.auditStatus]}
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
