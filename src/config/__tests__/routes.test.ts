import { describe, expect, it } from "vitest";
import { routes } from "../routes";

describe("Routes Configuration", () => {
  describe("Route Format Validation", () => {
    const validateRoutes = (obj: Record<string, any>, parentPath = "") => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          it(`${parentPath}${key} should be a valid route format`, () => {
            // Check if route starts with /
            expect(value).toMatch(/^\//);

            // Check for no trailing slash (unless it's just /)
            expect(value).toMatch(/^\/.*[^/]$|^\/$/);

            // Check for no double slashes
            expect(value).not.toMatch(/\/\//);

            // Check for kebab-case in path segments
            const segments = value.split("/").slice(1);
            for (const segment of segments) {
              if (segment && !segment.startsWith(":")) {
                expect(segment).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
              }
            }
          });
        } else if (typeof value === "object" && value !== null) {
          validateRoutes(value, `${key}.`);
        }
      }
    };

    validateRoutes(routes);
  });

  describe("Route Uniqueness", () => {
    it("should have unique route paths", () => {
      const paths = new Set<string>();
      const findPaths = (obj: Record<string, any>) => {
        for (const value of Object.values(obj)) {
          if (typeof value === "string") {
            // Skip external URLs and mailto links
            if (!value.startsWith("http") && !value.startsWith("mailto:")) {
              expect(paths.has(value)).toBeFalsy();
              paths.add(value);
            }
          } else if (typeof value === "object" && value !== null) {
            findPaths(value);
          }
        }
      };

      findPaths(routes);
    });
  });

  describe("Dynamic Route Parameters", () => {
    it("should have valid parameter format", () => {
      const findDynamicRoutes = (obj: Record<string, any>) => {
        for (const value of Object.values(obj)) {
          if (typeof value === "string") {
            // Check if route has parameters
            if (value.includes("/:")) {
              // Parameters should be in format /:paramName
              expect(value).toMatch(/\/:[a-zA-Z][a-zA-Z0-9]*/);
            }
          } else if (typeof value === "object" && value !== null) {
            findDynamicRoutes(value);
          }
        }
      };

      findDynamicRoutes(routes);
    });
  });
});
