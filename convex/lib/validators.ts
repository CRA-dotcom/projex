// Mexican RFC validation pattern
// Format: 3-4 letters + 6 digits (YYMMDD) + 3 alphanumeric (homoclave)
// Personas morales: 3 letters + 6 digits + 3 alphanumeric = 12 chars
// Personas físicas: 4 letters + 6 digits + 3 alphanumeric = 13 chars
export const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

export function isValidRFC(rfc: string): boolean {
  return RFC_PATTERN.test(rfc.toUpperCase());
}

export const INDUSTRIES = [
  "Manufactura",
  "Comercio",
  "Servicios",
  "Construcción",
  "Tecnología",
  "Alimentos y Bebidas",
  "Salud",
  "Educación",
  "Transporte y Logística",
  "Inmobiliaria",
  "Agricultura",
  "Energía",
  "Financiera",
  "Otro",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
