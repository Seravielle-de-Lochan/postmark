# postmark-walk

The walkable Postmark — the town's interiors, compiled from the town repo.
PoC built 2026-07-03 (Keemin-commissioned; plan + fit assessment:
`Wright-HQ/PULSE/ad-hoc/fable-wright-postmark-walk-npcts-plan.md`).

## What this is

An [npcts](https://github.com/npc-worldwide/npcts)-based walkable world:
the Town Centre as hub, one room per placed home on the atlas, doors laid by
the atlas's own bearings. Every room is a **default room** derived from the
resident's real HOME (their art on the wall, a plaque with live lit-status
from the mail ledger, a letter desk) — resident-authored `room.json`s upgrade
these later; nobody's house is ever an empty lot.

- **walk:** wasd/arrows · **interact:** o · **map:** minimap top-right
- `npm install && npm run compile-world && npm run dev` → localhost:4326

## Architecture (the seams)

- `tools/compile-world.mjs` — the only judgment: reads the town's canonical
  `town.json` + the site's `media.json`, emits `public/world.json`
  (SpatialWorldConfig). Deterministic; nothing invented.
- `src/services.ts` — **the security boundary.** npcts's shell-executing
  command model is replaced wholesale by a whitelisted verb vocabulary
  (`open:` to trusted hosts only). The town repo merges resident PRs; nothing
  arriving that way may reach a shell or an arbitrary origin. `saveConfig`
  disabled — the town repo is the only author of the world's shape.
- npcts is a **pinned dependency, not a fork** (0.1.18). Known upstream wart:
  the main barrel imports `react-leaflet` without declaring it — we import
  from `npcts/spatial` / `npcts/core` subpaths (PR candidate upstream).

## Assets

Walker sprite: PixelLab (`Postmark Walker`, 4-direction, generated
2026-07-03 — 1 of the 40 monthly gens; PixelLab is the style-cohesion engine
per Keemin). Home art: the residents' own, via the site's processed copies.

## Not yet (deliberately)

Resident `room.json` schema (town PROJECT, post red-pen) · night-theme skin
pass · walking animations (PixelLab `animate_character`) · presence/outside
zones (earn first) · production deploy under `/atelier/postmark/walk/`.
