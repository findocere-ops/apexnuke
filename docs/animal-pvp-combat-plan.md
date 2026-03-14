# APEX NUKE - Animal PVP Combat System
## CTO Recommendation Plan

**Author:** CTO Office, Apex Nuke
**Date:** 2026-03-14
**Status:** Proposal
**Target Release:** V2 / V2.5

---

## 1. Executive Summary

This plan introduces **Animal Characters** as a new playable entity class in Apex Nuke, enabling animal-vs-animal and animal-vs-soldier PVP combat. Animals are not a cosmetic skin -- they are a distinct combat system with unique mechanics, abilities, and progression that expands the game's strategic depth and NFT economy.

The implementation is designed to layer on top of the existing Phaser 3 + Supabase + Solana architecture with zero disruption to current soldier-based PVP.

---

## 2. Why Animal PVP

| Driver | Impact |
|--------|--------|
| **Player retention** | New combat styles prevent meta staleness; animals play fundamentally differently than soldiers |
| **NFT revenue stream** | New Genesis Animals collection (separate from Genesis Soldiers) opens a fresh mint event |
| **Competitive diversity** | Mixed-class matchups (Animal vs Soldier) create asymmetric but balanced gameplay |
| **Community engagement** | Animal factions drive social identity, team loyalty, and clan formation |
| **Market differentiation** | No competing Solana game combines artillery combat with creature-based PVP |

---

## 3. Animal Character Design

### 3.1 Animal Classes (5 Classes at Launch)

| Class | Animal | HP | Speed | Special Ability | Rarity |
|-------|--------|-----|-------|-----------------|--------|
| **Predator** | Wolf | 95 | Fast | **Pack Howl** -- next attack deals +20% damage | Common |
| **Tank** | Rhino | 140 | Slow | **Thick Hide** -- reduces incoming damage by 15% for 2 turns | Uncommon |
| **Scout** | Eagle | 75 | Very Fast | **Aerial View** -- reveals full trajectory + enemy HP for 1 turn | Rare |
| **Saboteur** | Snake | 80 | Medium | **Venom Bite** -- applies 8 damage/turn poison for 3 turns | Uncommon |
| **Siege** | Elephant | 150 | Very Slow | **Tremor Stomp** -- deforms terrain in a wide radius without dealing direct damage | Rare |

### 3.2 Animal-Specific Weapons (6 New Weapons)

Animals do NOT use human weapons. They have their own attack set:

| Name | Type | Unlock | Damage | Mechanic |
|------|------|--------|--------|----------|
| **Claw Slash** | Melee | Default | 40 | Close-range arc attack, no projectile physics |
| **Fang Throw** | Projectile | Default | 50 | Standard arc, equivalent to grenade |
| **Sonic Roar** | Wave | Level 5 | 35 | Horizontal wave that pushes enemies + deals damage |
| **Burrow Charge** | Underground | Level 10 | 65 | Tunnels through terrain, erupts under target |
| **Stampede** | AOE | Level 15 | 45x3 | Three impact zones in a horizontal line |
| **Primal Fury** | Ultimate | Level 20 | 120 | Class-specific ultimate (e.g., Wolf summons pack, Rhino charges across map) |

### 3.3 NFT Metadata Structure

```json
{
  "name": "APEX Animal #0101",
  "symbol": "APEX",
  "attributes": [
    { "trait_type": "Entity", "value": "Animal" },
    { "trait_type": "Species", "value": "Wolf" },
    { "trait_type": "Class", "value": "Predator" },
    { "trait_type": "Rarity", "value": "Common" },
    { "trait_type": "Fur Pattern", "value": "Arctic White" },
    { "trait_type": "War Paint", "value": "Blood Streak" },
    { "trait_type": "Accessory", "value": "Spiked Collar" },
    { "trait_type": "Battle Scar", "value": "Left Eye" },
    { "trait_type": "XP Bonus", "value": "3%" }
  ]
}
```

---

## 4. PVP Combat Modes

### 4.1 New Match Types

