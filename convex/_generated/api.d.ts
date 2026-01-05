/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as functions from "../functions.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_firstService from "../lib/firstService.js";
import type * as lib_matchTransform from "../lib/matchTransform.js";
import type * as lib_tbaService from "../lib/tbaService.js";
import type * as matches from "../matches.js";
import type * as scores from "../scores.js";
import type * as types from "../types.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  events: typeof events;
  functions: typeof functions;
  "lib/env": typeof lib_env;
  "lib/firstService": typeof lib_firstService;
  "lib/matchTransform": typeof lib_matchTransform;
  "lib/tbaService": typeof lib_tbaService;
  matches: typeof matches;
  scores: typeof scores;
  types: typeof types;
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
