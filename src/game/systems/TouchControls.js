/**
 * Mobile touch controls system.
 * Provides virtual joystick, touch aiming, and on-screen action buttons.
 * Renders directly onto a Phaser Graphics layer.
 *
 * Layout (landscape orientation):
 * ┌──────────────────────────────────────────┐
 * │                                          │
 * │  [Joystick]              [Aim & Fire]    │
 * │   (left)                  (right side)   │
 * │                                          │
 * │  [JUMP]    [W1] [W2] [ABL]              │
 * └──────────────────────────────────────────┘
 */

const JOYSTICK_RADIUS = 50
const JOYSTICK_KNOB_RADIUS = 22
const BUTTON_SIZE = 44
const BUTTON_GAP = 10
const DEAD_ZONE = 8

export function createTouchControls(scene) {
  const isTouchDevice = !!(
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  )

  const state = {
    enabled: isTouchDevice,
    // Joystick
    joystick: {
      active: false,
      touchId: null,
      baseX: 0,
      baseY: 0,
      knobX: 0,
      knobY: 0,
      dx: 0, // -1 to 1
      dy: 0, // -1 to 1
    },
    // Aim
    aim: {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      angle: 0,
      charging: false,
      power: 0,
      powerDir: 1,
    },
    // Buttons
    buttons: {
      jump: { pressed: false, x: 0, y: 0 },
      weapon1: { pressed: false, x: 0, y: 0 },
      weapon2: { pressed: false, x: 0, y: 0 },
      ability: { pressed: false, x: 0, y: 0 },
    },
    // Track which buttons were just pressed this frame
    justPressed: {
      jump: false,
      weapon1: false,
      weapon2: false,
      ability: false,
    },
  }

  if (!state.enabled) return state

  // Position buttons based on screen size
  updateButtonPositions(state, scene)

  // Listen for resize
  scene.scale.on('resize', () => {
    updateButtonPositions(state, scene)
  })

  // Touch event handlers
  scene.input.on('pointerdown', (pointer) => {
    handleTouchStart(state, pointer, scene)
  })

  scene.input.on('pointermove', (pointer) => {
    handleTouchMove(state, pointer, scene)
  })

  scene.input.on('pointerup', (pointer) => {
    handleTouchEnd(state, pointer, scene)
  })

  return state
}

function updateButtonPositions(state, scene) {
  const w = scene.scale.width
  const h = scene.scale.height
  const margin = 20
  const bottomY = h - margin - BUTTON_SIZE / 2

  // Joystick base position (bottom-left)
  state.joystick.baseX = margin + JOYSTICK_RADIUS + 10
  state.joystick.baseY = h - margin - JOYSTICK_RADIUS - 10
  state.joystick.knobX = state.joystick.baseX
  state.joystick.knobY = state.joystick.baseY

  // Jump button (above joystick area, right side of it)
  state.buttons.jump.x = state.joystick.baseX + JOYSTICK_RADIUS + 30
  state.buttons.jump.y = bottomY - BUTTON_SIZE - BUTTON_GAP

  // Weapon/ability buttons (bottom-right cluster)
  const clusterStartX = w - margin - (BUTTON_SIZE * 3 + BUTTON_GAP * 2)
  state.buttons.weapon1.x = clusterStartX + BUTTON_SIZE / 2
  state.buttons.weapon1.y = bottomY

  state.buttons.weapon2.x = clusterStartX + BUTTON_SIZE + BUTTON_GAP + BUTTON_SIZE / 2
  state.buttons.weapon2.y = bottomY

  state.buttons.ability.x = clusterStartX + (BUTTON_SIZE + BUTTON_GAP) * 2 + BUTTON_SIZE / 2
  state.buttons.ability.y = bottomY
}

