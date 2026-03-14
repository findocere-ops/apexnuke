/**
 * Central game state manager.
 * Tracks turns, phases, wind, abilities, and status effects.
 */

export const PHASE = {
  MOVE: 'move',
  COMBAT: 'combat',
  PROJECTILE_FLYING: 'projectile_flying',
  EXPLOSION: 'explosion',
  ROUND_TRANSITION: 'round_transition',
  GAME_OVER: 'game_over',
}

export function createGameState() {
  return {
    phase: PHASE.MOVE,
    round: 1,
    activePlayer: 1, // 1 or 2 (during combat phase, who's shooting)
    movePhaseTimer: 15, // seconds remaining in move phase
    turnTimer: 30, // seconds for aiming during combat
    combatShotsThisRound: 0, // how many shots fired this round (2 = both players shot)

    wind: generateWind(),
    nextWind: generateWind(),

    players: {
      1: {
        hp: 0,
        maxHp: 0,
        selectedWeapon: 0, // index into weapons array
        abilityCooldown: 0,
        abilityActive: false,
        statusEffects: [], // { type, turnsRemaining, value }
        facingRight: true,
      },
      2: {
        hp: 0,
        maxHp: 0,
        selectedWeapon: 0,
        abilityCooldown: 0,
        abilityActive: false,
        statusEffects: [],
        facingRight: false,
      },
    },
  }
}

export function generateWind() {
  // Wind in px/s², range -150 to +150
  return Math.round((Math.random() - 0.5) * 300)
}

export function getWindLabel(wind) {
  const strength = Math.abs(wind)
  const dir = wind > 0 ? 'Right' : wind < 0 ? 'Left' : ''
  if (strength < 30) return 'Calm'
  if (strength < 80) return `Light ${dir}`
  if (strength < 140) return `Strong ${dir}`
  return `Gale ${dir}`
}

export function getWindArrow(wind) {
  if (Math.abs(wind) < 30) return '\u2022'
  const count = Math.abs(wind) < 80 ? 1 : Math.abs(wind) < 140 ? 2 : 3
  const arrow = wind > 0 ? '\u25B6' : '\u25C0'
  return arrow.repeat(count)
}
