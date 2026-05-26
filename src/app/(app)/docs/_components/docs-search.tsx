"use client";

import { DialogTitle } from "@radix-ui/react-dialog";
import { ChevronRightIcon, ClockIcon, FileTextIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { routes } from "@/config/routes";
import { type DocSearchResult, useDocsSearch } from "@/hooks/use-docs-search";
import { cn } from "@/lib/utils";

// Popular docs for initial suggestions
const POPULAR_DOCS = [
  {
    title: "Overview",
    url: routes.docs,
    description: "What Paperclip Hub is and how to use it",
  },
  {
    title: "Submit a Plugin",
    url: `${routes.docs}/submitting/submit-a-plugin`,
    description: "Add your plugin to the registry",
  },
  {
    title: "Registry Schema",
    url: `${routes.docs}/registry/schema`,
    description: "Fields and categories for a registry entry",
  },
];

// Recent searches storage key
const RECENT_SEARCHES_KEY = "docs-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export function DocsSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, results, isLoading, error, search, clearResults, hasSearched } =
    useDocsSearch({
      debounceDelay: 300,
      minQueryLength: 1,
      limit: 8,
    });

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load recent searches:", error);
    }
  }, []);

  // Open/close the dialog with ⌘K / Ctrl+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setRecentSearches((prev) => {
        const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(
          0,
          MAX_RECENT_SEARCHES
        );
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.warn("Failed to save recent search:", error);
    }
  }, []);

  // Get current items for display (results, popular docs, or recent searches)
  const currentItems = hasSearched ? results : [];
  const showPopularDocs = !hasSearched && !query.trim();
  const showRecentSearches = !hasSearched && query.trim() && recentSearches.length > 0;

  // Calculate total items for keyboard navigation
  const totalItems =
    currentItems.length +
    (showPopularDocs ? POPULAR_DOCS.length : 0) +
    (showRecentSearches ? recentSearches.length : 0);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [totalItems, query]);

  // Handle command execution
  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  // Handle search result navigation
  const handleResultSelect = useCallback(
    (result: DocSearchResult) => {
      saveToRecentSearches(query);
      runCommand(() => router.push(result.url));
    },
    [query, saveToRecentSearches, runCommand, router]
  );

  // Handle popular doc navigation
  const handlePopularDocSelect = useCallback(
    (doc: (typeof POPULAR_DOCS)[0]) => {
      runCommand(() => router.push(doc.url));
    },
    [runCommand, router]
  );

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback(
    (recentQuery: string) => {
      setQuery(recentQuery);
      void search(recentQuery);
    },
    [setQuery, search]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
          break;
        case "Enter": {
          e.preventDefault();
          if (totalItems === 0) return;

          // Determine which item is selected
          let currentIndex = 0;

          // Check search results
          if (selectedIndex < currentItems.length && currentItems[selectedIndex]) {
            handleResultSelect(currentItems[selectedIndex]);
            return;
          }
          currentIndex += currentItems.length;

          // Check popular docs
          if (showPopularDocs && selectedIndex < currentIndex + POPULAR_DOCS.length) {
            const docIndex = selectedIndex - currentIndex;
            if (POPULAR_DOCS[docIndex]) {
              handlePopularDocSelect(POPULAR_DOCS[docIndex]);
              return;
            }
          }
          currentIndex += showPopularDocs ? POPULAR_DOCS.length : 0;

          // Check recent searches
          if (showRecentSearches && selectedIndex < currentIndex + recentSearches.length) {
            const recentIndex = selectedIndex - currentIndex;
            if (recentSearches[recentIndex]) {
              handleRecentSearchSelect(recentSearches[recentIndex]);
              return;
            }
          }
          break;
        }
        case "Escape":
          setOpen(false);
          break;
      }
    },
    [
      open,
      totalItems,
      selectedIndex,
      currentItems,
      showPopularDocs,
      showRecentSearches,
      recentSearches,
      handleResultSelect,
      handlePopularDocSelect,
      handleRecentSearchSelect,
    ]
  );

  // Handle dialog open/close
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        clearResults();
        setSelectedIndex(0);
      } else {
        // Focus input when dialog opens
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [clearResults]
  );

  // Render search result item
  const renderSearchResult = (result: DocSearchResult, index: number) => {
    const isSelected = selectedIndex === index;

    return (
      <CommandItem
        key={`result-${index}`}
        value={`result-${result.title}-${index}`}
        onSelect={() => handleResultSelect(result)}
        className={cn("flex cursor-pointer items-start gap-3 p-3", isSelected && "bg-accent")}
      >
        <FileTextIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{result.title}</span>
            {result.section && (
              <Badge variant="outline" className="text-xs">
                {result.section}
              </Badge>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{result.content}</p>
        </div>
        <ChevronRightIcon className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
      </CommandItem>
    );
  };

  // Render popular doc item
  const renderPopularDoc = (doc: (typeof POPULAR_DOCS)[0], index: number) => {
    const isSelected = selectedIndex === currentItems.length + index;

    return (
      <CommandItem
        key={`popular-${index}`}
        value={`popular-${doc.title}-${index}`}
        onSelect={() => handlePopularDocSelect(doc)}
        className={cn("flex cursor-pointer items-center gap-3 p-3", isSelected && "bg-accent")}
      >
        <FileTextIcon className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <span className="text-sm font-medium">{doc.title}</span>
          <p className="text-xs text-muted-foreground">{doc.description}</p>
        </div>
      </CommandItem>
    );
  };

  // Render recent search item
  const renderRecentSearch = (recentQuery: string, index: number) => {
    const isSelected = selectedIndex === currentItems.length + index;

    return (
      <CommandItem
        key={`recent-${index}`}
        value={`recent-${recentQuery}-${index}`}
        onSelect={() => handleRecentSearchSelect(recentQuery)}
        className={cn("flex cursor-pointer items-center gap-3 p-3", isSelected && "bg-accent")}
      >
        <ClockIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{recentQuery}</span>
      </CommandItem>
    );
  };

  return (
    <>
      <button
        type="button"
        className="hc-sm-search"
        onClick={() => setOpen(true)}
        aria-label="Search documentation"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span>Search the docs…</span>
        <span className="kbd">⌘K</span>
      </button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <div className="flex h-[300px] w-full flex-col">
          <DialogTitle className="sr-only">Search Documentation</DialogTitle>
          <CommandInput
            ref={inputRef}
            placeholder="Type to search documentation..."
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleKeyDown}
          />
          <CommandList className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
            )}

            {error && (
              <div className="p-4 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!isLoading && !error && hasSearched && results.length === 0 && (
              <CommandEmpty>No results found for "{query}"</CommandEmpty>
            )}

            {/* Search Results */}
            {!isLoading && results.length > 0 && (
              <CommandGroup heading="Documentation">
                {results.map((result, index) => renderSearchResult(result, index))}
              </CommandGroup>
            )}

            {/* Popular Documentation */}
            {!isLoading && showPopularDocs && (
              <CommandGroup heading="Popular Documentation">
                {POPULAR_DOCS.map((doc, index) => renderPopularDoc(doc, index))}
              </CommandGroup>
            )}

            {/* Recent Searches */}
            {!isLoading && showRecentSearches && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((recentQuery, index) => renderRecentSearch(recentQuery, index))}
              </CommandGroup>
            )}
          </CommandList>
        </div>
      </CommandDialog>
    </>
  );
}
