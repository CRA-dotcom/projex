"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { Edit } from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditarClientePage() {
  const params = useParams();
  const clientId = params.id as Id<"clients">;

  const client = useQuery(api.functions.clients.queries.getById, {
    id: clientId,
  });

  if (client === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
        <div className="h-96 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  if (client === null) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-lg font-medium">Cliente no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/clientes/${clientId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        Volver al Cliente
      </Link>

      <div className="flex items-center gap-3">
        <Edit className="text-accent" size={28} />
        <h1 className="text-2xl font-bold">Editar Cliente</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <ClientForm initialData={client} mode="edit" />
      </div>
    </div>
  );
}
