# Design System — PIXEL GESTIÓN

## Product Context
- **What this is:** Desktop POS and stock management system (Electron + React + TypeScript)
- **Who it's for:** Argentine retail store owners and cashiers
- **Space/industry:** B2B desktop business tools
- **Project type:** Data-dense desktop app / internal tool

## Aesthetic Direction
- **Direction:** Industrial / Utilitarian
- **Decoration level:** Minimal
- **Mood:** Precise, professional, fast to scan. No decoration for decoration's sake.

## Typography
- **UI / Body:** Plus Jakarta Sans (400/500/600/700) — bundled via @fontsource
- **Data / Numbers / Prices:** JetBrains Mono — tabular-nums, alignment
- **Scale:** 11px (table headers), 12px (meta/codes), 13px (body/rows), 14px (modal titles), 15px (page titles)

## Color
- **Approach:** Restrained — one blue accent, cool neutral grays
- **app:** `#F1F5F9` — page background
- **panel:** `#FFFFFF` — cards, tables, modals
- **ink:** `#0F172A` — primary text
- **muted:** `#64748B` — secondary text, labels
- **line:** `#E2E8F0` — borders
- **primary:** `#2563EB` — action blue
- **sidebar:** `#0F172A` — navigation background
- **ok:** `#059669` — success
- **warn:** `#D97706` — warning
- **danger:** `#DC2626` — error / delete

## Spacing
- **Base unit:** 4px (Tailwind default)
- **Density:** Compact — desktop tool
- **Table rows:** py-2.5 | Page padding: p-6 | Component gap: gap-3

## Layout
- **Sidebar width:** 200px fixed
- **Border radius:** 2px (sm), 4px (default), 6px (lg) — precision tool feel

## Icons
- **Library:** lucide-react — SVG strokes, NO emoji
- **Nav icons:** 15px | Table actions: 13px | Buttons: 14px

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-15 | Plus Jakarta Sans | Inter overused; PJSans has character |
| 2026-06-15 | Border-radius 2-6px | Precision tool, not consumer app |
| 2026-06-15 | lucide-react | No emoji — explicit user requirement |
| 2026-06-15 | #2563EB primary | More vibrant than previous #1F5FCC |
