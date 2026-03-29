import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { wrapWithBranding } from "./pdfBrandingWrapper";
import type { BrandingConfig } from "./pdfBrandingWrapper";

export type { BrandingConfig } from "./pdfBrandingWrapper";

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Generates a PDF Blob from HTML content with branding applied.
 *
 * 1. Creates a hidden container and injects the branded HTML.
 * 2. Renders the container to a canvas via html2canvas.
 * 3. Splits the canvas across A4 pages using jsPDF.
 * 4. Returns the resulting PDF as a Blob.
 */
export async function generatePDF(
  htmlContent: string,
  branding: BrandingConfig,
  _filename: string
): Promise<Blob> {
  // Wrap content with branding layout
  const fullHtml = wrapWithBranding(htmlContent, branding);

  // Create an off-screen container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  // Use a fixed pixel width that maps to A4 at 96 DPI (~794px)
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = fullHtml;
  document.body.appendChild(container);

  try {
    // Render HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2, // 2x for sharp text
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Calculate dimensions for A4
    const imgWidth = A4_WIDTH_MM;
    const imgHeight = (canvas.height * A4_WIDTH_MM) / canvas.width;
    const pageHeight = A4_HEIGHT_MM;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL("image/png");

    // First page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Additional pages if content overflows
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output("blob");
  } finally {
    // Always clean up the hidden container
    document.body.removeChild(container);
  }
}

/**
 * Triggers a browser download for a PDF Blob.
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
