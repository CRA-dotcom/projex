import { wrapWithBranding } from "./pdfBrandingWrapper";
import type { BrandingConfig } from "./pdfBrandingWrapper";

export type { BrandingConfig } from "./pdfBrandingWrapper";

/**
 * Generates a PDF via the server-side Puppeteer API route.
 * Returns the PDF as a Blob.
 */
export async function generatePDF(
  htmlContent: string,
  branding: BrandingConfig,
  filename: string
): Promise<Blob> {
  const fullHtml = wrapWithBranding(htmlContent, branding);

  const brandingVars: Record<string, string> = {
    "--brand-primary": branding.primaryColor || "#1a1a2e",
    "--brand-secondary": branding.secondaryColor || "#6c63ff",
    "--brand-accent": branding.accentColor || "#22c55e",
    "--brand-font": branding.fontFamily || "'IBM Plex Sans', sans-serif",
    "--primary-color": branding.primaryColor || "#1a1a2e",
    "--accent-color": branding.accentColor || "#22c55e",
    "--secondary-color": branding.secondaryColor || "#6c63ff",
    "--font-family": branding.fontFamily || "'IBM Plex Sans', sans-serif",
  };

  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      html: fullHtml,
      brandingVars,
      filename,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `PDF generation failed: ${response.status}`);
  }

  return response.blob();
}

/**
 * Triggers a browser download for a PDF Blob.
 */
export function downloadPDF(blob: Blob, filename: string): void {
  if (blob.size === 0) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
