import { wrapWithBranding } from "./pdfBrandingWrapper";
import type { BrandingConfig } from "./pdfBrandingWrapper";

export type { BrandingConfig } from "./pdfBrandingWrapper";

/**
 * Generates a PDF by opening a print-ready window with the branded HTML.
 * Uses the browser's native print dialog which:
 * - Respects CSS page-break rules
 * - Generates vector text (not images) — sharp and small file size
 * - Handles tables, headings, and sections properly
 */
export async function generatePDF(
  htmlContent: string,
  branding: BrandingConfig,
  filename: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Build the full print-ready document
    const fullHtml = wrapWithBranding(htmlContent, branding);

    const printDocument = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 25mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: ${branding.fontFamily || "'IBM Plex Sans', sans-serif"};
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      background: white;
    }

    /* Page break control */
    h1, h2, h3, h4 {
      page-break-after: avoid;
      break-after: avoid;
    }

    table, figure, .section, .card, .kpi-card, .finding-card {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Ensure tables look good */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 10pt;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: ${branding.primaryColor || '#1a1a2e'} !important;
      color: white !important;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Section spacing */
    h2 {
      color: ${branding.primaryColor || '#1a1a2e'};
      border-bottom: 2px solid ${branding.secondaryColor || '#6c63ff'};
      padding-bottom: 6pt;
      margin-top: 24pt;
      margin-bottom: 12pt;
      font-size: 16pt;
    }

    h3 {
      color: ${branding.primaryColor || '#1a1a2e'};
      margin-top: 18pt;
      margin-bottom: 8pt;
      font-size: 13pt;
    }

    h4 {
      margin-top: 12pt;
      margin-bottom: 6pt;
      font-size: 11pt;
    }

    p {
      margin: 6pt 0;
    }

    ul, ol {
      margin: 6pt 0;
      padding-left: 24pt;
    }

    li {
      margin: 3pt 0;
    }

    /* Header area */
    .doc-header {
      text-align: center;
      padding: 20pt 0;
      border-bottom: 3px solid ${branding.primaryColor || '#1a1a2e'};
      margin-bottom: 20pt;
    }

    .doc-header h1 {
      color: ${branding.primaryColor || '#1a1a2e'};
      font-size: 22pt;
      margin: 0;
    }

    .doc-header .subtitle {
      color: ${branding.secondaryColor || '#6c63ff'};
      font-size: 12pt;
      margin-top: 6pt;
    }

    /* Footer */
    .doc-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #999;
      padding: 8pt 15mm;
      border-top: 1px solid #eee;
    }

    /* Force page breaks where marked */
    .page-break {
      page-break-before: always;
      break-before: always;
    }

    /* Signature blocks */
    .signature-block {
      page-break-inside: avoid;
      margin-top: 30pt;
      padding-top: 20pt;
      border-top: 1px solid #ccc;
    }

    .signature-line {
      border-bottom: 1px solid #333;
      width: 200px;
      margin-top: 40pt;
      margin-bottom: 6pt;
    }
  </style>
</head>
<body>
  ${fullHtml}
  <div class="doc-footer">
    ${branding.footerText || branding.companyName} — Documento confidencial — ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
</body>
</html>`;

    // Open a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      reject(new Error("No se pudo abrir la ventana de impresión. Permite ventanas emergentes."));
      return;
    }

    printWindow.document.write(printDocument);
    printWindow.document.close();

    // Wait for content to render, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Note: We can't get the Blob from print dialog,
        // so we return an empty blob. The actual PDF is saved by the user.
        printWindow.close();
        resolve(new Blob([""], { type: "application/pdf" }));
      }, 500);
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      resolve(new Blob([""], { type: "application/pdf" }));
    }, 3000);
  });
}

/**
 * Triggers a browser download for a PDF Blob.
 * Note: With the print approach, the user saves from the print dialog.
 * This function is kept for backward compatibility with stored PDFs.
 */
export function downloadPDF(blob: Blob, filename: string): void {
  if (blob.size === 0) return; // Print-based generation, user already saved
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
