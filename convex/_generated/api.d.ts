/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_clients_mutations from "../functions/clients/mutations.js";
import type * as functions_clients_queries from "../functions/clients/queries.js";
import type * as functions_organizations_mutations from "../functions/organizations/mutations.js";
import type * as functions_organizations_queries from "../functions/organizations/queries.js";
import type * as functions_projections_mutations from "../functions/projections/mutations.js";
import type * as functions_projections_queries from "../functions/projections/queries.js";
import type * as functions_services_queries from "../functions/services/queries.js";
import type * as functions_services_seed from "../functions/services/seed.js";
import type * as lib_authHelpers from "../lib/authHelpers.js";
import type * as lib_projectionEngine from "../lib/projectionEngine.js";
import type * as lib_validators from "../lib/validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/clients/mutations": typeof functions_clients_mutations;
  "functions/clients/queries": typeof functions_clients_queries;
  "functions/organizations/mutations": typeof functions_organizations_mutations;
  "functions/organizations/queries": typeof functions_organizations_queries;
  "functions/projections/mutations": typeof functions_projections_mutations;
  "functions/projections/queries": typeof functions_projections_queries;
  "functions/services/queries": typeof functions_services_queries;
  "functions/services/seed": typeof functions_services_seed;
  "lib/authHelpers": typeof lib_authHelpers;
  "lib/projectionEngine": typeof lib_projectionEngine;
  "lib/validators": typeof lib_validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
