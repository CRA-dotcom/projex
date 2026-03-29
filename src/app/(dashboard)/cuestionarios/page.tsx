"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ClipboardList, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  in_progress: "En Progreso",
  completed: "Completado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted-foreground/20 text-muted-foreground",
  sent: "bg-info/20 text-info",
  in_progress: "bg-warning/20 text-warning",
  completed: "bg-accent/20 text-accent",
};

type StatusFilter = "all" | "draft" | "sent" | "in_progress" | "completed";

export default function CuestionariosPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const questionnaires = useQuery(
    api.functions.questionnaires.queries.listByOrg,
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

  // Filter by search (client name)
  const filtered = questionnaires?.filter((q) => {
    if (!search) return true;
    const clientName = clientMap.get(q.clientId) ?? "";
    return clientName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-accent" size={28} />
          <h1 className="text-2xl font-bold">Cuestionarios</h1>
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
            placeholder="Buscar por cliente..."
            className="w-full rounded-md border border-border bg-secondary py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "draft", "sent", "in_progress", "completed"] as const).map(
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
          <ClipboardList
            className="mx-auto mb-4 text-muted-foreground"
            size={48}
          />
          <p className="text-lg font-medium">No hay cuestionarios</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Los cuestionarios se generan desde las proyecciones de cada cliente.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => {
            const clientName = clientMap.get(q.clientId) ?? "Cliente";
            return (
              <Link
                key={q._id}
                href={`/cuestionarios/${q._id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <ClipboardList className="text-accent" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">{clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.responses.length} preguntas &middot; Creado{" "}
                      {new Date(q.createdAt).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_COLORS[q.status]
                    )}
                  >
                    {STATUS_LABELS[q.status]}
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
