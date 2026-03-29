"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { ClipboardList, Save, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResponderCuestionarioPage() {
  const params = useParams();
  const id = params.id as Id<"questionnaireResponses">;

  const questionnaire = useQuery(
    api.functions.questionnaires.queries.getById,
    { id }
  );

  const updateResponses = useMutation(
    api.functions.questionnaires.mutations.updateResponses
  );
  const submitQuestionnaire = useMutation(
    api.functions.questionnaires.mutations.submit
  );

  const [localResponses, setLocalResponses] = useState<
    Array<{
      questionId: string;
      questionText: string;
      answer: string;
      serviceNames: string[];
    }>
  >([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Initialize local state from questionnaire data
  useEffect(() => {
    if (questionnaire && !initialized) {
      setLocalResponses(questionnaire.responses.map((r) => ({ ...r })));
      setInitialized(true);
      if (questionnaire.status === "completed") {
        setSubmitted(true);
      }
    }
  }, [questionnaire, initialized]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setLocalResponses((prev) =>
      prev.map((r) => (r.questionId === questionId ? { ...r, answer } : r))
    );
  };

  const handleSaveProgress = async () => {
    if (!questionnaire) return;
    setSaving(true);
    setSaveMessage("");
    try {
      await updateResponses({
        id: questionnaire._id,
        responses: localResponses,
      });
      setSaveMessage("Progreso guardado exitosamente.");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error("Error saving:", err);
      setSaveMessage("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!questionnaire) return;
    setSaving(true);
    try {
      // Save responses first
      await updateResponses({
        id: questionnaire._id,
        responses: localResponses,
      });
      // Then submit
      await submitQuestionnaire({ id: questionnaire._id });
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting:", err);
      setSaveMessage("Error al enviar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (questionnaire === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
        <div className="h-96 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  if (questionnaire === null) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium">Cuestionario no encontrado</p>
        </div>
      </div>
    );
  }

  if (submitted || questionnaire.status === "completed") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <CheckCircle2
            className="mx-auto mb-4 text-accent"
            size={48}
          />
          <p className="text-lg font-bold">Cuestionario Enviado</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Gracias por completar el cuestionario. Tu ejecutivo revisara las
            respuestas.
          </p>
        </div>
      </div>
    );
  }

  // Group responses by service
  const serviceGroups = new Map<
    string,
    typeof localResponses
  >();
  for (const r of localResponses) {
    const key =
      r.serviceNames.length > 1 ? "General" : r.serviceNames[0] ?? "General";
    const group = serviceGroups.get(key) ?? [];
    group.push(r);
    serviceGroups.set(key, group);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <ClipboardList className="text-accent" size={28} />
        </div>
        <h1 className="text-2xl font-bold">Cuestionario</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completa las siguientes preguntas sobre los servicios contratados.
          Puedes guardar tu progreso y continuar despues.
        </p>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div
          className={cn(
            "rounded-md px-4 py-2 text-sm text-center",
            saveMessage.includes("Error")
              ? "bg-destructive/20 text-destructive"
              : "bg-accent/20 text-accent"
          )}
        >
          {saveMessage}
        </div>
      )}

      {/* Questions grouped by service */}
      {Array.from(serviceGroups.entries()).map(([serviceName, questions]) => (
        <div
          key={serviceName}
          className="rounded-lg border border-border bg-card"
        >
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-accent">
              {serviceName}
            </h2>
          </div>
          <div className="divide-y divide-border/50">
            {questions.map((r) => (
              <div key={r.questionId} className="px-4 py-4">
                <label className="mb-2 block text-sm font-medium">
                  {r.questionText}
                </label>
                {r.serviceNames.length > 1 && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Aplica a: {r.serviceNames.join(", ")}
                  </p>
                )}
                <textarea
                  value={r.answer}
                  onChange={(e) =>
                    handleAnswerChange(r.questionId, e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                  placeholder="Escribe tu respuesta..."
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <button
          onClick={handleSaveProgress}
          disabled={saving}
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar Progreso"}
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-primary hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Send size={16} />
          {saving ? "Enviando..." : "Enviar Cuestionario"}
        </button>
      </div>
    </div>
  );
}
