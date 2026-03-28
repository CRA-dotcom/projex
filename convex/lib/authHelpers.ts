import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

export type AuthContext = QueryCtx | MutationCtx | ActionCtx;

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("No autenticado. Inicia sesión para continuar.");
  }
  return identity;
}

export async function getOrgId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await requireAuth(ctx);
  const orgId = identity.orgId as string | undefined;
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
  return (identity.orgId as string | undefined) ?? null;
}

export async function getUserRole(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await requireAuth(ctx);
  return (identity.orgRole as string) ?? "org:member";
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireAuth(ctx);
  const role = (identity.orgRole as string) ?? "org:member";
  if (role !== "org:admin") {
    throw new Error("Acceso denegado. Se requiere rol de Administrador.");
  }
  return identity;
}

export async function isSuperAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;
  const metadata = identity.publicMetadata as Record<string, unknown> | undefined;
  return metadata?.role === "super_admin";
}

export async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireAuth(ctx);
  const isSuper = await isSuperAdmin(ctx);
  if (!isSuper) {
    throw new Error("Acceso denegado. Se requiere rol de Super Admin.");
  }
  return identity;
}
