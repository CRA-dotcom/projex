export type BrandingConfig = {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontFamily: string;
  headerText?: string;
  footerText?: string;
};

/**
 * Wraps resolved HTML content with a branded layout including header, footer,
 * and CSS styling derived from the BrandingConfig.
 */
export function wrapWithBranding(
  htmlContent: string,
  branding: BrandingConfig
): string {
  const {
    companyName,
    logoUrl,
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    headerText,
    footerText,
  } = branding;

  const accent = accentColor ?? primaryColor;

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 48px; max-width: 160px; object-fit: contain;" />`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily).replace(/%20/g, "+")}&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: '${fontFamily}', 'Segoe UI', Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.6;
    }

    .pdf-page {
      width: 210mm;
      min-height: 270mm;
      padding: 20mm 18mm 24mm 18mm;
      position: relative;
    }

    /* --- Header --- */
    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      margin-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }

    .pdf-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pdf-header-company {
      font-size: 16pt;
      font-weight: 700;
      color: ${primaryColor};
    }

    .pdf-header-text {
      font-size: 9pt;
      color: ${secondaryColor};
      text-align: right;
      max-width: 200px;
    }

    /* --- Body --- */
    .pdf-body {
      min-height: 220mm;
    }

    .pdf-body h1 {
      color: ${primaryColor};
      font-size: 18pt;
      margin-bottom: 12px;
      border-bottom: 1px solid ${accent};
      padding-bottom: 6px;
    }

    .pdf-body h2 {
      color: ${secondaryColor};
      font-size: 14pt;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    .pdf-body h3 {
      color: ${primaryColor};
      font-size: 12pt;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    .pdf-body p {
      margin-bottom: 8px;
    }

    .pdf-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }

    .pdf-body th {
      background-color: ${primaryColor};
      color: #ffffff;
      font-weight: 600;
      padding: 8px 10px;
      text-align: left;
      font-size: 10pt;
    }

    .pdf-body td {
      padding: 6px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10pt;
    }

    .pdf-body tr:nth-child(even) td {
      background-color: #f9fafb;
    }

    .pdf-body ul, .pdf-body ol {
      margin: 8px 0 8px 20px;
    }

    .pdf-body li {
      margin-bottom: 4px;
    }

    /* --- Footer --- */
    .pdf-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px solid ${secondaryColor};
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #6b7280;
    }

    .pdf-footer-text {
      flex: 1;
    }

    .pdf-footer-page {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="pdf-page">
    <div class="pdf-header">
      <div class="pdf-header-left">
        ${logoHtml}
        <span class="pdf-header-company">${companyName}</span>
      </div>
      ${headerText ? `<div class="pdf-header-text">${headerText}</div>` : ""}
    </div>

    <div class="pdf-body">
      ${htmlContent}
    </div>

    <div class="pdf-footer">
      <div class="pdf-footer-text">${footerText ?? `${companyName} — Documento confidencial`}</div>
      <div class="pdf-footer-page"></div>
    </div>
  </div>
</body>
</html>`;
}