function handleTouchStart(state, pointer, scene) {
  const x = pointer.x
  const y = pointer.y
  const id = pointer.id

  // Reset justPressed
  state.justPressed.jump = false
  state.justPressed.weapon1 = false
  state.justPressed.weapon2 = false
  state.justPressed.ability = false

  // Check buttons first
  for (const [name, btn] of Object.entries(state.buttons)) {
    if (isInButton(x, y, btn.x, btn.y)) {
      btn.pressed = true
      state.justPressed[name] = true
      return
    }
  }

  // Left third of screen = joystick
  if (x < scene.scale.width * 0.35) {
    state.joystick.active = true
    state.joystick.touchId = id
    state.joystick.knobX = x
    state.joystick.knobY = y
    updateJoystickDeltas(state)
    return
  }

  // Right side = aim start
  state.aim.active = true
  state.aim.touchId = id
  state.aim.startX = x
  state.aim.startY = y
  state.aim.currentX = x
  state.aim.currentY = y
  state.aim.charging = true
  state.aim.power = 0
  state.aim.powerDir = 1
}

function handleTouchMove(state, pointer, scene) {
  const x = pointer.x
  const y = pointer.y
  const id = pointer.id

  // Joystick drag
  if (state.joystick.active && state.joystick.touchId === id) {
    const dx = x - state.joystick.baseX
    const dy = y - state.joystick.baseY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > JOYSTICK_RADIUS) {
      state.joystick.knobX = state.joystick.baseX + (dx / dist) * JOYSTICK_RADIUS
      state.joystick.knobY = state.joystick.baseY + (dy / dist) * JOYSTICK_RADIUS
    } else {
      state.joystick.knobX = x
      state.joystick.knobY = y
    }
    updateJoystickDeltas(state)
    return
  }

  // Aim drag
  if (state.aim.active && state.aim.touchId === id) {
    state.aim.currentX = x
    state.aim.currentY = y
  }
}

function handleTouchEnd(state, pointer, scene) {
  const id = pointer.id

  // Joystick release
  if (state.joystick.active && state.joystick.touchId === id) {
    state.joystick.active = false
    state.joystick.touchId = null
    state.joystick.knobX = state.joystick.baseX
    state.joystick.knobY = state.joystick.baseY
    state.joystick.dx = 0
    state.joystick.dy = 0
    return
  }

  // Aim release = fire
  if (state.aim.active && state.aim.touchId === id) {
    state.aim.active = false
    state.aim.touchId = null
    state.aim.charging = false
    // The BattleScene reads aim.fired = true on next frame
    state.aim.fired = true
    return
  }

  // Button release
  for (const btn of Object.values(state.buttons)) {
    btn.pressed = false
  }
}

function updateJoystickDeltas(state) {
  const dx = state.joystick.knobX - state.joystick.baseX
  const dy = state.joystick.knobY - state.joystick.baseY
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < DEAD_ZONE) {
    state.joystick.dx = 0
    state.joystick.dy = 0
  } else {
    state.joystick.dx = dx / JOYSTICK_RADIUS
    state.joystick.dy = dy / JOYSTICK_RADIUS
  }
}

function isInButton(tx, ty, bx, by) {
  const dx = tx - bx
  const dy = ty - by
  return Math.sqrt(dx * dx + dy * dy) < BUTTON_SIZE
}

/**
 * Update power charging (call every frame during combat).
 */
export function updateTouchAim(state, dt) {
  if (!state.enabled || !state.aim.charging) return

  state.aim.power += state.aim.powerDir * 80 * dt
  if (state.aim.power >= 100) {
    state.aim.power = 100
    state.aim.powerDir = -1
  } else if (state.aim.power <= 0) {
    state.aim.power = 0
    state.aim.powerDir = 1
  }
}

/**
 * Get the aim angle from touch drag relative to a player's position on screen.
 */
export function getTouchAimAngle(state, playerScreenX, playerScreenY) {
  if (!state.aim.active && !state.aim.fired) return null

  const dx = state.aim.currentX - playerScreenX
  const dy = state.aim.currentY - playerScreenY
  return Math.atan2(dy, dx)
}

