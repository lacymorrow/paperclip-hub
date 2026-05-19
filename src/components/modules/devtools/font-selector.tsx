"use client";

import { Check, ChevronsUpDown, ListPlus, Loader2 } from "lucide-react";
import * as React from "react";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type FontCategory, GOOGLE_FONTS } from "@/config/fonts";
import { env } from "@/env";
import { cn } from "@/lib/utils";

interface FontWithCategory {
  family: string;
  category: FontCategory;
}

interface FontsApiResponse {
  fonts: FontWithCategory[];
  families: string[];
  fallbackStacks: Record<string, string>;
  fallback: string;
  hasMore?: boolean;
  isCurated?: boolean;
  error?: string;
}

const DEBOUNCE_DELAY = 300;
const BROWSE_LIMIT = 50;
const FONT_API_PATH = "/dev/api/fonts";

/**
 * Font selector with category-aware CSS variable targeting.
 * Serif fonts update --font-serif, sans-serif/display/handwriting update --font-sans,
 * monospace updates --font-mono. Also switches the body's Tailwind font class accordingly.
 */
export function FontSelector() {
  const fontSelectorEnabled = env.NEXT_PUBLIC_FEATURE_DEVTOOLS_FONT_SELECTOR_ENABLED;
  const [open, setOpen] = React.useState(false);
  const [selectedFont, setSelectedFont] = React.useState<string>("");

  const [initialLoading, setInitialLoading] = React.useState(true);
  const [initialError, setInitialError] = React.useState<string | null>(null);

  // Font category lookup: family -> category
  const [fontCategories, setFontCategories] = React.useState<Map<string, FontCategory>>(new Map());

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, DEBOUNCE_DELAY);
  const [searchResults, setSearchResults] = React.useState<FontWithCategory[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // Browse state
  const [browsedFonts, setBrowsedFonts] = React.useState<FontWithCategory[]>([]);
  const [browsePage, setBrowsePage] = React.useState(1);
  const [browseHasMore, setBrowseHasMore] = React.useState(false);
  const [browseLoading, setBrowseLoading] = React.useState(false);
  const [browseError, setBrowseError] = React.useState<string | null>(null);

  const [isCuratedList, setIsCuratedList] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Apply font globally: injects a <style> tag that forces font-family on all elements.
  // This bypasses next/font scoped class names, Tailwind utilities, and CSS variable
  // specificity issues by using !important on *, body, and common element selectors.
  const applyFont = React.useCallback((fontFamily: string) => {
    if (typeof window === "undefined") return;

    const fallback = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

    // Remove old font link
    const existingLink = document.head.querySelector('link[data-font-selector="true"]');
    if (existingLink) document.head.removeChild(existingLink);

    // Remove old override style
    const existingStyle = document.head.querySelector('style[data-font-selector-override="true"]');
    if (existingStyle) document.head.removeChild(existingStyle);

    if (!fontFamily) return;

    // Load font from Google Fonts CDN
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    const link = document.createElement("link");
    link.href = fontUrl;
    link.rel = "stylesheet";
    link.setAttribute("data-font-selector", "true");
    document.head.appendChild(link);

    // Build the font-family value
    const fontName = fontFamily.includes(" ") ? `"${fontFamily}"` : fontFamily;
    const fontValue = `${fontName}, ${fallback}`;

    // Inject a <style> tag that forces the font on everything
    const style = document.createElement("style");
    style.setAttribute("data-font-selector-override", "true");
    style.textContent = `
        *, *::before, *::after { font-family: ${fontValue} !important; }
      `;
    document.head.appendChild(style);
  }, []);

  // Register font categories from API responses
  const registerCategories = React.useCallback((fonts: FontWithCategory[]) => {
    setFontCategories((prev) => {
      const next = new Map(prev);
      for (const font of fonts) {
        next.set(font.family, font.category);
      }
      return next;
    });
  }, []);

  // Fetch initial data
  React.useEffect(() => {
    setMounted(true);
    const fetchInitialData = async () => {
      setInitialLoading(true);
      setInitialError(null);
      setBrowseError(null);
      setBrowseLoading(true);
      try {
        const response = await fetch(`${FONT_API_PATH}?page=1&limit=${BROWSE_LIMIT}`);
        if (!response.ok) {
          const data: Partial<FontsApiResponse> = await response.json();
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        const data: FontsApiResponse = await response.json();

        setBrowsedFonts(data.fonts || []);
        setBrowseHasMore(data.hasMore ?? false);
        setBrowsePage(1);
        setIsCuratedList(data.isCurated ?? false);
        registerCategories(data.fonts || []);
      } catch (e: unknown) {
        console.error("Failed to fetch initial font data:", e);
        const errorMsg = e instanceof Error ? e.message : "Failed to load initial data";
        setInitialError(errorMsg);
        setBrowseError(errorMsg);
        // Fall back to curated list categories
        registerCategories(GOOGLE_FONTS);
      } finally {
        setInitialLoading(false);
        setBrowseLoading(false);
      }
    };
    fetchInitialData();
  }, [registerCategories]);

  // Set initial font once loaded
  React.useEffect(() => {
    if (!mounted || initialLoading || selectedFont) return;
    const currentStyle = document.body.style.fontFamily;
    if (currentStyle) {
      const fontParts = currentStyle.split(",");
      const firstFont = fontParts[0]?.trim().replace(/['"]/g, "");
      if (firstFont && fontCategories.has(firstFont)) {
        setSelectedFont(firstFont);
        return;
      }
    }
    const defaultFont = GOOGLE_FONTS.find((f) => f.family === "Inter")?.family || "";
    setSelectedFont(defaultFont);
  }, [mounted, initialLoading, fontCategories]);

  // Load more browse fonts
  const loadMoreFonts = React.useCallback(async () => {
    if (browseLoading || !browseHasMore) return;
    setBrowseLoading(true);
    setBrowseError(null);
    const nextPage = browsePage + 1;
    try {
      const response = await fetch(`${FONT_API_PATH}?page=${nextPage}&limit=${BROWSE_LIMIT}`);
      if (!response.ok) {
        const data: Partial<FontsApiResponse> = await response.json();
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      const data: FontsApiResponse = await response.json();
      const newFonts = data.fonts || [];
      setBrowsedFonts((prev) => [...prev, ...newFonts]);
      setBrowseHasMore(data.hasMore ?? false);
      setBrowsePage(nextPage);
      registerCategories(newFonts);
    } catch (e: unknown) {
      console.error("Failed to load more fonts:", e);
      setBrowseError(e instanceof Error ? e.message : "Failed to load more fonts");
    } finally {
      setBrowseLoading(false);
    }
  }, [browseLoading, browseHasMore, browsePage, registerCategories]);

  // Search effect
  React.useEffect(() => {
    if (!debouncedSearchQuery) {
      setSearchResults([]);
      return;
    }
    const searchFonts = async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `${FONT_API_PATH}?search=${encodeURIComponent(debouncedSearchQuery)}`
        );
        if (!response.ok) {
          const data: Partial<FontsApiResponse> = await response.json();
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        const data: FontsApiResponse = await response.json();
        const fonts = data.fonts || [];
        setSearchResults(fonts);
        registerCategories(fonts);
      } catch (e: unknown) {
        console.error("Failed to search fonts:", e);
        setSearchError(e instanceof Error ? e.message : "Failed to search fonts");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    searchFonts();
  }, [debouncedSearchQuery, registerCategories]);

  // Apply selected font whenever it changes
  React.useEffect(() => {
    if (mounted) {
      applyFont(selectedFont);
    }
  }, [selectedFont, mounted, applyFont]);

  if (!fontSelectorEnabled) return null;
  if (!mounted) return null;

  const handleSelectFont = (currentValue: string) => {
    const newFont = currentValue === selectedFont ? "" : currentValue;
    setSelectedFont(newFont);
    setSearchQuery("");
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError(null);
    setOpen(false);
  };

  const isReady = mounted && !initialLoading;
  const hasError = !!initialError;

  // Helper to render a category badge
  const categoryBadge = (category: FontCategory | undefined) => {
    if (!category || category === "sans-serif") return null;
    const short = category === "handwriting" ? "hand" : category;
    return <span className="ml-auto text-[10px] text-muted-foreground opacity-60">{short}</span>;
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSearchQuery("");
            setSearchResults([]);
            setSearchLoading(false);
            setSearchError(null);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select font"
            className="w-[200px] justify-between bg-background shadow-lg"
            disabled={!isReady || hasError}
          >
            <span className="truncate">
              {!isReady ? "Initializing..." : hasError ? "Error" : selectedFont || "Select font..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={isCuratedList ? "Browse suggestions..." : "Search or Browse fonts..."}
              value={searchQuery}
              onValueChange={setSearchQuery}
              disabled={!isReady}
            />
            <CommandList>
              {searchQuery ? (
                <CommandGroup heading="Search Results">
                  {searchLoading && (
                    <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                    </div>
                  )}
                  {!searchLoading && searchError && (
                    <div className="p-2 text-center text-xs text-destructive">
                      Error: {searchError}
                    </div>
                  )}
                  {!searchLoading && !searchError && searchResults.length === 0 && (
                    <CommandEmpty>No results for &quot;{searchQuery}&quot;.</CommandEmpty>
                  )}
                  {!searchLoading &&
                    !searchError &&
                    searchResults.length > 0 &&
                    searchResults.map((font) => (
                      <CommandItem
                        key={`search-${font.family}`}
                        value={font.family}
                        onSelect={handleSelectFont}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedFont === font.family ? "opacity-100" : "opacity-0"
                          )}
                          aria-hidden="true"
                        />
                        <span>{font.family}</span>
                        {categoryBadge(font.category)}
                      </CommandItem>
                    ))}
                </CommandGroup>
              ) : (
                <>
                  <CommandGroup heading="Suggestions">
                    {GOOGLE_FONTS.length > 0 ? (
                      GOOGLE_FONTS.map((font) => (
                        <CommandItem
                          key={`suggest-${font.family}`}
                          value={font.family}
                          onSelect={handleSelectFont}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedFont === font.family ? "opacity-100" : "opacity-0"
                            )}
                            aria-hidden="true"
                          />
                          <span>{font.family}</span>
                          {categoryBadge(font.category)}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandEmpty>No suggestions.</CommandEmpty>
                    )}
                  </CommandGroup>

                  <CommandSeparator />

                  {!isCuratedList && (
                    <CommandGroup heading="Browse Fonts">
                      {browsedFonts.length > 0
                        ? browsedFonts.map((font) => (
                            <CommandItem
                              key={`browse-${font.family}`}
                              value={font.family}
                              onSelect={handleSelectFont}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedFont === font.family ? "opacity-100" : "opacity-0"
                                )}
                                aria-hidden="true"
                              />
                              <span>{font.family}</span>
                              {categoryBadge(font.category)}
                            </CommandItem>
                          ))
                        : null}

                      {browseLoading && (
                        <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading more...
                        </div>
                      )}
                      {!browseLoading && browseError && (
                        <div className="p-2 text-center text-xs text-destructive">
                          Error: {browseError}
                        </div>
                      )}
                      {!browseLoading && !browseError && browseHasMore && (
                        <CommandItem
                          key="load-more"
                          onSelect={() => {
                            void loadMoreFonts();
                          }}
                          className="flex cursor-pointer items-center justify-center text-sm text-muted-foreground hover:bg-accent"
                        >
                          <ListPlus className="mr-2 h-4 w-4" /> Load More
                        </CommandItem>
                      )}
                      {!browseLoading &&
                        !browseError &&
                        !browseHasMore &&
                        browsedFonts.length === 0 && (
                          <CommandEmpty>No fonts found to browse.</CommandEmpty>
                        )}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
