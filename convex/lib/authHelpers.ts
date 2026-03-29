import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("No autenticado. Inicia sesión para continuar.");
  }
  return identity;
}

export async function getOrgId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await requireAuth(ctx);
  // Clerk JWT may use org_id (snake_case) or orgId (camelCase) depending on version
  const orgId = (identity.orgId ?? (identity as Record<string, unknown>).org_id) as string | undefined;
  if (!orgId) {
    throw new Error("No se encontró la organización. Selecciona una organización.");
  }
  return orgId;
}

/**
 * Safe version for queries - returns null instead of throwing
 * so Convex reactive queries don't error before auth is ready.
 */
export async function getOrgIdSafe(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ((identity.orgId ?? (identity as Record<string, unknown>).org_id) as string | undefined) ?? null;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireAuth(ctx);
  const role = (identity.orgRole as string) ?? "org:member";
  if (role !== "org:admin") {
    throw new Error("Acceso denegado. Se requiere rol de Administrador.");
  }
  return identity;
}

export async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireAuth(ctx);
  // Check publicMetadata (Convex standard) or metadata claim (custom JWT)
  const publicMeta = identity.publicMetadata as Record<string, unknown> | undefined;
  const customMeta = (identity as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
  const role = publicMeta?.role ?? customMeta?.role;
  if (role !== "super_admin") {
    throw new Error("Acceso denegado. Se requiere rol de Super Admin.");
  }
  return identity;
}