| Mode | Format | Description |
|------|--------|-------------|
| **Animal Duel** | 1v1 Animal vs Animal | Pure animal combat, animal weapons only |
| **Cross-Species War** | 1v1 Animal vs Soldier | Asymmetric matchup, balanced via handicap system |
| **Pack Battle** | 2v2 Animals | Team-based animal combat (V2.5) |
| **Apex Arena** | 1v1v1v1 FFA | Four players, mixed entity types, last standing wins (V2.5) |

### 4.2 Balance Framework for Cross-Species Matches

Animal vs Soldier balance is the highest-risk design challenge. The approach:

```
                  SOLDIER ADVANTAGES          ANIMAL ADVANTAGES
                  ──────────────────          ─────────────────
                  - Ranged weapon variety     - Higher base HP (on average)
                  - Trajectory preview        - Special abilities (stronger)
                  - Proven meta strategies    - Terrain traversal (burrow, fly)
                  - Weapon shop economy       - Passive effects (poison, armor)
```

**Balancing levers (server-tunable, no client deploy needed):**
- Per-class HP multiplier adjustments
- Damage scaling coefficients for cross-type matches
- Ability cooldown tuning
- Wind sensitivity per entity type (animals are heavier/lighter)

All balance parameters are stored in a `balance_config` table in Supabase, fetched at match start, enabling hot-fixes without deploys.

---

## 5. Technical Architecture

### 5.1 Database Schema Changes

```sql
-- New table: animal character definitions
CREATE TABLE animal_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species TEXT NOT NULL,          -- 'wolf', 'rhino', 'eagle', etc.
  class TEXT NOT NULL,            -- 'predator', 'tank', 'scout', etc.
  base_hp INTEGER NOT NULL,
  speed_modifier FLOAT DEFAULT 1.0,
  ability_name TEXT NOT NULL,
  ability_description TEXT,
  ability_cooldown INTEGER DEFAULT 3, -- turns
  rarity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New table: animal weapons
CREATE TABLE animal_weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  damage INTEGER NOT NULL,
  weapon_type TEXT NOT NULL,      -- 'melee', 'projectile', 'wave', 'underground', 'aoe', 'ultimate'
  unlock_level INTEGER DEFAULT 1,
  blast_radius INTEGER,
  special_effect JSONB,          -- poison ticks, knockback, terrain deform params
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Extend matches table
ALTER TABLE matches ADD COLUMN match_type TEXT DEFAULT 'soldier_duel';
-- Values: 'soldier_duel', 'animal_duel', 'cross_species', 'pack_battle', 'apex_arena'

ALTER TABLE matches ADD COLUMN entity_type_p1 TEXT DEFAULT 'soldier';
ALTER TABLE matches ADD COLUMN entity_type_p2 TEXT DEFAULT 'soldier';

-- Extend match_turns for animal actions
ALTER TABLE match_turns ADD COLUMN ability_used TEXT;
ALTER TABLE match_turns ADD COLUMN status_effects JSONB;
-- e.g., [{"type": "poison", "damage": 8, "remaining_turns": 2}]

-- Balance config (hot-tunable)
CREATE TABLE balance_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Animal-specific leaderboard view
CREATE MATERIALIZED VIEW animal_leaderboard AS
SELECT
  p.id, p.username, p.wallet_address,
  COUNT(*) FILTER (WHERE m.winner_id = p.id) AS animal_wins,
  COUNT(*) AS animal_matches,
  ROUND(100.0 * COUNT(*) FILTER (WHERE m.winner_id = p.id) / NULLIF(COUNT(*), 0), 1) AS win_rate
FROM players p
JOIN matches m ON (m.player_one = p.id OR m.player_two = p.id)
WHERE m.match_type IN ('animal_duel', 'cross_species')
GROUP BY p.id;
```

### 5.2 Phaser 3 Game Engine Changes

