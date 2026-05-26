"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { NavSection } from "@/lib/docs";
import { cn } from "@/lib/utils/cn";

interface DocsSidebarProps {
  className?: string;
  navigation: NavSection[];
}

// Drop a trailing slash so the active check matches regardless of trailing-slash config.
const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

export function DocsSidebar({ className, navigation }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("w-full", className)}>
      <Accordion
        type="multiple"
        defaultValue={navigation.map((section) => section.title)}
        className="space-y-1"
      >
        {navigation.map((section) => (
          <AccordionItem key={section.title} value={section.title} className="border-none px-1">
            <AccordionTrigger className="py-1.5 hover:no-underline">
              <span className="docs-nav-trigger">{section.title}</span>
            </AccordionTrigger>
            {section.items?.length && (
              <AccordionContent className="pb-1 pt-0">
                <div className="mt-1 flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "docs-nav-link",
                        normalizePath(pathname ?? "") === normalizePath(item.href) && "is-active"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
