# HUM — Organization Structure Dashboard

An interactive organogram dashboard for HUM Network, built with
Next.js 14, React 18, TypeScript, and Tailwind CSS. Everything lives
on one page: view tabs at the top, the full org chart below, and a
rich set of tools for managing, comparing, and capturing your
organization structure.

## Features

### Core
- **Single-page dashboard** — tabs swap the chart; nothing navigates away
- **Click any card** → side panel with full details (title, department, reports-to, JD, skills)
- **Edit mode** — toggle in header to add, rename, recolor, reorder, delete, or drag-and-drop roles
- **Unlimited depth** — department → sub-department → board → person → deputy, as deep as needed
- **Drag & drop** — drag roles from the palette or rearrange existing nodes
- **Custom colors** — per-node color picker with brand swatches

### Version Management
- **Save versions** — snapshot your current structure with a name
- **Load / duplicate / delete** versions
- **Edit a version copy** — make changes without affecting main data (gold banner shows which version you're editing)
- **Version comparison** — visual card-style diffs showing added, removed, and changed nodes with field-level detail

### Search, Copy & Paste
- **Search** — find nodes by name/designation with highlight and dim
- **Copy all** — deep-clone an entire tab's tree to clipboard
- **Paste** — paste into another tab or version (auto-generates new IDs to avoid conflicts)
- **Headcount badges** — node count shown on each tab

### AI Edit (Claude-powered)
- **Natural language editing** — click "AI Edit" and type a prompt like "Add a Marketing team under CEO with 3 roles"
- Sends current tab structure to Claude API, returns modified tree
- Secure server-side API route (`/api/ai`) — API key never exposed to frontend
- Requires `ANTHROPIC_API_KEY` environment variable (set in `.env.local` or Vercel)

### Cloud Backup (Supabase)
- **Automatic sync** — every edit saves to both localStorage and Supabase (50ms debounce)
- **Cloud fallback** — if localStorage is empty (e.g. after Vercel restart), loads from Supabase
- **Smart hydration** — on page load, compares local and cloud timestamps; uses whichever is newer
- **Version sync** — all versions (save, load, duplicate, delete) sync to cloud independently
- Table: `org_data` (id text PK, data jsonb, updated_at timestamptz)

### Screenshot Capture
- **Capture button** — downloads the current chart as a PNG
- **Fetches from DB first** — ensures screenshot reflects latest cloud data
- **Responsive layout** — wraps wide charts to max 1800px for readable screenshots
- **Theme-aware** — captures with correct light/dark background

### Other
- **Fullscreen mode** — toggle for presentations
- **Overview tab** — auto-generated merged view of all tabs with per-tab colors
- **Undo** — toast notifications with undo for destructive actions (delete node/tab)
- **Dark mode** — full light/dark theme support

## Tech Stack

- **Framework:** Next.js 14.2 (App Router)
- **UI:** React 18, TypeScript, Tailwind CSS 3.4
- **Cloud:** Supabase (direct frontend client, no backend)
- **AI:** Anthropic Claude API via server-side route
- **Screenshot:** html-to-image
- **Icons:** Lucide React

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Environment Variables

Create `.env.local`:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
```

For Vercel: add `ANTHROPIC_API_KEY` in Project Settings → Environment Variables.

The Supabase connection is pre-configured in `lib/supabase.ts`.

## Deploy

Push to GitHub and import in [Vercel](https://vercel.com/new) — it auto-detects Next.js. Or:

```bash
npm install -g vercel
vercel
```

## Project Structure

```
app/
  page.tsx          — Main page wiring (state, handlers, layout)
  api/ai/route.ts   — Claude API route for AI editing
components/
  Header.tsx        — Top bar (search, copy/paste, versions, AI, fullscreen)
  ChannelTabs.tsx   — Tab bar with headcount badges
  OrgChart.tsx      — Chart container (zoom, fit, capture)
  OrgCard.tsx       — Node card (drag, drop, search highlight)
  NodeDrawer.tsx    — Side panel for viewing/editing a node
  DragPanel.tsx     — Drag palette for adding new nodes
  VersionSelector.tsx — Version save/load/duplicate/delete/edit dropdown
  VersionCompare.tsx  — Visual version comparison with diffs
  AiPrompt.tsx      — AI edit modal
  DeleteConfirm.tsx — Delete confirmation with options
  Toast.tsx         — Toast notifications with undo
  EmptyState.tsx    — Empty tab placeholder
lib/
  useOrgStore.ts    — Core state management (data, versions, cloud sync)
  supabase.ts       — Supabase client and helpers
  defaultData.ts    — Default org chart data
  types.ts          — TypeScript types (OrgNode, ViewDef, OrgData)
  useLocalStorage.ts — localStorage hook
  icons.ts          — Icon registry
  helpers.ts        — Tree manipulation utilities
```