/**
 * Consume the "fired" flag (call after reading it).
 */
export function consumeTouchFire(state) {
  if (state.aim.fired) {
    state.aim.fired = false
    return true
  }
  return false
}

/**
 * Read joystick as movement input.
 */
export function getJoystickMovement(state) {
  if (!state.enabled || !state.joystick.active) {
    return { left: false, right: false, jump: false }
  }
  return {
    left: state.joystick.dx < -0.3,
    right: state.joystick.dx > 0.3,
    jump: state.joystick.dy < -0.5, // push up = jump
  }
}

/**
 * Draw touch controls overlay.
 * Call this on a Phaser Graphics object set to setScrollFactor(0).
 */
export function drawTouchControls(graphics, state, phase, activeWeapon, abilityCooldown) {
  if (!state.enabled) return

  const alpha = 0.35

  // ── Joystick ──
  // Base circle
  graphics.lineStyle(2, 0xffffff, alpha * 0.6)
  graphics.strokeCircle(state.joystick.baseX, state.joystick.baseY, JOYSTICK_RADIUS)

  // Knob
  const knobAlpha = state.joystick.active ? alpha + 0.2 : alpha
  graphics.fillStyle(0xffffff, knobAlpha)
  graphics.fillCircle(state.joystick.knobX, state.joystick.knobY, JOYSTICK_KNOB_RADIUS)

  // ── Jump button ──
  drawButton(graphics, state.buttons.jump, 'JMP', state.buttons.jump.pressed, 0x4ade80, alpha)

  // ── Weapon/Ability buttons (only in combat phase) ──
  if (phase === 'combat' || phase === 'projectile_flying') {
    const w1Color = activeWeapon === 0 ? 0xfbbf24 : 0xffffff
    const w2Color = activeWeapon === 1 ? 0xfbbf24 : 0xffffff
    const ablColor = abilityCooldown > 0 ? 0x666666 : 0x38bdf8

    drawButton(graphics, state.buttons.weapon1, 'W1', state.buttons.weapon1.pressed, w1Color, alpha)
    drawButton(graphics, state.buttons.weapon2, 'W2', state.buttons.weapon2.pressed, w2Color, alpha)
    drawButton(graphics, state.buttons.ability, 'ABL', state.buttons.ability.pressed, ablColor, alpha)
  }

  // ── Aim line (when dragging on right side) ──
  if (state.aim.active) {
    graphics.lineStyle(2, 0xffffff, 0.5)
    graphics.beginPath()
    graphics.moveTo(state.aim.startX, state.aim.startY)
    graphics.lineTo(state.aim.currentX, state.aim.currentY)
    graphics.strokePath()

    // Power bar near thumb
    if (state.aim.charging && state.aim.power > 0) {
      const barX = state.aim.currentX - 25
      const barY = state.aim.currentY - 30
      graphics.fillStyle(0x000000, 0.6)
      graphics.fillRect(barX - 1, barY - 1, 52, 10)
      const pColor = state.aim.power < 50 ? 0x4ade80 : state.aim.power < 80 ? 0xfbbf24 : 0xef4444
      graphics.fillStyle(pColor, 0.9)
      graphics.fillRect(barX, barY, state.aim.power / 2, 8)
    }
  }
}

function drawButton(graphics, btn, label, pressed, color, alpha) {
  const fill = pressed ? 0.4 : 0.15
  graphics.fillStyle(color, fill)
  graphics.fillCircle(btn.x, btn.y, BUTTON_SIZE / 2)
  graphics.lineStyle(2, color, alpha + (pressed ? 0.2 : 0))
  graphics.strokeCircle(btn.x, btn.y, BUTTON_SIZE / 2)

  // We can't draw text on Graphics, but the BattleScene will add text labels
}
