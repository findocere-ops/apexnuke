export const ANIMAL_DEFS = {
  wolf: {
    name: 'Wolf',
    className: 'Predator',
    emoji: '\uD83D\uDC3A',
    color: '#3B82F6',
    hp: 90,
    speed: 250,
    jumpForce: 520,
    bodyWidth: 40,
    bodyHeight: 36,
    weapons: [
      {
        id: 'fang_shot',
        name: 'Fang Shot',
        damage: 30,
        blastRadius: 28,
        projectileSpeed: 700,
        projectileWeight: 0.6, // light — more affected by wind
        bounces: 0,
        ricochet: false,
        description: 'Fast, light projectile. Wind pushes it around.',
      },
      {
        id: 'boulder_hurl',
        name: 'Boulder Hurl',
        damage: 55,
        blastRadius: 50,
        projectileSpeed: 450,
        projectileWeight: 1.4, // heavy — cuts through wind
        bounces: 0,
        ricochet: false,
        description: 'Heavy arcing shot. Devastating on direct hit.',
      },
    ],
    ability: {
      id: 'pack_howl',
      name: 'Pack Howl',
      description: '+25% damage on your next shot',
      duration: 1, // lasts 1 combat phase
      damageMultiplier: 1.25,
      cooldown: 3, // rounds
    },
  },

  rhino: {
    name: 'Rhino',
    className: 'Tank',
    emoji: '\uD83E\uDD8F',
    color: '#EF4444',
    hp: 130,
    speed: 160,
    jumpForce: 380,
    bodyWidth: 48,
    bodyHeight: 40,
    weapons: [
      {
        id: 'horn_spike',
        name: 'Horn Spike',
        damage: 35,
        blastRadius: 32,
        projectileSpeed: 620,
        projectileWeight: 0.9,
        bounces: 1,
        ricochet: true,
        description: 'Bounces off terrain once. Tricky angles.',
      },
      {
        id: 'rock_throw',
        name: 'Rock Throw',
        damage: 50,
        blastRadius: 58,
        projectileSpeed: 400,
        projectileWeight: 1.6, // very heavy
        bounces: 0,
        ricochet: false,
        description: 'Massive splash radius. Area denial.',
      },
    ],
    ability: {
      id: 'thick_hide',
      name: 'Thick Hide',
      description: 'Block 40% damage for 1 turn',
      duration: 1,
      damageReduction: 0.4,
      cooldown: 3,
    },
  },
}
