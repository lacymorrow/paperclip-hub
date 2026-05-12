# Paperclip Hub — Design Document

## Overview

Plugin marketplace for Paperclip. Built on ShipKit (Next.js 16 + React 19 + Tailwind + Shadcn/UI).

## Pages

### `/` — Homepage
- Hero section with gradient, animated pulse badge, search bar
- Stats banner (total plugins, installs, publishers, avg rating)
- Featured plugins grid (hand-picked, 3-col)
- Recently updated section (4-col)
- Build a Plugin CTA with docs + publish links

### `/plugins` — Browse All
- Category filter tabs (All, Connectors, Workspace, Automation, UI Extensions)
- Search input with live filtering
- Sort dropdown (Popular, Trending, Newest, Highest Rated)
- Responsive card grid (3-col desktop, 2-col tablet, 1-col mobile)
- Empty state for no results

### `/plugins/[slug]` — Plugin Detail
- Back navigation
- Plugin icon, name, verified badge, author
- Long description
- Installation command with copy button
- Capabilities list with shield icons
- Tags as clickable links (filter by tag)
- Sidebar: Install button, stats (downloads, rating, version, category, dates), verified badge

### `/submit` — Publish a Plugin
- Step-by-step guide (Docs → Build → Publish npm → Submit)
- Waitlist CTA (registry not yet open)

## Data Model

Currently using static mock data in `src/data/plugins.ts`. Plugin interface matches the Paperclip plugin manifest schema (id, slug, name, description, category, author, installs, rating, version, tags, verified, capabilities).

### Future: API Integration
Connect to Paperclip API for live plugin data:
- `GET /api/plugins` for listing
- Plugin manifest validation for submissions
- npm registry integration for install counts

## Design Patterns (from research)

Informed by cursor.directory, ClawHub, skills.sh:
- Prominent search bar (all three sites lead with search)
- Card grid layout with category badges
- Install count + star rating as primary social proof
- Verified/official badges for first-party plugins
- Category tabs for quick filtering
- Community contribution flow (publish CTA)

## Tech Stack

- Next.js 16.1.6 (App Router, RSC)
- React 19
- Tailwind CSS 3.4
- Shadcn/UI components
- Lucide React icons
- ShipKit framework features (auth, theme, layout)
