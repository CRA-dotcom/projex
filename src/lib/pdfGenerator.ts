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

    /* Page break control — aggressive rules */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid !important;
      break-after: avoid !important;
      /* Keep heading with at least 3 lines of next content */
      orphans: 3;
      widows: 3;
    }

    /* Never break inside these elements */
    table, figure, blockquote, pre, ul, ol,
    .section, .card, .kpi-card, .finding-card,
    div > p + ul, div > p + ol {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Keep a heading with its following content block together */
    h2 + *, h3 + *, h4 + * {
      page-break-before: avoid !important;
      break-before: avoid !important;
    }

    /* Wrap each "section" (h2/h3 followed by content) as a group.
       This JS below will auto-wrap content for better breaks */

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
    /* Auto-wrapped sections */
    .print-section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 8pt;
    }
  </style>
</head>
<body>
  ${fullHtml}
  <div class="doc-footer">
    ${branding.footerText || branding.companyName} — Documento confidencial — ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
  <script>
    // Auto-wrap content sections for better page breaks
    // Group each heading with its following content into a div.print-section
    document.querySelectorAll('h2, h3, h4, strong').forEach(function(heading) {
      // If the heading's parent is already a print-section, skip
      if (heading.parentElement && heading.parentElement.classList.contains('print-section')) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'print-section';
      heading.parentNode.insertBefore(wrapper, heading);
      wrapper.appendChild(heading);

      // Move following siblings into the wrapper until we hit another heading or have enough content
      var next = wrapper.nextSibling;
      var count = 0;
      while (next && count < 6) {
        var tag = next.nodeName;
        // Stop at next heading of same or higher level
        if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'HR') break;
        // Stop at another strong that looks like a sub-heading
        if (tag === 'P' && next.querySelector && next.querySelector('strong:first-child') && count > 0) break;
        var toMove = next;
        next = next.nextSibling;
        wrapper.appendChild(toMove);
        count++;
      }
    });
  </script>
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
