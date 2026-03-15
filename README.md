# APEX NUKE

A turn-based animal PVP combat game built with Phaser 3, React, and Tailwind CSS.

**Play now:** [apexnuke.vercel.app](https://apexnuke.vercel.app)

## Gameplay

Two players take turns on the same device, choosing animals and battling on destructible terrain with projectile-based combat. Aim, adjust power, and account for wind to land devastating shots.

### Animals

| Animal | Class | HP | Special Ability |
|--------|-------|----|-----------------|
| Wolf | Predator | 90 | **Pack Howl** — +25% damage on next shot |
| Rhino | Tank | 130 | **Thick Hide** — Block 40% damage for 1 turn |

Each animal has two weapons with unique properties — projectile weight affects wind resistance, and some shots ricochet off terrain.

### Controls

- **Move** — Arrow keys / on-screen D-pad
- **Aim** — Mouse or touch drag
- **Power** — Hold to charge, release to fire
- **Weapon Switch** — Tab / on-screen button
- **Ability** — Spacebar / on-screen button

## Tech Stack

- **Phaser 3** — Game engine (physics, rendering, terrain destruction)
- **React 19** — UI screens (menus, character select, game over)
- **Tailwind CSS 4** — Styling
- **Vite 8** — Build tool

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## License

ISC
