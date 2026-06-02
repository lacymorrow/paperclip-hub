import type { Route } from "next";

export interface Redirect {
  source: Route;
  destination: Route;
  permanent: boolean;
}

export const redirects = async (): Promise<Redirect[]> => [
  { source: "/plugins" as Route, destination: "/" as Route, permanent: true },
];
