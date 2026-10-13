import type { ReactNode } from "react";
import {
  type BuildAndServePlacement,
  buildAndServeEvent,
  buildAndServeUrl,
} from "@/config/build-and-serve";

export function BuildAndServeLink({
  placement,
  children,
}: {
  placement: BuildAndServePlacement;
  children: ReactNode;
}) {
  return (
    <a
      href={buildAndServeUrl(placement)}
      target="_blank"
      rel="noopener"
      className="hc-bas-link"
      {...buildAndServeEvent(placement)}
    >
      {children}
    </a>
  );
}
