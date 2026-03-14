# ⚡ APEX NUKE
### Solana-Powered Tactical Artillery — Grand Design Document

> **Version:** 0.1 — Pre-Launch  
> **Status:** Active Development  
> **Engine:** Phaser 3 · React · Supabase · Solana  
> **Network:** Solana Mainnet-Beta (Devnet during development)

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
11. [Token Design](#11-apex-token-design)
12. [Anti-Cheat & Fairness](#12-anti-cheat--fairness)
13. [Go-to-Market](#13-go-to-market)

---

## 1. Vision

APEX NUKE is a **military-themed, turn-based 2D artillery PvP browser game** where soldiers, weapons, and cosmetic assets are **Solana NFTs** — meaning players truly own what they earn and buy, can trade it, and carry real value out of the game.

Inspired by the social mechanics of Wild Ones (Facebook, 2009–2013) and the physics-driven gameplay of Worms, APEX NUKE modernises the formula for a Web3-native audience: **competitive ranked play, tokenised asset ownership, and SOL-denominated prize pools.**

The core philosophy:
- **Skill decides matches.** Not pay-to-win. NFTs affect cosmetics and minor perks, not base weapon damage.
- **Ownership is real.** Every character NFT and weapon NFT lives on Solana and is tradeable on Magic Eden.
- **Fun first, blockchain second.** Onboarding works without a wallet. Wallet unlocks the economy layer.

---

## 2. Gameplay

### 2.1 Core Loop

```
Connect wallet → Select soldier NFT → Enter matchmaking →
Turn-based artillery duel → Win APEX tokens → Spend in shop / trade NFTs
```

### 2.2 Turn Structure

Each match is a **1v1 turn-based artillery duel** played on a procedurally generated 2D terrain map:

| Phase | Duration | Description |
|---|---|---|
| Aim | Unlimited | Player moves mouse to set angle |
| Charge | Hold input | Power bar oscillates 0–100% — release to fire |
| Flight | Until impact | Projectile follows physics arc (gravity + wind) |
| Explosion | ~1.5s | Terrain deforms, damage calculated, HP updates |
| Transition | 1s | Wind changes, next player's turn begins |

### 2.3 Physics Model

- **Gravity:** 560 px/s² (tuned for satisfying arc on standard map)
- **Wind:** Randomised each turn, range −120 to +120 px/s² horizontal
- **Terrain deformation:** Craters persist through the full match; terrain topology changes strategy
- **Blast radius:** 62px — damage falls off linearly from impact point
- **Damage range:** 8 (edge of blast) to ~74 (direct hit), modified by soldier class

### 2.4 Win Conditions

| Mode | Win Condition |
|---|---|
| Standard Duel | Last soldier standing (HP > 0) |
| Time Limit | Most HP remaining when timer expires |
| Missile Only (V2) | Restricted weapon set |
| Last Team Standing (V3) | 2v2 or 3v3 team elimination |

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

### 3.2 NFT Asset Types

```
Character NFT         → Soldier with unique skin + class ability
Weapon Skin NFT       → Visual reskin of a weapon (no stat change)
Pet NFT               → Companion that follows your soldier (cosmetic)
Clothing NFT          → Helmet, jacket, boots sets (cosmetic)
Emblem NFT            → Match-start animation + nameplate badge
```

### 3.3 NFT Trait System (Characters)

Each Character NFT has on-chain traits stored in Metaplex metadata:

```json
{
  "name": "APEX Soldier #0042",
  "symbol": "APEX",
  "attributes": [
    { "trait_type": "Class",       "value": "Recon" },
    { "trait_type": "Rarity",      "value": "Rare" },
    { "trait_type": "Helmet",      "value": "Night Ops" },
    { "trait_type": "Jacket",      "value": "Camo Desert" },
    { "trait_type": "Boots",       "value": "Steel Toe" },
    { "trait_type": "Weapon Skin", "value": "Obsidian AR" },
    { "trait_type": "Pet",         "value": "Tactical Dog" },
    { "trait_type": "XP Bonus",    "value": "5%" }
  ]
}
```

### 3.4 Collection Sizes

| Collection | Supply | Mint Price |
|---|---|---|
| Genesis Soldiers | 3,000 | 0.5 SOL |
| Weapon Skins | 10,000 | 0.1 SOL |
| Pets (V2) | 5,000 | 0.2 SOL |
| Clothing Sets (V2) | 8,000 | 0.15 SOL |

---

## 4. Weapon System

### 4.1 V1 Weapon Roster (10 weapons)

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

### 4.2 Weapon Unlock Progression

Weapons unlock by player level (off-chain XP) — ensuring new players aren't overwhelmed:

```
Level 1–4:   Grenade, Missile
Level 5–9:   Cluster Bomb, Smoke Screen
Level 10–14: Airstrike Beacon, EMP Grenade
Level 15–19: Proximity Mine, Teleporter
Level 20+:   Nuke Strike, Bunker Buster
```

---

## 5. Economy & Monetization

> The APEX NUKE economy has **three layers**: free-to-play access, an in-game token economy, and an on-chain NFT ownership layer.

### 5.1 Dual Currency Model

| Currency | Type | How You Get It | What It Buys |
|---|---|---|---|
| **APEX Token** | SPL fungible token (on-chain) | Win matches, daily quests, seasonal rewards | Ammo, weapon unlocks, cosmetic rentals, entry fees |
| **SOL** | Native Solana | Purchase externally | NFT mints, Magic Eden trades, battle vaults (V2) |

These are **deliberately separated**. APEX is the in-game grind currency. SOL is the real-money layer. Players who don't want to spend real money can grind APEX; players who want true ownership use SOL for NFTs.

---

### 5.2 APEX Token — Earn & Spend

**Earning APEX (faucets — tokens entering circulation):**

| Source | APEX Earned | Notes |
|---|---|---|
| Win a standard match | +120 APEX | Base rate |
| Win a ranked match | +200 APEX | Requires minimum level 5 |
| Daily login bonus | +30 APEX | Once per 24h |
| Daily quest (e.g. "land 3 direct hits") | +50–80 APEX | Rotates daily |
| Seasonal battle pass reward | Up to 5,000 APEX | Per season |
| Tournament placement (V2) | 500–5,000 APEX | Prize pool supplement |

**Spending APEX (sinks — tokens leaving circulation):**

| Item | APEX Cost | Notes |
|---|---|---|
| Extra ammo pack (15 shots) | 60 APEX | Per match |
| Premium weapon unlock (one-time) | 200–600 APEX | Permanent on account |
| Cosmetic rental (7 days) | 120 APEX | For non-NFT holders |
| Map slot (unlock 3rd map, V2) | 300 APEX | Permanent |
| Battle pass (V2) | 800 APEX | Or 4 SOL equivalent |
| Ranked entry fee | 50 APEX | Pooled into prize pot |

**Why this works:** Sinks are designed to roughly absorb the same APEX volume as faucets produce. The ranked entry fee is a direct sink-to-prize-pool mechanic — not the house taking a cut, but the community funding its own rewards.

---

### 5.3 NFT Monetization

#### Primary Sales (Mint Revenue)

```
Genesis Soldiers:  3,000 × 0.5 SOL  = 1,500 SOL primary mint
Weapon Skins:     10,000 × 0.1 SOL  = 1,000 SOL primary mint
Pets (V2):         5,000 × 0.2 SOL  = 1,000 SOL primary mint
Clothing (V2):     8,000 × 0.15 SOL = 1,200 SOL primary mint
──────────────────────────────────────────────────
Total (all phases): ~4,700 SOL primary revenue potential
```

#### Secondary Sales (Royalties)

All APEX NUKE NFT collections enforce **5% creator royalty** via Metaplex Programmable NFTs (pNFTs), applied on every secondary sale on Magic Eden and other Solana marketplaces.

At 100 SOL/day secondary volume → 5 SOL/day passive royalty income.

#### NFT Utility in Gameplay

NFTs are **not pay-to-win** — they provide:
- Class special ability unlock (meaningful but not decisive — skill matters more)
- Cosmetic differentiation (skins, animations, emblems)
- Minor XP bonus (5–10%) — faster progression, not stronger shots
- Exclusive pet companion (cosmetic only)
- Access to NFT-holder-only seasonal tournaments

---

### 5.4 Battle Vault — Prize Pool System (V2)

> This feature is deferred to V2 because it requires a custom Solana program (Anchor/Rust) that must be **security audited** before real SOL flows through it. Skipping the audit on a prize-holding contract is how projects get drained.

**How it works:**

```
Player A deposits 0.05 SOL entry fee →
Player B deposits 0.05 SOL entry fee →
Smart contract holds 0.10 SOL in escrow →
Match resolves on-chain (signed result from server) →
Winner receives 0.09 SOL (90%), 0.01 SOL to treasury (10%)
```

**Fee breakdown:**
- 90% to winner
- 8% to APEX NUKE treasury
- 2% to seasonal prize pool fund

**Anti-manipulation safeguards:**
- Match result is signed by the Supabase edge function (trusted oracle)
- Both players must have NFT characters to enter vaulted matches (skin-in-the-game)
- Smart contract enforces timeout — if no result submitted within 45 minutes, both players are refunded

---

### 5.5 Battle Pass (V2)

Seasonal battle pass (30-day seasons):

| Tier | Price | Rewards |
|---|---|---|
| Free Track | 0 | Basic cosmetic frames, 500 APEX |
| Combat Pass | 4 SOL or 800 APEX | Exclusive soldier skin, weapon skin NFT, 3,000 APEX, emblem |
| Elite Pass | 8 SOL | All Combat Pass rewards + guaranteed Rare NFT drop + early access to next season |

---

### 5.6 Revenue Summary

| Stream | V1 Launch | V2 (3 months) | Mature |
|---|---|---|---|
| NFT primary sales | 1,500 SOL | +2,200 SOL | — |
| NFT royalties (5%) | Low | Growing | Significant passive |
| Battle vault (10% fee) | — | Active | Primary stream |
| Battle pass | — | 4–8 SOL × users | Recurring seasonal |
| Direct APEX purchases | Minimal | Growing | Secondary |

---

## 6. Solana Architecture

### 6.1 Why Solana

| Requirement | Solana | Ethereum | Why Solana wins |
|---|---|---|---|
| Transaction speed | 400ms | 12–15s | In-game actions feel instant |
| Transaction fee | ~$0.00025 | $1–50+ | APEX token micro-transactions viable |
| NFT ecosystem | Metaplex, Magic Eden | OpenSea | Deep gaming NFT tooling |
| Web3 gaming | Burner wallet UX | Poor mobile UX | Phantom is the best gaming wallet |

### 6.2 On-Chain vs Off-Chain Boundary

```
ON-CHAIN (Solana)                    OFF-CHAIN (Supabase)
─────────────────────────────────    ────────────────────────────────────
NFT ownership (who owns what)        Game state during a match
APEX token balances                  Turn history + replay data
Battle vault escrow (V2)             Matchmaking queue
NFT metadata (traits, rarity)        Leaderboard + ranked ELO
Royalty enforcement (pNFT)           Player profiles + stats
                                     Anti-cheat validation
```

**Key principle:** Blockchain touches only asset ownership and value transfer. Real-time game logic runs fast off-chain on Supabase. This prevents the "every action = wallet pop-up" UX nightmare.

### 6.3 APEX Token Spec

```
Token standard:     SPL Fungible (Token-2022)
Symbol:             APEX
Decimals:           6
Max supply:         1,000,000,000 (1 billion APEX)
Mint authority:     Multisig (3/5) — held by founding team
Freeze authority:   Disabled at launch (cannot freeze player wallets)
```

### 6.4 NFT Standard

```
Standard:           Metaplex Core (replacing deprecated Token Metadata)
Royalty model:      pNFT (Programmable NFT) — enforced 5% royalty
Metadata storage:   Arweave (permanent, decentralised)
Image storage:      Arweave
Collection:         Verified Metaplex Collection
```

### 6.5 Wallet Integration

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
| Game Engine | Phaser 3 | 3.60 | 2D physics, rendering, input |
| Frontend | React + Vite | 18 / 5 | UI dashboard, shop, lobby |
| Styling | Tailwind CSS | 3 | Utility-first styling |
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
│  └─────────────────┘ └────────────┘         │           │
└──────────────────────────────────────────────┼──────────┘
                                               │
┌──────────────────────────────────────────────┼──────────┐
│  BLOCKCHAIN LAYER (Solana)                   │           │
│  ┌───────────────┐ ┌──────────────┐ ┌───────▼────────┐ │
│  │ Battle Vault  │ │ Metaplex NFT │ │  APEX SPL Token│ │
│  │ (escrow V2)   │ │ Collections  │ │  (balances)    │ │
│  └───────────────┘ └──────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Database Schema

### Core Tables

```sql
-- Players
CREATE TABLE players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet       TEXT UNIQUE,               -- Solana wallet pubkey
  username     TEXT UNIQUE NOT NULL,
  email        TEXT,                      -- optional, for non-Web3 users
  level        INT DEFAULT 1,
  xp           INT DEFAULT 0,
  apex_balance BIGINT DEFAULT 0,          -- mirrored from chain, updated on sync
  wins         INT DEFAULT 0,
  losses       INT DEFAULT 0,
  elo          INT DEFAULT 1000,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_one   UUID REFERENCES players(id),
  player_two   UUID REFERENCES players(id),
  winner       UUID REFERENCES players(id),
  map          TEXT NOT NULL,
  turns        INT DEFAULT 0,
  apex_wagered BIGINT DEFAULT 0,
  sol_wagered  NUMERIC(12,6) DEFAULT 0,
  status       TEXT DEFAULT 'active',    -- active | complete | abandoned
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  ended_at     TIMESTAMPTZ
);

-- Match turns (full replay data)
CREATE TABLE match_turns (
  id         BIGSERIAL PRIMARY KEY,
  match_id   UUID REFERENCES matches(id),
  turn_num   INT NOT NULL,
  player_id  UUID REFERENCES players(id),
  weapon     TEXT NOT NULL,
  angle      FLOAT NOT NULL,
  power      FLOAT NOT NULL,
  wind       FLOAT NOT NULL,
  hit        BOOLEAN DEFAULT FALSE,
  damage     INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT inventory (off-chain mirror of on-chain ownership)
CREATE TABLE nft_inventory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID REFERENCES players(id),
  mint_address TEXT NOT NULL,            -- Solana NFT mint pubkey
  nft_type     TEXT NOT NULL,            -- character | weapon_skin | pet | clothing
  metadata     JSONB,                    -- cached Metaplex metadata
  equipped     BOOLEAN DEFAULT FALSE,
  synced_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard (materialised view, refreshed every 5 min)
CREATE MATERIALIZED VIEW leaderboard AS
  SELECT id, username, elo, wins, losses,
         ROUND(wins::NUMERIC / NULLIF(wins+losses,0) * 100, 1) AS winrate
  FROM players
  ORDER BY elo DESC;
```

---

## 10. Roadmap

### Stage 1 — Core Game Engine (Weeks 1–3) ✅ COMPLETE (Prototype)
- [x] Phaser 3 battlefield
- [x] Projectile physics (gravity + wind)
- [x] Terrain deformation on explosion
- [x] Turn-based input system (aim → charge → fire)
- [x] HP system with damage falloff
- [x] Cartoon military soldier rendering
- [ ] Second map (Jungle Stronghold)
- [ ] All 10 weapons implemented
- [ ] Character class system (Assault / Heavy / Recon)

### Stage 2 — Multiplayer (Weeks 4–5)
- [ ] Supabase project setup + schema migration
- [ ] Supabase Realtime turn synchronisation
- [ ] Player authentication (email + wallet SIWS)
- [ ] Lobby + matchmaking queue
- [ ] Win/loss recording
- [ ] Basic leaderboard

### Stage 3 — Full Weapon Roster + Maps (Weeks 6–7)
- [ ] All 10 weapons with unique mechanics
- [ ] Both V1 maps (Desert, Jungle)
- [ ] Wind system visual indicator
- [ ] Character abilities per class
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

### V2 (Post-Launch)
- [ ] Battle vault escrow program (Anchor/Rust) + security audit
- [ ] SOL prize pool matches
- [ ] Ranked seasons with ELO brackets
- [ ] Pet NFT collection
- [ ] Clothing NFT sets
- [ ] Battle pass
- [ ] Tournament system
- [ ] 2v2 team mode

### V3 (Scale)
- [ ] Mobile app (React Native + Phaser)
- [ ] Clan system
- [ ] Custom map builder
- [ ] Spectator mode
- [ ] API for community tooling

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

### Emission Schedule (Play-to-Earn Pool)

Rewards halve every 12 months to control inflation:

| Year | APEX/day emitted | Cumulative |
|---|---|---|
| Year 1 | ~547,945 | ~200M |
| Year 2 | ~273,972 | ~300M |
| Year 3 | ~136,986 | ~350M |
| Year 4 | ~68,493  | ~375M |

### Token Velocity Controls

To prevent players immediately dumping earned APEX:
- **Weekly withdrawal limit:** 5,000 APEX per wallet (prevents bot farming)
- **Earned APEX cooldown:** 24-hour hold before withdrawal to exchange
- **NFT holder multiplier:** Holding a Genesis Soldier NFT removes withdrawal limits
- **Spending incentives:** APEX used in-game has no cooldown — spending is always better than dumping

---

## 12. Anti-Cheat & Fairness

### Off-Chain Validation

All match actions are validated server-side before being recorded:

```typescript
// Every turn is validated against server-computed physics
function validateTurn(turn: MatchTurn): ValidationResult {
  const serverResult = simulateProjectile({
    angle:  turn.angle,
    power:  turn.power,
    wind:   turn.wind,   // server-authoritative wind, not client
    origin: turn.origin
  });
  // Client result must match server result within 2px tolerance
  return Math.abs(serverResult.landX - turn.clientLandX) < 2;
}
```

### Fairness Rules
- Wind values are **server-generated and signed** — client cannot spoof wind
- Turn timer: 45 seconds per turn (server-enforced) — AFK protection
- Match abandon: if a player disconnects for >90 seconds, opponent wins
- APEX rewards only paid on server-confirmed match completion
- Anti-sybil: one ranked account per wallet; duplicate detection via playfab-style fingerprinting

---

## 13. Go-to-Market

### Target Audience

| Segment | Profile | Hook |
|---|---|---|
| Web3 gaming degens | Already on Solana, looking for games | NFT ownership + prize pools |
| Wild Ones / Worms nostalgia | Grew up with browser games, now 25–35 | "Remember Wild Ones? Now you own it." |
| Competitive casual gamers | Play daily, want ranked progression | ELO ladder + seasonal rewards |
| NFT collectors | Magic Eden regulars | Genesis Soldier collection scarcity |

### Launch Sequence

```
Month -2:  Announce on X/Twitter — teaser trailer + waitlist
Month -1:  Genesis Soldier whitelist mint (WL for early testers)
Week -2:   Beta — open access, Devnet only, collect feedback
Week -1:   Fix critical bugs, Mainnet APEX token deploy
Day 0:     Public launch — Mainnet, Genesis Soldier public mint
Week +2:   First ranked season starts
Month +2:  V2 battle vault audit complete → prize pools live
```

### Marketing Channels
- **X/Twitter:** Long-form threads about APEX economy mechanics, weapon showcases, match highlights
- **Discord:** Community hub, daily quests announced, leaderboard updates
- **YouTube Shorts / TikTok:** 30-second match highlight clips — the explosions are the content
- **Magic Eden:** Collection page with lore, trait rarity, floor price history
- **Solana ecosystem:** Submit to Solana Foundation gaming grants, Superteam Indonesia network

---

## Contributing

This is a closed-source project during active development. Public contributions will open after the V1 launch.

To report bugs or suggest features, open an issue in this repository.

---

## License

Proprietary. All rights reserved. © 2025 APEX NUKE / Findocere Ops.

---

*Built on Solana. Forged in battle.*
