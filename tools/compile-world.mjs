// compile-world.mjs — derive the walkable town from the atlas.
//
// Reads the town's canonical town.json (the judgment ledger, executed) and
// the site's media map, and emits public/world.json — an npcts
// SpatialWorldConfig. Nothing here is invented: every room is a placed home,
// every plaque quotes the resident, every door follows the atlas's own
// bearings. Residents without a room.json (all of them, in this PoC) get a
// DEFAULT ROOM generated from their HOME — image on the wall, plaque, letter
// desk — so the walk is complete from day one.
//
// Deterministic: sorted inputs, no timestamps. Same discipline as
// extract-town.mjs. Usage: node tools/compile-world.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const TOWN_JSON = "G:/Wright-HQ/starforge-commons/PROJECTS/build-the-town/atlas/town.json";
const MEDIA_JSON = "G:/content-creation/starforge-site/src/data/postmark/media.json";
const SITE = "https://starforge-atelier.online";

const town = JSON.parse(readFileSync(TOWN_JSON, "utf8"));
const media = JSON.parse(readFileSync(MEDIA_JSON, "utf8"));

const homes = [...town.homes].sort((a, b) => a.id.localeCompare(b.id));
console.log(`compiling: ${homes.length} homes, ${town.regions.length} regions`);

// ── palette: the town at night ──────────────────────────────────────────────
const FLOORS = {
  "quayside":            "repeating-linear-gradient(45deg, #1a2030 0 14px, #171c2a 14px 28px)",
  "the-coast":           "repeating-linear-gradient(0deg, #14202b 0 18px, #121c26 18px 36px)",
  "the-mouth":           "repeating-linear-gradient(0deg, #16222d 0 18px, #131e28 18px 36px)",
  "downwater":           "repeating-linear-gradient(90deg, #17202e 0 20px, #141c29 20px 40px)",
  "upper-terrace":       "repeating-linear-gradient(45deg, #1e1f2e 0 16px, #1a1b29 16px 32px)",
  "descending-terraces": "repeating-linear-gradient(45deg, #1e1f2e 0 16px, #1a1b29 16px 32px)",
  "high-slope":          "repeating-linear-gradient(135deg, #1c2130 0 16px, #181d2b 16px 32px)",
  "lower-slope":         "repeating-linear-gradient(135deg, #1b2430 0 16px, #17202b 16px 32px)",
  "outskirts":           "repeating-linear-gradient(0deg, #181a24 0 22px, #14161f 22px 44px)",
};
const HUB_FLOOR = "repeating-conic-gradient(#1d2233 0% 25%, #191e2d 0% 50%)";
const HUB_FLOOR_SIZE = "28px 28px";

// ── shared room bones ───────────────────────────────────────────────────────
function walls() {
  return {
    topWall:    { orientation: "horizontal", x: 0,  y: 6,  width: 100, height: 5, style: "wood" },
    bottomWall: { orientation: "horizontal", x: 0,  y: 92, width: 100, height: 5, style: "wood" },
    leftWall:   { orientation: "vertical",   x: 0,  y: 6,  width: 2.5, height: 91, style: "wood" },
    rightWall:  { orientation: "vertical",   x: 97.5, y: 6, width: 2.5, height: 91, style: "wood" },
  };
}

// a resident's home image (first asset), as a site-processed card URL
function homeImage(h) {
  const asset = h.assets?.[0];
  return asset ? (media[asset]?.card ? SITE + media[asset].card : null) : null;
}

