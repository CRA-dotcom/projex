"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { BrandingConfig } from "./pdfBrandingWrapper";
import type { Id } from "../../convex/_generated/dataModel";

export type PdfGeneratorState = {
  isGenerating: boolean;
  isUploading: boolean;
  error: string | null;
};

export type PdfGeneratorResult = {
  blob: Blob;
  storageId: Id<"_storage">;
};

/**
 * React hook that generates a branded PDF from HTML content,
 * uploads it to Convex Storage, and returns the storageId.
 *
 * Usage:
 * ```tsx
 * const { generate, download, state } = usePdfGenerator();
 * const result = await generate(html, branding, "report.pdf");
 * // result.storageId can be saved to a Convex document
 * // Or just download without uploading:
 * await download(html, branding, "report.pdf");
 * ```
 */
export function usePdfGenerator() {
  const [state, setState] = useState<PdfGeneratorState>({
    isGenerating: false,
    isUploading: false,
    error: null,
  });

  const generateUploadUrl = useMutation(
    api.functions.storage.mutations.generateUploadUrl
  );

  /**
   * Generate a PDF, upload to Convex Storage, return blob + storageId.
   */
  const generate = useCallback(
    async (
      htmlContent: string,
      branding: BrandingConfig,
      filename: string
    ): Promise<PdfGeneratorResult> => {
      setState({ isGenerating: true, isUploading: false, error: null });

      try {
        // Dynamic import to keep bundle size small for pages that don't use PDF
        const { generatePDF } = await import("./pdfGenerator");

        const blob = await generatePDF(htmlContent, branding, filename);
        setState((prev) => ({ ...prev, isGenerating: false, isUploading: true }));

        // Upload to Convex Storage
        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/pdf" },
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Error al subir PDF: ${uploadResponse.status} ${uploadResponse.statusText}`
          );
        }

        const { storageId } = (await uploadResponse.json()) as {
          storageId: Id<"_storage">;
        };

        setState({ isGenerating: false, isUploading: false, error: null });

        return { blob, storageId };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido al generar PDF";
        setState({ isGenerating: false, isUploading: false, error: message });
        throw err;
      }
    },
    [generateUploadUrl]
  );

  /**
   * Generate a PDF and trigger a browser download (no upload).
   */
  const download = useCallback(
    async (
      htmlContent: string,
      branding: BrandingConfig,
      filename: string
    ): Promise<void> => {
      setState({ isGenerating: true, isUploading: false, error: null });

      try {
        const { generatePDF, downloadPDF } = await import("./pdfGenerator");
        const blob = await generatePDF(htmlContent, branding, filename);
        downloadPDF(blob, filename);
        setState({ isGenerating: false, isUploading: false, error: null });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido al generar PDF";
        setState({ isGenerating: false, isUploading: false, error: message });
        throw err;
      }
    },
    []
  );

  return { generate, download, state };
}
