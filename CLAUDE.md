# APEX NUKE — Claude Code Instructions

## Project Overview
APEX NUKE is a Phaser 3 + React + Tailwind turn-based 2D artillery PvP game
with Solana NFT integration. Two animals/soldiers battle on procedurally
generated terrain with physics-driven projectiles.

## Tech Stack
- Phaser 3.90 — game engine (physics, rendering, canvas)
- React 19 + Vite 8 — UI layer (menus, lobby, character select)
- Tailwind CSS 4 — styling
- Vitest — unit testing (built into Vite, no separate config needed)
- Supabase — backend (planned: not yet wired up)
- Solana / Metaplex — blockchain (planned: not yet wired up)

## Code Architecture
- src/game/scenes/BattleScene.js — MAIN GAME LOOP (~500 lines, coordinator only)
- src/game/entities/AnimalDefs.js — animal stat definitions (Wolf, Rhino)
- src/game/physics/ProjectilePhysics.js — projectile physics (pure math, no Phaser)
- src/game/physics/TerrainGenerator.js — procedural terrain (pure math)
- src/game/systems/GameState.js — turn/phase state machine
- src/game/systems/TouchControls.js — mobile virtual joystick + buttons
- src/components/ — React UI screens (App, MainMenu, CharacterSelect, etc.)

## Coding Conventions
- JavaScript (not TypeScript) — keep JS until Supabase/Solana wiring begins
- No external state management — React useState / Phaser scene state only
- Physics constants live in their module (GRAVITY in ProjectilePhysics.js)
- All game coordinates in pixels; camera zoom handles display scaling
- Use PHASE enum from GameState.js — never hardcode phase name strings
- Files > 300 lines should be split — extract to a new file and import

## Stage-Gated Build Instructions

Work through these stages in order. Each stage has a completion gate.
Do not start the next stage until the gate is passed.

### Stage 1: Complete Core Engine (CURRENT STAGE)

Still needed from Stage 1 checklist:
- [ ] All 10 soldier weapons in AnimalDefs-style weapon arrays with unique mechanics
- [ ] Jungle Stronghold map (different terrain seed + lower wind variance)
- [ ] Soldier class system: Assault (DELTA), Heavy (TITAN), Recon (GHOST) with class abilities

**Stage 1 Gate:**
- `npm run dev` loads without console errors
- Two players can complete a full match (move → aim → fire → explosion → winner)
- All 10 weapons fire with correct physics behavior
- Carmack subagent scores 10/10 on BattleScene.js + ProjectilePhysics.js
- Miyamoto subagent scores 10/10 on combat feel and HUD readability

---

### Stage 2: Multiplayer (Supabase Realtime)

Files to create:
- src/services/supabase.js — Supabase client init
- src/services/matchmaking.js — queue join/leave, match creation
- src/services/realtimeSync.js — turn broadcast and receive via Supabase channels
- src/components/Lobby.jsx — waiting room UI

Connect GameState turn submission to realtimeSync. Other player's turn triggers
via Supabase channel event, not local input.

**Stage 2 Gate:**
- Two separate browser tabs can play a complete match
- Turn order is server-enforced (player cannot fire twice)
- Disconnect > 90s triggers opponent win
- Carmack subagent scores 10/10 on realtimeSync.js

---

### Stage 3: Full Weapon Roster + Maps

Complete the 10-weapon roster with all special mechanics. Add Jungle Stronghold.
Add wind visual indicator (arrow + strength label in HUD). Add sound effects.

**Stage 3 Gate:**
- All 10 weapons implemented with correct damage/radius/mechanic
- Both maps selectable at match start
- Carmack + Miyamoto both 10/10

---

### Stage 4: Solana Economy

Files to create:
- src/services/wallet.js — Phantom wallet connect, SIWS
- src/services/apexToken.js — read balance, reward after win
- src/components/Shop.jsx — spend APEX on ammo unlocks
- src/components/WalletButton.jsx — connect/disconnect UI

APEX token rewards fire after server-confirmed match completion only.
Do not reward on client-side. Gate: Supabase edge function signs match result.

**Stage 4 Gate:**
- Wallet connects without interrupting active game
- APEX balance updates after win
- Shop renders correctly with current balances
- Carmack scores 10/10 on wallet.js + apexToken.js

---