```
src/
├── entities/
│   ├── Soldier.js          (existing)
│   ├── Animal.js           (NEW - base animal entity class)
│   ├── animals/
│   │   ├── Wolf.js         (extends Animal)
│   │   ├── Rhino.js        (extends Animal)
│   │   ├── Eagle.js        (extends Animal)
│   │   ├── Snake.js        (extends Animal)
│   │   └── Elephant.js     (extends Animal)
│   └── EntityFactory.js    (NEW - factory pattern for soldier/animal creation)
├── combat/
│   ├── WeaponSystem.js     (existing - refactor to support animal weapons)
│   ├── AnimalAbilities.js  (NEW - special ability logic)
│   ├── StatusEffects.js    (NEW - poison, armor, buff management)
│   └── DamageCalculator.js (refactor - add cross-type damage scaling)
├── scenes/
│   ├── BattleScene.js      (refactor - entity-agnostic combat loop)
│   ├── AnimalSelectScene.js(NEW - animal character selection)
│   └── MatchmakingScene.js (refactor - add match type selection)
└── ui/
    ├── AnimalHUD.js         (NEW - ability cooldowns, status effects display)
    └── EntitySwitcher.js    (NEW - toggle soldier/animal in lobby)
```

**Key refactoring principle:** The `BattleScene` combat loop must become **entity-agnostic**. Instead of assuming a soldier, it operates on an `ICombatEntity` interface:

```javascript
// ICombatEntity interface (implemented by both Soldier and Animal)
{
  getHP()
  takeDamage(amount, type)
  getPosition()
  move(x, y)
  getAvailableWeapons()
  useAbility()          // no-op for soldiers in V1
  getStatusEffects()    // empty array for soldiers
  getSprite()
  getClass()
  getEntityType()       // 'soldier' | 'animal'
}
```

### 5.3 Solana Integration

| Component | Action |
|-----------|--------|
| **New NFT Collection** | "APEX Animals" collection via Metaplex Core, same pNFT + 5% royalty structure |
| **Mint Event** | 5,000 Genesis Animals at 0.3 SOL each |
| **Token Utility** | APEX token used for animal weapon unlocks and cosmetics (same economy) |
| **Battle Vault** | Extend existing escrow to support animal match wagers |
| **On-chain Metadata** | Species, class, rarity, cosmetic traits stored as Metaplex attributes |

### 5.4 Matchmaking Changes

