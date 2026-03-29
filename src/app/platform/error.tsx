"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Platform Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <AlertTriangle size={40} className="text-red-400" />
      <h2 className="text-lg font-semibold text-foreground">
        Error en el panel de administracion
      </h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error.message || "Ocurrio un error inesperado."}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
      >
        <RotateCcw size={14} />
        Reintentar
      </button>
    </div>
  );
}
