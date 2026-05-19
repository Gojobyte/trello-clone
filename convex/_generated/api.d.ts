/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as attachments from "../attachments.js";
import type * as auth from "../auth.js";
import type * as boardMembers from "../boardMembers.js";
import type * as boards from "../boards.js";
import type * as cards from "../cards.js";
import type * as checklistItems from "../checklistItems.js";
import type * as comments from "../comments.js";
import type * as http from "../http.js";
import type * as labels from "../labels.js";
import type * as lib_activity from "../lib_activity.js";
import type * as lib_auth from "../lib_auth.js";
import type * as lib_board_access from "../lib_board_access.js";
import type * as lib_workspace_access from "../lib_workspace_access.js";
import type * as lists from "../lists.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as workspaceMembers from "../workspaceMembers.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  attachments: typeof attachments;
  auth: typeof auth;
  boardMembers: typeof boardMembers;
  boards: typeof boards;
  cards: typeof cards;
  checklistItems: typeof checklistItems;
  comments: typeof comments;
  http: typeof http;
  labels: typeof labels;
  lib_activity: typeof lib_activity;
  lib_auth: typeof lib_auth;
  lib_board_access: typeof lib_board_access;
  lib_workspace_access: typeof lib_workspace_access;
  lists: typeof lists;
  migrations: typeof migrations;
  notifications: typeof notifications;
  workspaceMembers: typeof workspaceMembers;
  workspaces: typeof workspaces;
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

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
