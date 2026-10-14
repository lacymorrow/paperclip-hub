/**
 * Everything Lacy runs and maintains, as plain data. No imports on purpose:
 * this file is meant to be lifted into a shared "brand marquee" that shows
 * every site across every personal site. Keep it self-contained and static.
 *
 * `kind: "sponsor"` is free work that sponsorship keeps alive.
 * `kind: "buy"` is a paid product, shown as a purchase, not as sponsored work.
 */
export type ProjectKind = "sponsor" | "buy";

export interface Project {
  id: string;
  name: string;
  /** One line, plain words, no period-less fragments. */
  line: string;
  /** Absolute https URL. Verified to return 200 before shipping. */
  url: string;
  /** Short display host, e.g. "bones.sh". */
  host: string;
  kind: ProjectKind;
}

export const projects: readonly Project[] = [
  {
    id: "cliphub",
    name: "Paperclip Hub",
    line: "The plugin directory for Paperclip. Free to browse, free to list.",
    url: "https://cliphub.fyi",
    host: "cliphub.fyi",
    kind: "sponsor",
  },
  {
    id: "bones",
    name: "Bones",
    line: "A free Next.js starter with auth, UI and one-click deploy.",
    url: "https://bones.sh",
    host: "bones.sh",
    kind: "sponsor",
  },
  {
    id: "lash",
    name: "Lash",
    line: "An AI terminal for your code. Shell first, AI second.",
    url: "https://lash.lacy.sh",
    host: "lash.lacy.sh",
    kind: "sponsor",
  },
  {
    id: "lacy-shell",
    name: "Lacy Shell",
    line: "A ZSH and Bash plugin that knows commands from plain English.",
    url: "https://lacy.sh",
    host: "lacy.sh",
    kind: "sponsor",
  },
  {
    id: "juno",
    name: "Juno",
    line: "A Mac agent that works the mouse and keyboard for you.",
    url: "https://junebug.ai",
    host: "junebug.ai",
    kind: "sponsor",
  },
  {
    id: "crossover",
    name: "CrossOver",
    line: "A crosshair overlay for gaming, open source.",
    url: "https://github.com/lacymorrow/crossover",
    host: "github.com/lacymorrow/crossover",
    kind: "sponsor",
  },
  {
    id: "uibrary",
    name: "Uibrary",
    line: "Open-source UI components to browse, preview and copy.",
    url: "https://uibrary.com",
    host: "uibrary.com",
    kind: "sponsor",
  },
  {
    id: "fpv-bible",
    name: "FPV Bible",
    line: "An open-source guide to building FPV racing drones.",
    url: "https://fpv-bible.lacy.sh",
    host: "fpv-bible.lacy.sh",
    kind: "sponsor",
  },
  {
    id: "shipkit",
    name: "Shipkit",
    line: "The premium Next.js framework built on Bones.",
    url: "https://shipkit.io",
    host: "shipkit.io",
    kind: "buy",
  },
];
