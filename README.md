# APEX NUKE

A multiplayer artillery combat game featuring stylized animal characters battling across destructible 2D landscapes. Inspired by classic games like Wild Ones.

**Play now:** [apexnuke.vercel.app](https://apexnuke.vercel.app)

## Gameplay

Up to 4 players battle in timed rounds on a 2D side-scrolling map. Players take turns moving their animal character, aiming a weapon, and launching projectiles at opponents. The last animal standing — or the one with the most points when the timer runs out — wins.

### How a Round Works

1. **Lobby** — Players join a match, pick their animal, and wait for the map to load
2. **Battle** — A countdown timer (e.g. 4 minutes) starts. Players take turns in order (1st, 2nd, 3rd, 4th)
3. **On Your Turn** — Move your animal across the terrain, aim your weapon with an angle indicator, adjust power, and fire
4. **Damage & Elimination** — Projectiles deal damage on impact. Each player has an HP bar displayed above their character. When HP hits zero, you're eliminated
5. **Victory** — The match ends when time runs out or only one player remains. Players are ranked by kills/damage dealt

### Weapons & Items

Players carry multiple weapons with limited ammo. Switch weapons during your turn using the **Change Weapon** panel at the bottom of the screen.

- **Standard Projectiles** (x99) — Basic shots with arc trajectory affected by wind
- **Special Weapons** (limited ammo) — Higher damage, unique effects like splash damage or bouncing projectiles
- **Items** — Utility pickups that spawn on the map during battle

### Maps & Terrain

Battles take place on themed 2D maps with platforms, hills, and environmental obstacles:

- **Nature maps** — Floating islands, cliffs, palm trees, bridges, and waterfalls
- **Urban maps** — Stacked objects, pots, pans, and kitchen-themed chaos
- Terrain is **destructible** — explosions carve craters and reshape the battlefield

### Animals & Customization

Choose from a roster of unique animal characters, each with distinct visual styles. Customize your animal with cosmetic items:

- **Heads** — Helmets, masks, hats
- **Tops** — Armor, outfits, accessories
- **Bottoms** — Pants, leg gear
- **Shoes** — Boots, footwear
- **Mini Pets** — Companion creatures

Earn in-game currency through matches to unlock items in the shop.

### HUD & UI

- **Top center** — Round timer with seconds countdown and total match duration
- **Player labels** — Rank position (1st–4th), player name, and HP bar above each character
- **Bottom panel** — Player cards showing all combatants, scores, and the weapon selection area
- **Aim indicator** — Angle display (in degrees) shown when aiming
- **Chat** — In-game messaging between players

## Controls

- **Move** — Arrow keys / on-screen D-pad
- **Aim** — Mouse drag or touch to set angle
- **Power** — Hold to charge, release to fire
- **Change Weapon** — Click weapon panel / Tab key
- **Chat** — In-game chat button

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
