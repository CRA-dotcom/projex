"use client";

import { Users } from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="text-accent" size={28} />
        <h1 className="text-2xl font-bold">Nuevo Cliente</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <ClientForm />
      </div>
    </div>
  );
}