### Stage 5: NFT Characters

Files to create:
- src/services/nftInventory.js — read wallet NFTs via Metaplex Umi
- src/services/nftSync.js — sync to nft_inventory Supabase table
- Update CharacterSelect.jsx to show NFT-owned characters

NFT ownership unlocks class ability. Non-NFT players use default stats.

**Stage 5 Gate:**
- NFT-owning wallet sees their NFTs in character select
- Class ability fires correctly for NFT-holders
- Non-NFT players cannot use class abilities
- Both agents 10/10

---

### Stage 6: Polish + Launch

Onboarding flow, landing page, production deploy to Vercel,
APEX token Mainnet deploy, Genesis Soldier mint page.

**Stage 6 Gate:**
- Non-Web3 user can create account and play without a wallet
- Wallet linkable to existing account after the fact
- Lighthouse performance score > 80
- Both agents 10/10

---

### V2: Animal PVP (Post-Launch)

**BEFORE ANY ANIMAL CODE:** Refactor BattleScene to ICombatEntity interface.
Extract Soldier into src/game/entities/Soldier.js implementing ICombatEntity.
Write regression tests for full soldier combat loop. Tests must pass before
proceeding. This is a hard gate — do not skip it.

Then add Animal base class, Wolf/Rhino/Eagle/Snake/Elephant extending it,
EntityFactory, AnimalAbilities, StatusEffects, DamageCalculator.

Phase gate: Carmack scores 10/10 on ICombatEntity.js + EntityFactory.js
before any animal-specific code is written.

---

## Things NOT to Do
- Do not add TypeScript without explicit instruction
- Do not install external physics libraries
- Do not add Redux, Zustand, or any state management library
- Do not connect to Supabase or Solana until those stages begin — mock first
- Do not split BattleScene before Stage 4 — the split is part of V2 animal work
- Do not add npm packages without checking if Phaser/vanilla JS can handle it
- Do not hardcode phase names — use PHASE enum
- Do not put implementation logic in BattleScene — extract to a module

## File Size Rule
Any file over 300 lines should be split before adding more code.
Extract the new feature into its own file. Import into the original.
BattleScene.js is currently ~500 lines — do not make it longer.

## Testing (Vitest)
Run: `npx vitest run --coverage`
Target: 80%+ coverage on physics modules, 70%+ on game systems.
Test files: colocate next to source files as `*.test.js`.
Mock Phaser in tests — never spin up a real Phaser game in a test.

## Prompt Templates

### Adding a new soldier weapon:
"Add [WEAPON_NAME] to the soldier weapon system in AnimalDefs.js (as a shared
weapon definitions file — rename if needed). Spec:
- Damage: X, blastRadius: Xpx, projectileSpeed: Xpx/s, projectileWeight: X
- bounces: N, ricochet: true/false
- Special mechanic: [describe]
If the mechanic requires new physics behavior not in ProjectilePhysics.js,
add a new exported function there first. Then wire it in BattleScene.js.
Do not modify existing weapon mechanics."

### Adding a new animal:
"Add [ANIMAL] (class: [CLASS]) to AnimalDefs.js. Stats:
- HP: X, speed: X, jumpForce: X, bodyWidth: X, bodyHeight: X
- color: '#XXXXXX', emoji: '[emoji]', className: '[CLASS_NAME]'
- Weapon 1: {id, name, damage, blastRadius, projectileSpeed,
  projectileWeight, bounces, ricochet, description}
- Weapon 2: {same fields}
- Ability: {id, name, description, cooldown, [effect fields]}
Follow the exact structure of wolf and rhino entries."

### Carmack review:
"You are John Carmack. Review these files for correctness, performance,
security, architecture, robustness, and code quality. Rate each 1-10.
Overall = minimum score. List specific issues with file:line and fix.
APPROVED: YES/NO
[paste files]"

### Miyamoto review:
"You are Shigeru Miyamoto. Review this game for game feel, readability,
onboarding, mobile comfort, blockchain invisibility, and fairness.
Rate each 1-10. Overall = minimum. List specific issues with screen name
and exact fix. APPROVED: YES/NO
[describe what was built / paste UI code]"

### Bug fix:
"Bug: [what's happening] in [file/feature].
Steps to reproduce: [describe]
Fix ONLY the minimum code needed. Show before/after diff first."
