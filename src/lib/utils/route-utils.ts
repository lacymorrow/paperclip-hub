import type { Route } from "next";
import { type RouteObject, type RouteParams, routes } from "@/config/routes";

export const getRoutePath = (route: Route | RouteObject, params: RouteParams = {}): Route => {
  if (typeof route === "string") {
    return route;
  }

  let path = route.path;
  // First, replace using provided params
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      path = path.replace(`:${key}`, String(value));
    }
  }

  // Then, fill remaining placeholders with defaults if any
  for (const [key, defaultValue] of Object.entries(route.params ?? {})) {
    if (path.includes(`:${key}`) && defaultValue !== null && defaultValue !== undefined) {
      path = path.replace(`:${key}`, String(defaultValue));
    }
  }
  return path;
};

type NestedPaths<T, P extends string = "", D extends never[] = []> = D["length"] extends 8
  ? never
  : T extends object
    ? {
        [K in keyof T & string]: T[K] extends (...args: any[]) => any
          ? `${P}${P extends "" ? "" : "."}${K}`
          : T[K] extends object
            ?
                | NestedPaths<T[K], `${P}${P extends "" ? "" : "."}${K}`, [never, ...D]>
                | `${P}${P extends "" ? "" : "."}${K}`
            : `${P}${P extends "" ? "" : "."}${K}`;
      }[keyof T & string]
    : never;

type RoutePath = NestedPaths<typeof routes>;

export const rx = (path: RoutePath, params?: RouteParams): Route => {
  const parts = path?.split(".") ?? [];
  let current: unknown = routes;

  for (const part of parts) {
    if (
      current &&
      typeof current === "object" &&
      part in current &&
      current[part as keyof typeof current] !== undefined
    ) {
      current = current[part as keyof typeof current];
    } else {
      throw new Error(`Route not found: ${path}`);
    }
  }

  if (current && typeof current === "object" && "index" in current) {
    return getRoutePath(current.index as RouteObject | string, params ?? {});
  }

  return getRoutePath(current as RouteObject | string, params ?? {});
};