```
Current Flow:
  Player -> Queue (ELO-based) -> Match (Soldier vs Soldier)

New Flow:
  Player -> Select Entity (Soldier OR Animal) -> Queue (ELO + Entity Type) -> Match

Queue Logic:
  - animal_duel queue:      Animals only
  - soldier_duel queue:     Soldiers only
  - cross_species queue:    Mixed (Animal vs Soldier)
  - ranked queue:           Any entity type (unified ELO with balance adjustments)
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- [ ] Refactor `BattleScene` to entity-agnostic `ICombatEntity` interface
- [ ] Create `Animal` base class and `EntityFactory`
- [ ] Implement Wolf and Rhino (2 animals to validate the system)
- [ ] Add `animal_classes` and `animal_weapons` DB tables
- [ ] Create `balance_config` table with initial values
- [ ] Implement `Claw Slash` and `Fang Throw` (2 default weapons)
- [ ] Unit tests for animal combat mechanics

### Phase 2: Combat Mechanics (Weeks 4-5)
- [ ] Implement `StatusEffects` system (poison, armor buff, etc.)
- [ ] Implement `AnimalAbilities` (Pack Howl, Thick Hide)
- [ ] Add `Sonic Roar` and `Burrow Charge` weapons
- [ ] Build `DamageCalculator` cross-type scaling
- [ ] Add `AnimalHUD` with ability cooldowns and status effect indicators
- [ ] Integration tests for Animal vs Animal combat

### Phase 3: Full Roster + Cross-Species (Weeks 6-7)
- [ ] Implement Eagle, Snake, Elephant classes
- [ ] Implement remaining abilities (Aerial View, Venom Bite, Tremor Stomp)
- [ ] Add `Stampede` and `Primal Fury` weapons
- [ ] Build cross-species matchmaking queue
- [ ] Balance tuning for Animal vs Soldier matches
- [ ] `AnimalSelectScene` UI

### Phase 4: NFT + Economy (Weeks 8-9)
- [ ] Create APEX Animals Metaplex collection
- [ ] Build mint page for Genesis Animals
- [ ] Integrate animal NFT ownership into `nft_inventory`
- [ ] Add animal cosmetics (fur patterns, war paint, accessories)
- [ ] Extend APEX token shop for animal weapons/cosmetics
- [ ] Update Battle Vault escrow for animal matches

### Phase 5: Polish + Launch (Weeks 10-12)
- [ ] Animal sprite animations (idle, attack, hit, death per species)
- [ ] Sound design for animal attacks and abilities
- [ ] `animal_leaderboard` materialized view
- [ ] Anti-cheat validation for animal abilities and status effects
- [ ] Closed beta with balance telemetry
- [ ] Balance hotfix iteration based on win-rate data
- [ ] Public launch of Animal PVP

---

## 7. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Cross-species balance** | HIGH | Server-side `balance_config` enables hotfixes without deploys; track win rates per matchup in real-time |
| **Scope creep** | MEDIUM | Phase 1-2 ship with only 2 animals; validate before building the full roster |
| **Sprite/art pipeline** | MEDIUM | Each animal needs 5+ animation states; commission art in parallel with Phase 1 engineering |
| **NFT market cannibalization** | LOW | Animals are a separate collection, complementary to soldiers, not a replacement |
| **Combat loop refactor breaks soldiers** | MEDIUM | `ICombatEntity` interface + comprehensive regression tests on soldier combat before any animal code ships |
| **Matchmaking fragmentation** | MEDIUM | Start with unified queue; only split if player population supports it |

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Animal match adoption | 30%+ of all matches include animals within 30 days | Supabase `matches` query |
| Cross-species match balance | 45-55% win rate for each side | `balance_config` telemetry |
| Genesis Animal mint sellout | 80%+ within 72 hours | On-chain mint tracking |
| Player retention (D7) | +15% improvement vs pre-animal baseline | PostHog cohort analysis |
| New unique wallets | +2,000 within first month | Supabase `players` table |
| APEX token velocity | +25% transaction volume increase | Solana explorer analytics |

---

## 9. Resource Requirements

| Role | Allocation | Duration |
|------|-----------|----------|
| Game Engineer (Phaser) | 1 FTE | 12 weeks |
| Backend Engineer (Supabase/SQL) | 0.5 FTE | 8 weeks |
| Solana/Web3 Engineer | 0.5 FTE | 4 weeks (Phase 4) |
| 2D Artist / Animator | 1 FTE | 10 weeks (parallel) |
| Game Designer / Balance | 0.5 FTE | 12 weeks |
| QA | 0.5 FTE | 6 weeks (Phase 3-5) |

**Estimated total cost:** ~$120K-160K (assuming market-rate contractors)

---

## 10. CTO Recommendation

**Ship it in phases. Start small, validate fast.**

1. **Phase 1-2 is the proof of concept.** Wolf + Rhino in Animal Duel mode. If the combat loop feels right and players engage, greenlight the full roster.
2. **The `ICombatEntity` refactor is the highest-priority engineering work.** It unblocks everything and de-risks the soldier regression.
3. **Do NOT launch cross-species PVP until balance data from animal-only matches is solid.** Asymmetric balance is hard -- earn it with data, not guesswork.
4. **The NFT mint (Phase 4) funds the remaining development.** Structure the timeline so Phase 4 revenue covers Phase 5 costs.
5. **Art is the critical path.** Start commissioning animal sprites on Day 1, even before engineering begins.

This feature transforms Apex Nuke from a single-entity artillery game into a **multi-faction competitive platform** -- and that's where long-term retention and revenue live.

---

*Prepared by the CTO Office, Apex Nuke*
*For internal review only*