// ── the home rooms (default rooms — nobody's house is an empty lot) ────────
const rooms = {};
for (const h of homes) {
  const img = homeImage(h);
  const apps = {
    // the portrait: the resident's own home art on the far wall (or their title
    // as text). NB app width/height are percent OF THE WALL THICKNESS
    // (≈7% of viewport), not of the room — hence the large numbers.
    "the-portrait": {
      name: h.title,
      command: `open:${SITE}/atelier/postmark/residents/${h.resident}/`,
      x: 36, y: 12, width: 1800, height: 1100,
      ...(img ? { image: img } : { text: `✦ ${h.title} ✦` }),
    },
    // the plaque: who lives here + door to their page
    "the-plaque": {
      name: `${h.resident}${h.lit ? " · window lit" : ""}`,
      command: `open:${SITE}/atelier/postmark/residents/${h.resident}/`,
      x: 7, y: 24, width: 620, height: 200,
      text: `${h.resident}\n${h.band.replace(/-/g, " ")}${h.region ? ` · ${regionName(h.region)}` : ""}`,
    },
    // the letter desk: where the mail happens
    "the-letter-desk": {
      name: "the letter desk",
      command: `open:${SITE}/atelier/postmark/mail/`,
      x: 84, y: 24, width: 560, height: 190,
      text: "✉ letters",
    },
  };
  rooms[h.id] = {
    name: h.title,
    walls: walls(),
    doors: {
      "to-town-centre": {
        x: 46, y: 89, width: 8, height: 8,
        leadsTo: "the-town-centre", orientation: "down",
      },
    },
    applications: apps,
    floor_pattern: FLOORS[h.band] ?? FLOORS["quayside"],
  };
}

function regionName(id) {
  return town.regions.find((r) => r.id === id)?.region ?? id;
}

// ── the Town Centre: hub room, doors placed by the atlas's own bearings ─────
// bearing → which wall the door sits on, and how doors sharing a wall spread.
const WALL_FOR = {
  N: "top", NE: "top", NW: "top",
  S: "bottom", SE: "bottom", SW: "bottom",
  E: "right", W: "left", "-": "bottom",
};
const buckets = { top: [], bottom: [], left: [], right: [] };
for (const h of homes) {
  if (h.resident === "postmaster") continue; // the post office IS this room
  buckets[WALL_FOR[h.bearing] ?? "bottom"].push(h);
}
for (const b of Object.values(buckets)) b.sort((a, b2) => a.id.localeCompare(b2.id));

const hubDoors = {};
function spread(list, place) {
  list.forEach((h, i) => {
    const t = (i + 1) / (list.length + 1); // even spacing along the wall
    hubDoors[`to-${h.id}`] = { ...place(t), leadsTo: h.id };
  });
}
spread(buckets.top,    (t) => ({ x: 4 + t * 84, y: 6.5,  width: 7, height: 7, orientation: "up" }));
spread(buckets.bottom, (t) => ({ x: 4 + t * 84, y: 88, width: 7, height: 7, orientation: "down" }));
spread(buckets.left,   (t) => ({ x: 0.5, y: 8 + t * 74, width: 5, height: 9, orientation: "left" }));
spread(buckets.right,  (t) => ({ x: 94.5, y: 8 + t * 74, width: 5, height: 9, orientation: "right" }));

rooms["the-town-centre"] = {
  name: "the Town Centre",
  walls: walls(),
  doors: hubDoors,
  applications: {
    "the-post-office": {
      name: "the post office",
      command: `open:${SITE}/atelier/postmark/meeps/`,
      x: 44, y: 12, width: 1100, height: 700,
      text: "🏤\nthe post office",
    },
    "the-noticeboard": {
      name: "the town bulletin",
      command: `open:${SITE}/atelier/postmark/bulletin/`,
      x: 13, y: 14, width: 560, height: 220,
      text: "📌 bulletin",
    },
    "the-atlas-table": {
      name: "the atlas",
      command: `open:${SITE}/atelier/postmark/atlas/`,
      x: 78, y: 14, width: 560, height: 220,
      text: "🗺 the atlas",
    },
  },
  floor_pattern: HUB_FLOOR,
  floor_pattern_size: HUB_FLOOR_SIZE,
};

// ── the walker ──────────────────────────────────────────────────────────────
// PIXEL coordinates (rooms are percent; the character is not — npcts renders
// it at raw px). Sprites: PixelLab 4-direction views, one frame each for now.
const world = {
  userCharacter: {
    name: "you",
    x: 640, y: 430, width: 44, height: 58,
    spriteSheets: {
      up:    ["sprites/walker/up.png"],
      down:  ["sprites/walker/down.png"],
      left:  ["sprites/walker/left.png"],
      right: ["sprites/walker/right.png"],
    },
  },
  rooms,
};

const out = join(ROOT, "public", "world.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(world, null, 1) + "\n");
console.log(`wrote public/world.json — ${Object.keys(rooms).length} rooms (${Object.keys(hubDoors).length} doors off the Centre)`);
