"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "pending" as const, label: "Pendiente", color: "bg-muted-foreground/20 text-muted-foreground" },
  { value: "info_received" as const, label: "Info Recibida", color: "bg-info/20 text-info" },
  { value: "in_progress" as const, label: "En Progreso", color: "bg-warning/20 text-warning" },
  { value: "delivered" as const, label: "Entregado", color: "bg-accent/20 text-accent" },
];

const INVOICE_OPTIONS = [
  { value: "not_invoiced" as const, label: "Sin Facturar" },
  { value: "invoiced" as const, label: "Facturado" },
  { value: "paid" as const, label: "Pagado" },
];

export function MatrixCellDetail({
  assignment,
  onClose,
}: {
  assignment: Doc<"monthlyAssignments">;
  onClose: () => void;
}) {
  const updateStatus = useMutation(api.functions.monthlyAssignments.mutations.updateStatus);
  const updateInvoice = useMutation(api.functions.monthlyAssignments.mutations.updateInvoiceStatus);
  const updateAmount = useMutation(api.functions.monthlyAssignments.mutations.updateAmount);
  const [editAmount, setEditAmount] = useState(false);
  const [newAmount, setNewAmount] = useState(assignment.amount);

  const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="fixed inset-y-0 right-0 w-96 border-l border-border bg-card p-6 shadow-xl z-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{assignment.serviceName}</h3>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-secondary transition-colors cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Mes</p>
          <p className="font-medium">{MONTH_NAMES[assignment.month - 1]} {assignment.year}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Monto</p>
          {editAmount ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="flex-1 rounded-md border border-border bg-secondary px-2 py-1 text-sm focus:border-accent focus:outline-none"
              />
              <button
                onClick={async () => {
                  await updateAmount({ id: assignment._id, amount: newAmount });
                  setEditAmount(false);
                }}
                className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-primary cursor-pointer"
              >
                Guardar
              </button>
              <button
                onClick={() => { setEditAmount(false); setNewAmount(assignment.amount); }}
                className="rounded-md border border-border px-3 py-1 text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-accent">{formatCurrency(assignment.amount)}</p>
              <button
                onClick={() => setEditAmount(true)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Editar
              </button>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">FE Factor</p>
          <p className="font-medium">{assignment.feFactor.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Status de Entrega</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateStatus({ id: assignment._id, status: opt.value })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  assignment.status === opt.value ? opt.color : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Status de Facturación</p>
          <div className="flex flex-wrap gap-2">
            {INVOICE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateInvoice({ id: assignment._id, invoiceStatus: opt.value })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  assignment.invoiceStatus === opt.value
                    ? "bg-accent/20 text-accent"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
