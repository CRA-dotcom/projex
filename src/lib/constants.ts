export const MONTH_NAMES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export const MONTH_NAMES_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export const FREQ_LABELS: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-muted-foreground/20 text-muted-foreground" },
  info_received: { label: "Info Recibida", color: "bg-info/20 text-info" },
  in_progress: { label: "En Progreso", color: "bg-warning/20 text-warning" },
  delivered: { label: "Entregado", color: "bg-accent/20 text-accent" },
};

export const PROJECTION_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "text-muted-foreground bg-secondary" },
  active: { label: "Activa", color: "text-accent bg-accent/10" },
  archived: { label: "Archivada", color: "text-warning bg-warning/10" },
};
