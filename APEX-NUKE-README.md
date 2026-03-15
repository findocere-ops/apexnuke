# ⚡ APEX NUKE
### Grand Design Document — v2.0

> **Version:** 0.2 — Revised by CTO Review  
> **Status:** Active Development  
> **Engine:** Phaser 3 · React · Supabase · Solana  
> **Network:** Solana Mainnet-Beta (Devnet during development)  
> **Last Updated:** 2026-03-15

---

## Table of Contents

1. [Vision](#1-vision)
2. [Gameplay](#2-gameplay)
3. [Characters & Assets](#3-characters--assets)
4. [Weapon System](#4-weapon-system)
5. [Economy & Monetization](#5-economy--monetization)
6. [Solana Architecture](#6-solana-architecture)
7. [Tech Stack](#7-tech-stack)
8. [System Architecture](#8-system-architecture)
9. [Database Schema](#9-database-schema)
10. [Roadmap](#10-roadmap)
11. [APEX Token Design](#11-apex-token-design)
12. [Animal PVP Combat System](#12-animal-pvp-combat-system)  ← **PROMOTED FROM V2 COSMETIC TO V2 CORE COMBAT**
13. [Anti-Cheat & Fairness](#13-anti-cheat--fairness)
14. [Claude Code Agent Instructions (CLAUDE.md)](#14-claude-code-agent-instructions-claudemd)  ← **NEW**
15. [Token Economy Stress-Test Framework](#15-token-economy-stress-test-framework)  ← **NEW**
16. [Go-to-Market](#16-go-to-market)

---

## CTO Changelog: v1.0 → v2.0

| Area | v1.0 Status | v2.0 Fix |
|------|-------------|----------|
| Animal PVP | V2 cosmetic footnote | Promoted to full V2 combat system with ICombatEntity architecture |
| Agent instructions | Missing entirely | Added CLAUDE.md section (Section 14) |
| Token economy | Emission schedule only | Full sink/source stress test, inflation ceiling (Section 15) |
| Codebase growth plan | Not addressed | BattleScene split plan added (Section 14) |
| Cross-doc consistency | Animal CTO doc contradicted Grand Design | Both reconciled — this document is now the single source of truth |

---

## 1. Vision

APEX NUKE is a **military-themed, turn-based 2D artillery PvP browser game** where soldiers, weapons, and cosmetic assets are **Solana NFTs** — meaning players truly own what they earn and buy, can trade it, and carry real value out of the game.

Inspired by the social mechanics of Wild Ones (Facebook, 2009–2013) and the physics-driven gameplay of Worms, APEX NUKE modernises the formula for a Web3-native audience: **competitive ranked play, tokenised asset ownership, and SOL-denominated prize pools.**

**V2 expands the entity system to include Animal characters** — a distinct combat system (not skins) with unique mechanics, abilities, and NFT collections. This is the primary retention and revenue driver post-launch, not a cosmetic afterthought.

### Core Philosophy
- **Skill decides matches.** Not pay-to-win. NFTs affect cosmetics and minor perks, not base weapon damage.
- **Ownership is real.** Every character NFT and weapon NFT lives on Solana and is tradeable on Magic Eden.
- **Fun first, blockchain second.** Onboarding works without a wallet. Wallet unlocks the economy layer.
- **Entity-agnostic combat loop.** The engine supports Soldier and Animal entities via the same ICombatEntity interface — new entity types add content without rewriting the game.

---

## 2. Gameplay

### 2.1 Core Loop

```
Connect wallet → Select entity (Soldier or Animal) → Enter matchmaking →
Turn-based artillery duel → Win APEX tokens → Spend in shop / trade NFTs
```

### 2.2 Turn Structure

Each match is a **1v1 turn-based artillery duel** played on a procedurally generated 2D terrain map:

| Phase | Duration | Description |
|---|---|---|
| Move | 15s | Both players reposition on terrain |
| Aim | Unlimited | Player moves mouse to set angle |
| Charge | Hold input | Power bar oscillates 0–100% — release to fire |
| Flight | Until impact | Projectile follows physics arc (gravity + wind) |
| Explosion | ~1.5s | Terrain deforms, damage calculated, HP updates |
| Transition | 1s | Wind changes, next player's turn begins |

### 2.3 Physics Model

- **Gravity:** 560 px/s² (tuned for satisfying arc on standard map)
- **Wind:** Randomised each turn, range −150 to +150 px/s²
- **Projectile weight:** Per-weapon modifier that scales wind sensitivity (light = drifts, heavy = cuts through)
- **Terrain deformation:** Craters persist through the full match; topology changes strategy
- **Blast radius:** Per-weapon (28px–62px); damage falls off linearly from impact point

### 2.4 Win Conditions

| Mode | Win Condition |
|---|---|
| Standard Duel | Last entity standing (HP > 0) |
| Time Limit | Most HP remaining when timer expires |
| Animal Duel (V2) | Animal vs Animal only — animal weapons only |
| Cross-Species War (V2) | Animal vs Soldier — asymmetric, handicap-balanced |
| Last Team Standing (V3) | 2v2 team elimination |

### 2.5 Maps (V1)

| Map | Theme | Special Property |
|---|---|---|
| Desert Outpost | Arid, sandy terrain | High wind variance |
| Jungle Stronghold | Dense green terrain | Low wind, more cover |

---

## 3. Characters & Assets

### 3.1 Soldier Classes (V1 — 3 classes)

| Class | Name | HP | Special Ability | Rarity |
|---|---|---|---|---|
| Assault | DELTA | 100 | +10% damage on direct hits | Common |
| Heavy | TITAN | 130 | Blast radius +15%, moves slower | Uncommon |
| Recon | GHOST | 85 | Trajectory preview +5 extra dots | Rare |

All classes are **playable for free** using the default (non-NFT) soldier. NFT ownership unlocks the special ability and cosmetic variants.

### 3.2 Animal Classes (V2 — 5 classes at launch)

| Class | Animal | HP | Speed | Special Ability | Rarity |
|---|---|---|---|---|---|
| Predator | Wolf | 95 | Fast | **Pack Howl** — next attack +20% damage | Common |
| Tank | Rhino | 140 | Slow | **Thick Hide** — -15% incoming damage for 2 turns | Uncommon |
| Scout | Eagle | 75 | Very Fast | **Aerial View** — reveals full trajectory + enemy HP for 1 turn | Rare |
| Saboteur | Snake | 80 | Medium | **Venom Bite** — 8 damage/turn poison for 3 turns | Uncommon |
| Siege | Elephant | 150 | Very Slow | **Tremor Stomp** — wide terrain deform without direct damage | Rare |

> Animals are **not cosmetic skins over soldiers**. They are a distinct entity class using the `ICombatEntity` interface, with their own weapon set, abilities, and balance parameters. See Section 12.

### 3.3 NFT Asset Types

```
Character NFT (Soldier)   → Soldier with unique skin + class ability
Character NFT (Animal)    → Animal with species traits + class ability  ← V2
Weapon Skin NFT           → Visual reskin of a weapon (no stat change)
Pet NFT                   → Companion that follows your soldier (cosmetic)
Clothing NFT              → Helmet, jacket, boots sets (cosmetic)
Emblem NFT                → Match-start animation + nameplate badge
```

### 3.4 Collection Sizes

| Collection | Supply | Mint Price | Phase |
|---|---|---|---|
| Genesis Soldiers | 3,000 | 0.5 SOL | V1 Launch |
| Weapon Skins | 10,000 | 0.1 SOL | V1 Launch |
| Genesis Animals | 5,000 | 0.3 SOL | V2 Launch |
| Pets | 5,000 | 0.2 SOL | V2 |
| Clothing Sets | 8,000 | 0.15 SOL | V2 |

---

## 4. Weapon System

### 4.1 Soldier Weapons (V1 — 10 weapons)

| # | Name | Type | Ammo Cost (APEX) | Damage | Special |
|---|---|---|---|---|---|
| 1 | Standard Grenade | Explosive | Free (5/turn) | 55 | 4s fuse, bounces |
| 2 | Tactical Missile | Direct | 20 APEX | 80 | No bounce, high speed |
| 3 | Cluster Bomb | AOE | 45 APEX | 35 × 4 | Splits into 4 on impact |
| 4 | Nuke Strike | Nuclear | 150 APEX | 180 | Massive crater, screen shake |
| 5 | EMP Grenade | Utility | 30 APEX | 20 | Skips opponent's next turn |
| 6 | Smoke Screen | Utility | 25 APEX | 0 | Blocks trajectory preview |
| 7 | Airstrike Beacon | Airstrike | 80 APEX | 60 × 3 | Three bombs, slight scatter |
| 8 | Proximity Mine | Trap | 35 APEX | 70 | Placed on terrain, persists |
| 9 | Teleporter | Mobility | 40 APEX | 0 | Move soldier to target point |
| 10 | Bunker Buster | Piercing | 55 APEX | 90 | Drills into terrain before detonating |

### 4.2 Animal Weapons (V2 — 6 weapons, animals only)

| Name | Type | Unlock | Damage | Mechanic |
|---|---|---|---|---|
| Claw Slash | Melee | Default | 40 | Close-range arc, no projectile physics |
| Fang Throw | Projectile | Default | 50 | Standard arc, grenade equivalent |
| Sonic Roar | Wave | Level 5 | 35 | Horizontal push + damage |
| Burrow Charge | Underground | Level 10 | 65 | Tunnels terrain, erupts under target |
| Stampede | AOE | Level 15 | 45×3 | Three horizontal impact zones |
| Primal Fury | Ultimate | Level 20 | 120 | Class-specific (Wolf: pack summon, Rhino: charge) |

### 4.3 Weapon Unlock Progression (Soldiers)

```
Level 1–4:   Grenade, Missile
Level 5–9:   Cluster Bomb, Smoke Screen
Level 10–14: Airstrike Beacon, EMP Grenade
Level 15–19: Proximity Mine, Teleporter
Level 20+:   Nuke Strike, Bunker Buster
```

---

## 5. Economy & Monetization

### 5.1 Dual Currency Model

| Currency | Type | How You Get It | What It Buys |
|---|---|---|---|
| **APEX Token** | SPL fungible token (on-chain) | Win matches, quests, seasonal rewards | Ammo, weapon unlocks, cosmetic rentals, entry fees |
| **SOL** | Native Solana | Purchase externally | NFT mints, Magic Eden trades, battle vaults (V2) |

### 5.2 APEX Token — Earn & Spend

**Earning APEX (faucets):**

| Source | APEX Earned | Notes |
|---|---|---|
| Win a standard match | +120 APEX | Base rate |
| Win a ranked match | +200 APEX | Requires minimum level 5 |
| Daily login bonus | +30 APEX | Once per 24h |
| Daily quest | +50–80 APEX | Rotates daily |
| Seasonal battle pass reward | Up to 5,000 APEX | Per season |
| Tournament placement (V2) | 500–5,000 APEX | Prize pool supplement |

**Spending APEX (sinks):**

| Item | APEX Cost | Notes |
|---|---|---|
| Extra ammo pack (15 shots) | 60 APEX | Per match |
| Premium weapon unlock | 200–600 APEX | Permanent on account |
| Animal weapon unlock (V2) | 150–400 APEX | Per animal weapon |
| Cosmetic rental (7 days) | 120 APEX | For non-NFT holders |
| Ranked entry fee | 50 APEX | Pooled into prize pot |
| Battle pass (V2) | 800 APEX | Or 4 SOL equivalent |

> See Section 15 for the full sink/source stress-test and inflation ceiling analysis.

### 5.3 NFT Monetization

#### Primary Sales

```
Genesis Soldiers:  3,000 × 0.5 SOL  = 1,500 SOL
Weapon Skins:     10,000 × 0.1 SOL  = 1,000 SOL
Genesis Animals:   5,000 × 0.3 SOL  = 1,500 SOL  ← V2 mint funds V2 dev
Pets (V2):         5,000 × 0.2 SOL  = 1,000 SOL
Clothing (V2):     8,000 × 0.15 SOL = 1,200 SOL
──────────────────────────────────────────────────
Total (all phases): ~6,200 SOL primary revenue potential
```

#### Secondary Royalties

All collections enforce **5% creator royalty** via Metaplex pNFTs.

#### NFT Utility in Gameplay

- Class special ability unlock (meaningful but not decisive)
- Cosmetic differentiation (skins, animations, emblems)
- Minor XP bonus (5–10%) — faster progression, not stronger shots
- Access to NFT-holder-only seasonal tournaments
- Animal NFT holders: access to Animal Duel and Cross-Species modes (V2)

### 5.4 Battle Vault — Prize Pool System (V2)

> Deferred to V2. Requires Anchor/Rust escrow program + security audit before real SOL flows through it.

```
Player A deposits 0.05 SOL → Player B deposits 0.05 SOL →
Smart contract holds in escrow → Match resolves on-chain →
Winner receives 0.09 SOL (90%), 0.01 SOL to treasury (10%)
```

**Anti-manipulation safeguards:**
- Match result signed by Supabase edge function (trusted oracle)
- Both players must hold NFT characters to enter vaulted matches
- Contract enforces 45-minute timeout with refund fallback

### 5.5 Revenue Summary

| Stream | V1 Launch | V2 (3 months) | Mature |
|---|---|---|---|
| NFT primary sales | 1,500 SOL | +2,500 SOL (Animals mint) | — |
| NFT royalties (5%) | Low | Growing | Significant passive |
| Battle vault (10% fee) | — | Active | Primary stream |
| Battle pass | — | 4–8 SOL × users | Recurring seasonal |
| Direct APEX purchases | Minimal | Growing | Secondary |

---

## 6. Solana Architecture

### 6.1 On-Chain vs Off-Chain Boundary

```
ON-CHAIN (Solana)                    OFF-CHAIN (Supabase)
─────────────────────────────────    ────────────────────────────────────
NFT ownership (Soldier + Animal)     Game state during a match
APEX token balances                  Turn history + replay data
Battle vault escrow (V2)             Matchmaking queue
NFT metadata (traits, rarity)        Leaderboard + ranked ELO
Royalty enforcement (pNFT)           Player profiles + stats
Animal NFT traits (V2)               Balance config (hot-tunable)
                                     Anti-cheat validation
```

**Key principle:** Blockchain touches only asset ownership and value transfer. Real-time game logic runs off-chain on Supabase. The `balance_config` table in Supabase enables hot-fixes to animal/soldier balance without any deploy.

### 6.2 APEX Token Spec

```
Token standard:     SPL Fungible (Token-2022)
Symbol:             APEX
Decimals:           6
Max supply:         1,000,000,000 (1 billion APEX)
Mint authority:     Multisig (3/5) — held by founding team
Freeze authority:   Disabled at launch (cannot freeze player wallets)
```

### 6.3 NFT Standard

```
Standard:           Metaplex Core (replacing deprecated Token Metadata)
Royalty model:      pNFT (Programmable NFT) — enforced 5% royalty
Metadata storage:   Arweave (permanent, decentralised)
Collections:        Genesis Soldiers + Genesis Animals (separate collections, same ecosystem)
```

### 6.4 Wallet Integration

```
Primary:     Phantom
Supported:   Backpack, Solflare, Glow
SDK:         @solana/wallet-adapter-react
Auth model:  Sign-in-with-Solana (SIWS) — no email/password required
Fallback:    Email/password for non-Web3 users (wallet linkable later)
```

---

## 7. Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Game Engine | Phaser 3 | 3.90 | 2D physics, rendering, input |
| Frontend | React + Vite | 19 / 8 | UI dashboard, shop, lobby |
| Styling | Tailwind CSS | 4 | Utility-first styling |
| Backend | Supabase | Latest | Auth, DB, Realtime, Storage |
| Database | PostgreSQL | 15 | Game data, user data |
| Realtime | Supabase Realtime | — | Turn sync, live match state |
| Blockchain | Solana | Mainnet-Beta | Asset ownership, APEX token |
| NFT SDK | Metaplex Umi | Latest | NFT minting and querying |
| Wallet | @solana/wallet-adapter | Latest | Multi-wallet support |
| Token | SPL Token-2022 | — | APEX fungible token |
| Deploy | Vercel | — | Frontend hosting |
| CDN | Cloudflare | — | Global static asset delivery |
| Analytics | PostHog (self-hosted) | — | Funnel and retention tracking |
| Balance Config | Supabase table | — | Hot-tunable balance params (no deploy needed) |

---

## 8. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                             │
│  ┌─────────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │  Phaser 3 Game  │ │  React UI    │ │ Phantom Wallet│ │
│  │  (canvas)       │ │  Dashboard   │ │ (tx signing)  │ │
│  └────────┬────────┘ └──────┬───────┘ └───────┬───────┘ │
└───────────┼────────────────┼─────────────────┼──────────┘
            │                │                 │
┌───────────┼────────────────┼─────────────────┼──────────┐
│  BACKEND LAYER             │                 │           │
│  ┌────────▼────────┐ ┌─────▼──────┐         │           │
│  │ Supabase        │ │ Supabase   │         │           │
│  │ Realtime        │ │ PostgreSQL │         │           │
│  │ (turn sync)     │ │ (game data)│         │           │
│  │                 │ │ balance_   │         │           │
│  │                 │ │ config     │         │           │
│  └─────────────────┘ └────────────┘         │           │
└──────────────────────────────────────────────┼──────────┘
                                               │
┌──────────────────────────────────────────────┼──────────┐
│  BLOCKCHAIN LAYER (Solana)                   │           │
│  ┌───────────────┐ ┌──────────────┐ ┌───────▼────────┐ │
│  │ Battle Vault  │ │ Metaplex NFT │ │  APEX SPL Token│ │
│  │ (escrow V2)   │ │ Soldiers +   │ │  (balances)    │ │
│  │               │ │ Animals (V2) │ │                │ │
│  └───────────────┘ └──────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 8.1 Codebase Architecture (Current State → Target State)

**Current state issue:** `BattleScene.js` is a ~500-line monolith. `TouchControls.js` is 350+ lines. As Animal PVP is added, this will collapse into unmaintainability without refactoring.

**Target file structure (V2):**

```
src/
├── game/
│   ├── entities/
│   │   ├── ICombatEntity.js      ← NEW: interface contract
│   │   ├── Soldier.js            ← Refactored from BattleScene inline logic
│   │   ├── Animal.js             ← NEW: base animal class
│   │   ├── animals/
│   │   │   ├── Wolf.js
│   │   │   ├── Rhino.js
│   │   │   ├── Eagle.js
│   │   │   ├── Snake.js
│   │   │   └── Elephant.js
│   │   ├── EntityFactory.js      ← NEW: factory pattern
│   │   └── AnimalDefs.js         ← Already exists ✅
│   ├── combat/
│   │   ├── WeaponSystem.js       ← Refactored: supports animal weapons
│   │   ├── AnimalAbilities.js    ← NEW
│   │   ├── StatusEffects.js      ← NEW
│   │   └── DamageCalculator.js   ← NEW: with cross-type scaling
│   ├── physics/
│   │   ├── ProjectilePhysics.js  ← Already exists ✅
│   │   └── TerrainGenerator.js   ← Already exists ✅
│   ├── scenes/
│   │   ├── BattleScene.js        ← Refactored: entity-agnostic loop
│   │   ├── AnimalSelectScene.js  ← NEW
│   │   └── MatchmakingScene.js   ← NEW
│   ├── systems/
│   │   ├── GameState.js          ← Already exists ✅
│   │   └── TouchControls.js      ← Already exists ✅
│   └── ui/
│       ├── AnimalHUD.js          ← NEW: ability cooldowns + status effects
│       └── EntitySwitcher.js     ← NEW: soldier/animal toggle in lobby
└── components/
    ├── App.jsx                   ← Already exists ✅
    ├── MainMenu.jsx              ← Already exists ✅
    ├── CharacterSelect.jsx       ← Already exists ✅
    ├── GameCanvas.jsx            ← Already exists ✅
    └── GameOverScreen.jsx        ← Already exists ✅
```

---

## 9. Database Schema

### Core Tables

```sql
-- Players
CREATE TABLE players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet       TEXT UNIQUE,
  username     TEXT UNIQUE NOT NULL,
  email        TEXT,
  level        INT DEFAULT 1,
  xp           INT DEFAULT 0,
  apex_balance BIGINT DEFAULT 0,
  wins         INT DEFAULT 0,
  losses       INT DEFAULT 0,
  elo          INT DEFAULT 1000,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_one      UUID REFERENCES players(id),
  player_two      UUID REFERENCES players(id),
  winner          UUID REFERENCES players(id),
  map             TEXT NOT NULL,
  match_type      TEXT DEFAULT 'soldier_duel',
  -- Values: soldier_duel | animal_duel | cross_species | pack_battle | apex_arena
  entity_type_p1  TEXT DEFAULT 'soldier',
  entity_type_p2  TEXT DEFAULT 'soldier',
  turns           INT DEFAULT 0,
  apex_wagered    BIGINT DEFAULT 0,
  sol_wagered     NUMERIC(12,6) DEFAULT 0,
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);

-- Match turns (full replay data)
CREATE TABLE match_turns (
  id              BIGSERIAL PRIMARY KEY,
  match_id        UUID REFERENCES matches(id),
  turn_num        INT NOT NULL,
  player_id       UUID REFERENCES players(id),
  weapon          TEXT NOT NULL,
  angle           FLOAT NOT NULL,
  power           FLOAT NOT NULL,
  wind            FLOAT NOT NULL,
  hit             BOOLEAN DEFAULT FALSE,
  damage          INT DEFAULT 0,
  ability_used    TEXT,
  status_effects  JSONB,
  -- e.g., [{"type": "poison", "damage": 8, "remaining_turns": 2}]
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- NFT inventory (off-chain mirror of on-chain ownership)
CREATE TABLE nft_inventory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID REFERENCES players(id),
  mint_address TEXT NOT NULL,
  nft_type     TEXT NOT NULL,
  -- character_soldier | character_animal | weapon_skin | pet | clothing
  metadata     JSONB,
  equipped     BOOLEAN DEFAULT FALSE,
  synced_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Animal classes (server-authoritative definitions)
CREATE TABLE animal_classes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species           TEXT NOT NULL,
  class             TEXT NOT NULL,
  base_hp           INTEGER NOT NULL,
  speed_modifier    FLOAT DEFAULT 1.0,
  ability_name      TEXT NOT NULL,
  ability_description TEXT,
  ability_cooldown  INTEGER DEFAULT 3,
  rarity            TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Animal weapons
CREATE TABLE animal_weapons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  damage          INTEGER NOT NULL,
  weapon_type     TEXT NOT NULL,
  unlock_level    INTEGER DEFAULT 1,
  blast_radius    INTEGER,
  special_effect  JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Balance config (hot-tunable, no deploy required)
CREATE TABLE balance_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Token economy telemetry
CREATE TABLE apex_economy_log (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,
  -- 'earn_match_win' | 'earn_quest' | 'spend_ammo' | 'spend_unlock' | 'spend_ranked_fee'
  player_id   UUID REFERENCES players(id),
  amount      BIGINT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Leaderboard (materialised view, refreshed every 5 min)
CREATE MATERIALIZED VIEW leaderboard AS
  SELECT id, username, elo, wins, losses,
         ROUND(wins::NUMERIC / NULLIF(wins+losses,0) * 100, 1) AS winrate
  FROM players
  ORDER BY elo DESC;

-- Animal leaderboard
CREATE MATERIALIZED VIEW animal_leaderboard AS
  SELECT
    p.id, p.username, p.wallet,
    COUNT(*) FILTER (WHERE m.winner = p.id) AS animal_wins,
    COUNT(*) AS animal_matches,
    ROUND(100.0 * COUNT(*) FILTER (WHERE m.winner = p.id) / NULLIF(COUNT(*), 0), 1) AS win_rate
  FROM players p
  JOIN matches m ON (m.player_one = p.id OR m.player_two = p.id)
  WHERE m.match_type IN ('animal_duel', 'cross_species')
  GROUP BY p.id;
```

---

## 10. Roadmap

### Stage 1 — Core Game Engine (Weeks 1–3) ✅ COMPLETE
- [x] Phaser 3 battlefield
- [x] Projectile physics (gravity + wind + weight)
- [x] Terrain deformation on explosion
- [x] Turn-based input system (move → aim → charge → fire)
- [x] HP system with damage falloff
- [x] Ricochet system
- [x] Touch controls (mobile)
- [x] Wolf + Rhino entities (validates ICombatEntity foundation)
- [ ] Second map (Jungle Stronghold)
- [ ] All 10 soldier weapons
- [ ] Soldier class system (Assault / Heavy / Recon)

### Stage 2 — Multiplayer (Weeks 4–5)
- [ ] Supabase project setup + schema migration
- [ ] Supabase Realtime turn synchronisation
- [ ] Player authentication (email + wallet SIWS)
- [ ] Lobby + matchmaking queue
- [ ] Win/loss recording + APEX reward flow
- [ ] Basic leaderboard

### Stage 3 — Full Weapon Roster + Maps (Weeks 6–7)
- [ ] All 10 soldier weapons with unique mechanics
- [ ] Both V1 maps (Desert, Jungle)
- [ ] Wind system visual indicator
- [ ] Soldier class abilities (Assault / Heavy / Recon)
- [ ] Sound effects + music

### Stage 4 — Solana Economy (Weeks 8–9)
- [ ] Phantom wallet connect (wallet-adapter)
- [ ] APEX SPL token deployment (Devnet)
- [ ] Win → APEX reward flow
- [ ] Basic shop (spend APEX on ammo + weapon unlocks)
- [ ] On-chain balance sync to Supabase

### Stage 5 — NFT Characters (Weeks 10–11)
- [ ] Genesis Soldier collection assets (3,000 SVG/PNG variants)
- [ ] Metaplex Core collection deployment (Devnet → Mainnet)
- [ ] Wallet NFT detection (read player's NFTs, equip in-game)
- [ ] NFT trait → in-game stat mapping
- [ ] Magic Eden collection listing

### Stage 6 — Polish + Public Launch (Weeks 12–13)
- [ ] Full UI polish (lobby, shop, profile, leaderboard)
- [ ] Onboarding flow for non-Web3 users
- [ ] Mobile-responsive layout
- [ ] Landing page
- [ ] Vercel production deploy
- [ ] APEX token Mainnet deploy
- [ ] Genesis Soldier mint event

### V2 — Animal PVP (Post-Launch, 8–12 weeks)

> This is a full combat system expansion, not a cosmetic drop. Timeline and resources are in Section 12.

- [ ] ICombatEntity interface refactor (BattleScene split)
- [ ] Wolf + Rhino validation in Animal Duel mode
- [ ] Eagle, Snake, Elephant implementation
- [ ] Animal weapons (Claw Slash → Primal Fury)
- [ ] StatusEffects system (poison, armor, buffs)
- [ ] AnimalAbilities system
- [ ] Cross-species matchmaking + balance config
- [ ] Genesis Animals Metaplex collection
- [ ] Animal mint event (funds V2 dev completion)
- [ ] Battle Vault escrow (Anchor/Rust) + security audit
- [ ] SOL prize pool matches
- [ ] Ranked seasons with ELO brackets
- [ ] Battle pass

### V3 (Scale)
- [ ] Pet NFT collection
- [ ] Clothing NFT sets
- [ ] Tournament system
- [ ] 2v2 / 4-player modes
- [ ] Mobile app (React Native + Phaser)
- [ ] Custom map builder
- [ ] Spectator mode

---

## 11. APEX Token Design

### Supply Distribution

```
Total Supply: 1,000,000,000 APEX
─────────────────────────────────────────────────────────
Play-to-Earn Rewards Pool:    40%  (400,000,000 APEX) — emitted over 4 years
Team & Development:           15%  (150,000,000 APEX) — 2-year vest, 6-month cliff
Ecosystem & Partnerships:     15%  (150,000,000 APEX) — grants, integrations
Initial Liquidity:            10%  (100,000,000 APEX) — DEX liquidity at launch
Community Airdrop:            10%  (100,000,000 APEX) — early players, NFT holders
Treasury Reserve:             10%  (100,000,000 APEX) — DAO governance (future)
```

### Emission Schedule

| Year | APEX/day emitted | Cumulative |
|---|---|---|
| Year 1 | ~547,945 | ~200M |
| Year 2 | ~273,972 | ~300M |
| Year 3 | ~136,986 | ~350M |
| Year 4 | ~68,493  | ~375M |

### Token Velocity Controls

- **Weekly withdrawal limit:** 5,000 APEX per wallet (prevents bot farming)
- **Earned APEX cooldown:** 24-hour hold before withdrawal
- **NFT holder multiplier:** Holding a Genesis Soldier or Animal NFT removes withdrawal limits
- **Spending incentives:** APEX used in-game has no cooldown

> For inflation ceiling analysis and DAU-linked sink projections, see Section 15.

---

## 12. Animal PVP Combat System

> **Status:** V2 core feature — not cosmetic. This is the primary post-launch retention driver.

### 12.1 Design Rationale

| Driver | Impact |
|--------|--------|
| Player retention | New combat styles prevent meta staleness |
| NFT revenue | Genesis Animals = separate mint event (1,500 SOL primary) |
| Competitive diversity | Asymmetric Animal vs Soldier matchups |
| Community engagement | Animal factions drive social identity and clan formation |
| Market differentiation | No competing Solana game combines artillery combat with creature PVP |

### 12.2 ICombatEntity Interface

The `BattleScene` combat loop must be **entity-agnostic**. Both Soldier and Animal implement:

```javascript
// ICombatEntity interface
{
  getHP()
  takeDamage(amount, type)
  getPosition()
  move(x, y)
  getAvailableWeapons()
  useAbility()
  getStatusEffects()
  getSprite()
  getClass()
  getEntityType()       // 'soldier' | 'animal'
}
```

This is the **highest-priority engineering work** in V2. It unlocks everything else and de-risks the soldier regression.

### 12.3 Balance Framework (Cross-Species Matches)

All balance parameters stored in `balance_config` table — hot-tunable without deploy:

```
SOLDIER ADVANTAGES             ANIMAL ADVANTAGES
──────────────────             ─────────────────
Ranged weapon variety          Higher base HP (average)
Trajectory preview             Stronger special abilities
Proven meta strategies         Terrain traversal (burrow, fly)
Weapon shop economy            Passive effects (poison, armor)
```

**Balancing levers:**
- Per-class HP multiplier adjustments
- Damage scaling coefficients for cross-type matches
- Ability cooldown tuning
- Wind sensitivity per entity type

### 12.4 Matchmaking (V2)

```
Current:  Player → Queue (ELO) → Soldier vs Soldier

V2:       Player → Select Entity → Queue (ELO + entity type) → Match

Queues:
  animal_duel     Animals only
  soldier_duel    Soldiers only (existing)
  cross_species   Mixed (Animal vs Soldier)
  ranked          Any entity type (unified ELO)
```

### 12.5 NFT Metadata

```json
{
  "name": "APEX Animal #0101",
  "symbol": "APEX",
  "attributes": [
    { "trait_type": "Entity",      "value": "Animal" },
    { "trait_type": "Species",     "value": "Wolf" },
    { "trait_type": "Class",       "value": "Predator" },
    { "trait_type": "Rarity",      "value": "Common" },
    { "trait_type": "Fur Pattern", "value": "Arctic White" },
    { "trait_type": "War Paint",   "value": "Blood Streak" },
    { "trait_type": "Accessory",   "value": "Spiked Collar" },
    { "trait_type": "Battle Scar", "value": "Left Eye" },
    { "trait_type": "XP Bonus",    "value": "3%" }
  ]
}
```

### 12.6 Implementation Phases

| Phase | Weeks | Key Deliverables |
|---|---|---|
| 1 — Foundation | 1–3 | ICombatEntity refactor, Wolf + Rhino, 2 default weapons, DB tables |
| 2 — Mechanics | 4–5 | StatusEffects, AnimalAbilities, Pack Howl + Thick Hide, Sonic Roar + Burrow |
| 3 — Full Roster | 6–7 | Eagle + Snake + Elephant, all abilities, cross-species queue |
| 4 — NFT + Economy | 8–9 | Metaplex collection, mint page, APEX shop for animal weapons |
| 5 — Polish + Launch | 10–12 | Animations, sound, leaderboard, balance tuning, public launch |

### 12.7 Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Animal match adoption | 30%+ of matches within 30 days | Supabase `matches` query |
| Cross-species balance | 45–55% win rate per side | `balance_config` telemetry |
| Genesis Animal mint | 80%+ within 72 hours | On-chain mint tracking |
| Player retention (D7) | +15% vs pre-animal baseline | PostHog cohort |
| New unique wallets | +2,000 within first month | Supabase `players` |

### 12.8 Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Cross-species balance | HIGH | `balance_config` hot-tuning; launch animal-only mode first, add cross-species after data |
| Scope creep | MEDIUM | Phase 1–2 ship only 2 animals; validate before full roster |
| Sprite/art pipeline | MEDIUM | Commission art Day 1 of V2 planning — art is the critical path |
| ICombatEntity refactor breaks soldiers | MEDIUM | Full regression test suite before any animal code ships |
| Matchmaking fragmentation | MEDIUM | Start unified queue; split only if population supports it |

---

## 13. Anti-Cheat & Fairness

### Off-Chain Validation

```typescript
function validateTurn(turn: MatchTurn): ValidationResult {
  const serverResult = simulateProjectile({
    angle:  turn.angle,
    power:  turn.power,
    wind:   turn.wind,   // server-authoritative wind, not client
    origin: turn.origin
  });
  return Math.abs(serverResult.landX - turn.clientLandX) < 2;
}
```

### Fairness Rules
- Wind values are server-generated and signed — client cannot spoof
- Turn timer: 45 seconds server-enforced — AFK protection
- Match abandon: >90 seconds disconnect = opponent wins
- APEX rewards only paid on server-confirmed match completion
- Anti-sybil: one ranked account per wallet; fingerprinting for duplicate detection
- Animal ability validation: server verifies cooldown state before allowing ability use

---

## 14. Claude Code Agent Instructions (CLAUDE.md)

> This section defines how AI coding agents should interact with this codebase. Copy Section 14.1 to a file named `CLAUDE.md` in your repo root.

### 14.1 CLAUDE.md Content (Copy This to Repo Root)

```markdown
# APEX NUKE — Claude Code Instructions

## Project Overview
APEX NUKE is a Phaser 3 + React + Tailwind turn-based 2D artillery PvP game
with Solana NFT integration. Two animals/soldiers battle on procedurally
generated terrain with physics-driven projectiles.

## Tech Stack
- Phaser 3.90 — game engine (physics, rendering, canvas)
- React 19 + Vite 8 — UI layer (menus, lobby, character select)
- Tailwind CSS 4 — styling
- Supabase — backend (planned: not yet wired up)
- Solana / Metaplex — blockchain (planned: not yet wired up)

## Code Architecture
- src/game/scenes/BattleScene.js — MAIN GAME LOOP (currently monolithic; split planned for V2)
- src/game/entities/AnimalDefs.js — animal definitions (Wolf, Rhino)
- src/game/physics/ProjectilePhysics.js — projectile simulation
- src/game/physics/TerrainGenerator.js — procedural terrain
- src/game/systems/GameState.js — turn/phase state machine
- src/game/systems/TouchControls.js — mobile touch input
- src/components/ — React UI screens

## Coding Conventions
- JavaScript (not TypeScript) — keep it JS for now
- No external state management libraries — use React useState / Phaser scene state
- Physics constants live in their respective files (GRAVITY in ProjectilePhysics.js)
- All game-world coordinates in pixels; camera zoom handles display scaling
- Use PHASE enum from GameState.js for all phase checks — never hardcode strings

## Current V1 Priorities
1. Complete all 10 soldier weapons with unique mechanics
2. Jungle Stronghold map
3. Soldier class system (Assault/Heavy/Recon abilities)
4. Supabase multiplayer (turn sync via Realtime)
5. APEX token reward flow

## V2 Target Architecture (do not break this pattern when adding code)
BattleScene should become entity-agnostic via ICombatEntity interface.
Wolf and Rhino in AnimalDefs.js are the proof-of-concept for this pattern.
When adding V2 animal combat, create:
  src/game/entities/ICombatEntity.js
  src/game/entities/Animal.js (base class)
  src/game/entities/animals/Wolf.js, Rhino.js, Eagle.js, Snake.js, Elephant.js
  src/game/entities/EntityFactory.js

## Things NOT to do
- Do not add TypeScript without explicit instruction
- Do not install external physics libraries (Phaser physics + our custom code is sufficient)
- Do not add Redux, Zustand, or any state management library
- Do not connect to Supabase or Solana until those stages begin — mock the data first
- Do not split BattleScene prematurely — the split happens as part of V2 animal system work
- Do not add new npm dependencies without checking if Phaser or vanilla JS can handle it

## File Size Warning
BattleScene.js is ~500 lines. Before adding more code to it:
1. Extract the new feature into its own file if possible
2. Add the new file, then import into BattleScene
3. Keep BattleScene as a coordinator, not an implementation file

## Testing Approach
- Run `npm run dev` and test in browser — no unit tests yet
- Test physics changes by playing a match and observing behavior
- Mobile: test touch controls on actual device or Chrome DevTools mobile emulation
```

### 14.2 How to Use CLAUDE.md with Claude Code

1. Create the file at your repo root: `CLAUDE.md`
2. Paste the content from Section 14.1
3. Claude Code reads `CLAUDE.md` automatically on every session start
4. Every new coding session starts with full context — no more "cold start" problem

### 14.3 Prompt Templates for Common Tasks

**Adding a new weapon:**
```
Add [WEAPON_NAME] to the soldier weapon system. Weapon spec:
- Damage: X, blast radius: Xpx, projectile speed: Xpx/s, weight: X
- Special mechanic: [describe]
Follow the pattern in AnimalDefs.js weapons array. Add to BattleScene weapon handling.
Do not change anything in ProjectilePhysics.js unless the weapon needs a new
physics behavior that doesn't exist yet.
```

**Adding a new animal:**
```
Add [ANIMAL_NAME] (class: [CLASS]) to AnimalDefs.js. Stats:
- HP: X, speed: X, jumpForce: X
- Weapon 1: [name, damage, blastRadius, projectileSpeed, weight, bounces, description]
- Weapon 2: [name, ...]
- Ability: [id, name, description, effect, cooldown]
Follow the exact structure of the existing wolf and rhino definitions.
```

**Bug fix:**
```
Bug: [describe what's happening] in [file/feature].
Steps to reproduce: [describe]
Do NOT change any other file than the minimum needed to fix this.
Show me the before/after diff before applying changes.
```

---

## 15. Token Economy Stress-Test Framework

> This section addresses the single biggest risk in the APEX economy: inflation outpacing sinks during slow player growth.

### 15.1 Daily Emission vs Sink Model

**Assumptions for break-even analysis:**

| Variable | Conservative | Moderate | Optimistic |
|---|---|---|---|
| DAU (Day 30) | 200 | 800 | 2,500 |
| Matches per player per day | 2 | 3 | 4 |
| Win rate (avg) | 50% | 50% | 50% |
| Daily login bonus claim rate | 60% | 70% | 80% |

**Daily APEX emitted (conservative/moderate/optimistic):**

```
Win rewards:   200×2×0.5×120 = 24,000  |  800×3×0.5×120 = 144,000  |  2500×4×0.5×120 = 600,000
Login bonus:   200×0.6×30   = 3,600   |  800×0.7×30   = 16,800   |  2500×0.8×30   = 60,000
Daily quests:  200×0.4×65   = 5,200   |  800×0.5×65   = 26,000   |  2500×0.6×65   = 97,500
─────────────────────────────────────────────────────────────────────────────────────────────
TOTAL EMITTED: ~32,800/day            |  ~186,800/day             |  ~757,500/day
```

**Daily APEX absorbed by sinks (same DAU assumptions):**

```
Ranked entry fees: DAU×0.3×50 = 3,000 | 12,000 | 37,500
Ammo pack purchases: DAU×0.2×60 = 2,400 | 9,600 | 30,000
Weapon unlocks (amortized): +500 | +2,000 | +5,000
─────────────────────────────────────────────────────────────────────────────────────────────
TOTAL ABSORBED: ~5,900/day            |  ~23,600/day              |  ~72,500/day
```

**Inflation ratio (emitted / absorbed):**

```
Conservative: 32,800 / 5,900   = 5.6× ← DANGER — economy inflates fast
Moderate:    186,800 / 23,600  = 7.9× ← DANGER — even worse at scale
Optimistic:  757,500 / 72,500  = 10.5× ← CRITICAL — sinks cannot keep up
```

### 15.2 Inflation Ceiling Interventions

The base sink model is insufficient. These interventions must be designed in before launch:

**Intervention 1 — Ranked entry fee scales with ELO**
Higher-ranked players pay more to enter ranked: 50 APEX (ELO <1200) → 150 APEX (ELO 1400+). This targets the highest-activity players.

**Intervention 2 — Weapon upgrade system (not unlock)**
After unlocking a weapon, players can upgrade it (damage +5%, cosmetic change) for 300–800 APEX. Creates a recurring sink for high-level players.

**Intervention 3 — NFT staking burns APEX**
Equipping an NFT to a match costs 10 APEX (activation fee). Cosmetic-only but creates a meaningful volume sink for NFT holders.

**Intervention 4 — Battle Pass is a hard sink**
800 APEX for the battle pass (or 4 SOL). At 100 pass purchases, that's 80,000 APEX absorbed per season. At 500 purchases: 400,000 APEX.

**Intervention 5 — APEX withdrawal tax**
10% burn on APEX withdrawn to external wallet (only for non-NFT holders). NFT holders withdraw free. Incentivises holding NFTs AND reduces circulating dumped supply.

### 15.3 Emergency Levers

If APEX is inflating faster than acceptable (track via `apex_economy_log`):
- Reduce win reward from 120 → 90 APEX (server-side, no deploy)
- Increase ranked entry fee (server-side)
- Introduce a limited-time "APEX sink event" (double XP if you spend APEX on cosmetics)
- Reduce daily quest rewards temporarily

**Monitoring query (run daily):**

```sql
SELECT
  DATE(created_at) as day,
  SUM(CASE WHEN event_type LIKE 'earn_%' THEN amount ELSE 0 END) as emitted,
  SUM(CASE WHEN event_type LIKE 'spend_%' THEN amount ELSE 0 END) as absorbed,
  ROUND(
    SUM(CASE WHEN event_type LIKE 'earn_%' THEN amount ELSE 0 END)::NUMERIC /
    NULLIF(SUM(CASE WHEN event_type LIKE 'spend_%' THEN amount ELSE 0 END), 0),
    2
  ) as inflation_ratio
FROM apex_economy_log
GROUP BY DATE(created_at)
ORDER BY day DESC;
```

**Target inflation ratio: ≤ 2.5×.** Above 3× requires an immediate intervention from Section 15.2.

---

## 16. Go-to-Market

### Target Audience

| Segment | Profile | Hook |
|---|---|---|
| Web3 gaming degens | Already on Solana | NFT ownership + prize pools |
| Wild Ones / Worms nostalgia | Grew up with browser games, now 25–35 | "Remember Wild Ones? Now you own it." |
| Competitive casual gamers | Play daily, want ranked progression | ELO ladder + seasonal rewards |
| NFT collectors | Magic Eden regulars | Genesis Soldier scarcity |
| Animal fandom (V2) | Overlaps with Web3 and gaming communities | Own your animal champion |

### Launch Sequence

```
Month -2:  Announce on X — teaser trailer + waitlist
Month -1:  Genesis Soldier whitelist mint (WL for early testers)
Week -2:   Beta — open access, Devnet only
Week -1:   Fix critical bugs, Mainnet APEX token deploy
Day 0:     Public launch — Mainnet, Genesis Soldier public mint
Week +2:   First ranked season starts
Month +2:  V2 animal PVP closed beta (Genesis Soldier holders get early access)
Month +3:  Genesis Animals public mint + Animal Duel mode launch
Month +4:  Battle Vault audit complete → SOL prize pools live
```

### Marketing Channels
- **X/Twitter:** Weapon showcase threads, match highlight clips, economy mechanic explainers
- **Discord:** Community hub, daily quests, leaderboard
- **YouTube Shorts / TikTok:** 30-second explosion highlight clips
- **Magic Eden:** Collection pages for Soldiers + Animals
- **Solana ecosystem:** Solana Foundation gaming grants, Superteam Indonesia network

---

## Contributing

Closed-source during active development. Public contributions open after V1 launch.

## License

Proprietary. All rights reserved. © 2025–2026 APEX NUKE / Findocere Ops.

---

*Built on Solana. Two entities enter. One leaves.*


---

## 17. Architecture Decision Records (ADRs)

> Every significant architectural choice is documented here with rationale. When a coding agent asks "why is it done this way?", the answer is in this section. Add new ADRs before making architectural changes — do not change the architecture and update the ADR after the fact.

### ADR-1: Phaser 3 over Unity WebGL or Godot

**Decision:** Use Phaser 3 as the game engine.

**Rationale:** Phaser 3 runs natively in the browser as a JavaScript library, making it composable with React without an iframe or postMessage boundary. Unity WebGL and Godot's HTML5 export both require embedding the game in an iframe, which creates friction for Solana wallet-adapter integration (wallet popups, SIWS signing). Phaser 3 runs in the same JS context as React and wallet-adapter — wallet transactions trigger without any cross-frame messaging.

**Trade-off:** Phaser 3 lacks a visual scene editor. All terrain and entity code is programmatic. Accepted.

---

### ADR-2: Manual gravity physics over Phaser Arcade Physics

**Decision:** `ProjectilePhysics.js` implements its own gravity, wind, and ricochet simulation rather than using Phaser's built-in Arcade Physics.

**Rationale:** Phaser Arcade Physics uses a fixed gravity applied to all bodies. APEX NUKE requires per-projectile gravity, per-weapon wind sensitivity (the `projectileWeight` modifier), terrain heightmap collision (not rectangle/circle colliders), and ricochet via surface normal reflection. None of these are possible within Arcade Physics without rewriting it. The custom physics sim is ~150 lines and fully deterministic, which also enables server-side validation of projectile trajectories for anti-cheat.

**Trade-off:** We maintain the physics code ourselves. Accepted — it's small and stable.

---

### ADR-3: Off-chain game state, on-chain asset ownership only

**Decision:** All real-time game state (turn order, HP, projectile positions, terrain deformation) lives in Supabase. Solana only stores NFT ownership, APEX token balances, and (V2) escrow.

**Rationale:** Running game actions on-chain would require a wallet popup and ~400ms confirmation latency per turn. That makes the game unplayable. The correct boundary is: blockchain for what *persists and has monetary value* (who owns what, token balances), Supabase for what *changes fast and has no monetary value* (match state). Match results are signed by the Supabase edge function before triggering APEX token rewards — the chain doesn't need to see every turn, only the final outcome.

**Trade-off:** Match results depend on Supabase availability. A Supabase outage pauses games but doesn't lose assets. Accepted.

---

### ADR-4: ICombatEntity interface before Animal PVP ships

**Decision:** Before any Animal PVP code ships in V2, `BattleScene.js` must be refactored to operate on an `ICombatEntity` interface, with Soldier extracted into its own class implementing that interface.

**Rationale:** The current `BattleScene.js` has soldier-specific logic embedded in the combat loop (direct field access to `ANIMAL_DEFS`, hardcoded HP bars, etc.). Adding animal entities by forking the scene creates two codepaths that diverge permanently. The `ICombatEntity` refactor is a one-time investment that makes every future entity type (new animals, bosses, V3 modes) a 50-line class, not a scene surgery.

**Risk:** Refactoring BattleScene could regress soldier combat. Mitigation: write regression tests for the full soldier combat loop before the refactor begins. Do not ship the refactor without passing regression tests.

---

### ADR-5: `balance_config` Supabase table for hot-tunable game balance

**Decision:** All balance parameters (damage multipliers, HP values, ability cooldowns, wind sensitivity coefficients) that may need tuning post-launch are stored in a `balance_config` Supabase table, fetched at match start.

**Rationale:** Solana game balance — especially cross-species Animal vs Soldier matchups — cannot be perfectly calibrated before launch. If balance parameters are hardcoded in client code, fixing a broken matchup requires an app deploy (Vercel push + user cache invalidation). With `balance_config`, a balance fix is a Supabase row update. No deploy. Players get the fix in the next match they start. This is how competitive games handle live balance patching.

**Trade-off:** Balance fetching adds ~100ms to match start time. Acceptable. Cache the config client-side for the session duration.

---

### ADR-6: APEX dual-currency separation from SOL

**Decision:** APEX is the in-game grind currency (SPL token). SOL is the real-money layer for NFT mints and (V2) prize pools. They are never conflated.

**Rationale:** If APEX directly pegged to SOL, a SOL price spike would instantly reprice all in-game costs in fiat terms, destroying the economy for players in lower-income markets (Indonesia is the primary market). Keeping APEX as a floating in-game currency means the game economy is insulated from crypto volatility. Players grind APEX regardless of SOL price. SOL is only touched when a player opts into the NFT/prize-pool layer.

**Trade-off:** Two currencies add onboarding friction. Mitigation: the free-to-play default only ever touches APEX. SOL is invisible until the player wants it.

---

### ADR-7: Battle Vault deferred to V2 with mandatory security audit

**Decision:** The SOL escrow prize pool system does not ship in V1. It requires a custom Anchor program that must be audited before real SOL flows through it.

**Rationale:** Unaudited escrow programs on Solana have been drained repeatedly. A drain on launch day would end the project. The economic loss is secondary — the reputation loss in the Solana gaming community is permanent. V1 launches with APEX token rewards only (no real SOL at risk in the game). V2 funds the audit from Genesis Soldier mint revenue before the Battle Vault ships.

**Trade-off:** V1 has no SOL prize pools. This is the correct trade-off.

---

### ADR-8: Procedural terrain over pre-authored maps

**Decision:** Both V1 maps (Desert Outpost, Jungle Stronghold) use procedurally generated terrain from `TerrainGenerator.js`, not pre-authored tilemap files.

**Rationale:** Pre-authored tilemaps require a tilemap editor, sprite sheets, and a loading pipeline. Procedural terrain is 150 lines of math that runs in <10ms and produces a different battlefield every match — directly contributing to replayability. The terrain generator uses layered sine waves (no external dependency, no assets) and deforms in real-time on explosion impact. This is the correct approach for a game that runs 100% in the browser with no asset pipeline.

**Trade-off:** Maps cannot be hand-crafted for competitive balance. The `balance_config` table compensates by letting us tune spawn distances and terrain parameters.

---

### ADR-9: Single-device local multiplayer as V1 baseline

**Decision:** V1 ships with local multiplayer (two players on one device, turn-based). Online multiplayer (Supabase Realtime) is Stage 2.

**Rationale:** Building multiplayer first makes it impossible to test the game without a second player or a real network. Local multiplayer lets us validate the core combat loop, physics, and balance with zero backend dependency. The player swaps at each turn. This is not a permanent design — it's a validation shortcut. The entire codebase is structured to add online multiplayer without redesigning the game.

**Trade-off:** V1 is not shareable as an online game. Accepted — it's a prototype that works.

---

## 18. Multi-Agent Review System

> Adapted from the P2P ridehailing governance pattern. After completing each build stage, spawn two reviewing subagents. Do not proceed until both score 10/10 or the safety valve is used.

### Subagent 1: "Carmack" (Code Quality)

Spawn with this system prompt:

```
You are John Carmack — legendary game programmer and architect of Doom, Quake,
and Oculus. You have world-class expertise in game physics, rendering pipelines,
JavaScript performance, Phaser 3 internals, Solana/Anchor, and React.
Review the code with ruthless technical precision.

Evaluate: CORRECTNESS (physics math, state machine transitions, no off-by-one),
PERFORMANCE (60fps under load, no garbage collection spikes in update loops,
no unnecessary object allocation), SECURITY (server-side validation of turns,
APEX reward gating, Supabase RLS), ARCHITECTURE (ICombatEntity compliance,
BattleScene as coordinator not implementation, no circular dependencies),
ROBUSTNESS (disconnect handling, NaN guards in physics, edge cases),
CODE_QUALITY (naming, single responsibility, file size bounds).

Rate each 1-10. Overall = minimum. If below 10, list specific issues with
file paths and exact fixes. Format: [criterion: score], OVERALL: N,
ISSUES: [...], APPROVED: YES/NO
```

### Subagent 2: "Miyamoto" (Gameplay & UX)

Spawn with this system prompt:

```
You are Shigeru Miyamoto — creator of Mario, Zelda, and Donkey Kong.
The player should never feel the blockchain. Combat should be immediately
readable. Every screen should communicate what to do without instructions.

Evaluate: GAME_FEEL (does firing a shot feel satisfying, do explosions read clearly),
READABILITY (is HP damage obvious, is wind direction understandable, is the active
player always clear), ONBOARDING (can a new player pick up the game in 30 seconds),
MOBILE_COMFORT (touch targets big enough, joystick responsive, no accidental inputs),
BLOCKCHAIN_INVISIBILITY (wallet connection never interrupts gameplay, APEX earned
feels like score not crypto), FAIRNESS (does the UI communicate that skill wins, not NFTs).

Rate each 1-10. Overall = minimum. If below 10, list specific issues with
screen names and exact fixes. Format: [criterion: score], OVERALL: N,
ISSUES: [...], APPROVED: YES/NO
```

### Review Loop Procedure

1. Complete build stage. Run `npm run dev`, manually test the new feature.
2. Paste the changed files + relevant spec section into a new Claude conversation with Carmack's prompt.
3. Read scores. Fix all listed issues.
4. Paste the same into a new Claude conversation with Miyamoto's prompt.
5. Fix all listed issues.
6. Re-run both. Repeat up to 5 iterations.
7. **Safety valve:** If 10/10 is not reached after 5 iterations, log remaining issues in `TECH_DEBT.md` and proceed to next stage.

### Which Subagents Review Which Stages

| Stage | Carmack | Miyamoto |
|---|---|---|
| Stage 1 (Core Engine) | ✓ | ✓ |
| Stage 2 (Multiplayer) | ✓ | — |
| Stage 3 (Full Weapons + Maps) | ✓ | ✓ |
| Stage 4 (Solana Economy) | ✓ | — |
| Stage 5 (NFT Characters) | ✓ | ✓ |
| Stage 6 (Polish + Launch) | ✓ | ✓ |
| V2 Phase 1 (ICombatEntity) | ✓ | — |
| V2 Phase 2 (Animal Mechanics) | ✓ | ✓ |
| V2 Phase 3 (Full Roster) | ✓ | ✓ |
| V2 Phase 4 (Animal NFT) | ✓ | — |
| V2 Phase 5 (Animal Polish) | ✓ | ✓ |

---

## 19. Testing Strategy

> This section defines what gets tested, how, and to what coverage standard per module. Minimum 80% coverage before any stage is considered complete. This is a hard gate, not a guideline.

### Testing Tools

- **Unit/Integration:** Vitest (works natively with Vite 8 — no Jest config needed)
- **Coverage:** Vitest's built-in Istanbul/c8 coverage reporter
- **Rust programs:** cargo-tarpaulin + bankrun (BanksClient simulation)
- **Mocking:** Vitest `vi.mock()` for all external calls

### Per-Module Test Specifications

**`src/game/physics/ProjectilePhysics.js`**
- Test: projectile with zero wind travels a pure parabola
- Test: heavier projectile drifts less than lighter in same wind
- Test: ricochet projectile reflects correctly off flat terrain
- Test: ricochet with bouncesLeft=0 detonates instead of bouncing
- Test: `calculateExplosionDamage` returns 0 when target outside blast radius
- Test: `calculateExplosionDamage` returns baseDamage at distance 0
- Test: `calculateKnockback` vector points away from explosion center
- Test: `previewTrajectory` returns expected point count
- Mock: None (pure math)

**`src/game/physics/TerrainGenerator.js`**
- Test: `generateTerrain` returns heightMap with correct column count
- Test: spawn points are above water level
- Test: `deformTerrain` increases heightMap values in blast radius
- Test: `deformTerrain` does not modify columns outside blast radius
- Test: `isInWater` returns true when y >= waterLevel
- Mock: None (pure math)

**`src/game/systems/GameState.js`**
- Test: `createGameState` sets both players to correct defaults
- Test: `generateWind` always returns value in [-150, 150]
- Test: `getWindLabel` returns 'Calm' for |wind| < 30
- Test: phase transitions follow the PHASE enum (no string comparison)
- Mock: None (pure state)

**`src/game/entities/AnimalDefs.js`**
- Test: every animal has hp, speed, jumpForce, bodyWidth, bodyHeight
- Test: every animal has exactly 2 weapons
- Test: every weapon has damage, blastRadius, projectileSpeed, projectileWeight
- Test: every ability has cooldown, id, name, description
- Mock: None (pure data)

**`src/game/scenes/BattleScene.js`** (after ICombatEntity refactor, V2)
- Test: `startMovePhase` sets phase to MOVE
- Test: `advanceCombatTurn` after 2 shots starts new round
- Test: `handleExplosion` calls `deformTerrain` with correct radius
- Test: `handlePlayerDeath` sets phase to GAME_OVER
- Test: `useAbility` pack_howl applies damageMultiplier to next projectile
- Test: `useAbility` thick_hide adds damage_reduction status effect
- Test: `useAbility` does nothing when abilityCooldown > 0
- Mock: Phaser scene, graphics objects, time events

**Rust Program: `ride_request` equivalent → future `match_result` program**
- Test: APEX reward calculation is exact (no rounding loss)
- Test: invalid signature on match result is rejected
- Test: double-reward for same match_id is rejected
- Mock: BanksClient

### Coverage Targets

| Module | Target | Method |
|---|---|---|
| PhysicsProjectile | 90% | Pure math — no excuse for gaps |
| TerrainGenerator | 85% | Pure math |
| GameState | 90% | Pure state machine |
| AnimalDefs | 100% | Pure data validation |
| BattleScene | 75% | Phaser integration complexity |
| TouchControls | 70% | Hardware input hard to unit test |
| Rust programs | 80% | BanksClient |

### TECH_DEBT.md Pattern

When a review iteration fails to reach 10/10 after 5 cycles, create or append to `TECH_DEBT.md` in the repo root:

```markdown
## [Stage Name] — [Date]

### Outstanding Carmack Issues
- [ ] [file:line] [specific issue description]
- [ ] [file:line] [specific issue description]

### Outstanding Miyamoto Issues  
- [ ] [screen name] [specific UX issue]

### Why Not Fixed
[brief explanation — time box, dependency not available, etc.]

### Target Fix Stage
[which future stage will address this]
```

This is not permission to ship broken code. It is a structured acknowledgment that debt exists and will be paid.
