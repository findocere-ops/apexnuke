import Phaser from 'phaser'
import { ANIMAL_DEFS } from '../entities/AnimalDefs'
import {
  generateTerrain,
  getTerrainY,
  isInWater,
  deformTerrain,
  drawTerrain,
  drawPlatforms,
} from '../physics/TerrainGenerator'
import {
  createProjectile,
  stepProjectile,
  createFragments,
  stepFragments,
  calculateExplosionDamage,
  calculateKnockback,
  previewTrajectory,
} from '../physics/ProjectilePhysics'
import {
  createGameState,
  PHASE,
  generateWind,
  getWindLabel,
  getWindArrow,
} from '../systems/GameState'

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' })
  }

  init(data) {
    this.p1Animal = data.p1 || 'wolf'
    this.p2Animal = data.p2 || 'rhino'
    this.onGameOver = data.onGameOver || (() => {})
  }

  create() {
    // Generate terrain
    this.terrainData = generateTerrain()

    // Game state
    this.gs = createGameState()
    const p1Def = ANIMAL_DEFS[this.p1Animal]
    const p2Def = ANIMAL_DEFS[this.p2Animal]
    this.gs.players[1].hp = p1Def.hp
    this.gs.players[1].maxHp = p1Def.hp
    this.gs.players[2].hp = p2Def.hp
    this.gs.players[2].maxHp = p2Def.hp

    this.playerDefs = { 1: p1Def, 2: p2Def }

    // Graphics layers
    this.bgGraphics = this.add.graphics()
    this.terrainGraphics = this.add.graphics()
    this.entityGraphics = this.add.graphics()
    this.projectileGraphics = this.add.graphics()
    this.uiGraphics = this.add.graphics()

    // Draw background gradient
    this.drawBackground()

    // Draw initial terrain
    this.redrawTerrain()

    // Player positions & physics
    this.playerBodies = {
      1: {
        x: this.terrainData.spawnP1.x,
        y: this.terrainData.spawnP1.y,
        vx: 0,
        vy: 0,
        onGround: false,
        onPlatform: false,
      },
      2: {
        x: this.terrainData.spawnP2.x,
        y: this.terrainData.spawnP2.y,
        vx: 0,
        vy: 0,
        onGround: false,
        onPlatform: false,
      },
    }

    // Projectile state
    this.activeProjectile = null
    this.fragments = []

    // Aiming state
    this.isAiming = false
    this.aimAngle = 0
    this.aimPower = 50
    this.powerDirection = 1
    this.powerCharging = false

    // Input
    this.cursors = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      weapon1: Phaser.Input.Keyboard.KeyCodes.ONE,
      weapon2: Phaser.Input.Keyboard.KeyCodes.TWO,
      ability: Phaser.Input.Keyboard.KeyCodes.Q,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    })

    // Arrow keys for P2
    this.cursorsP2 = this.input.keyboard.createCursorKeys()
    this.p2Keys = this.input.keyboard.addKeys({
      weapon1: Phaser.Input.Keyboard.KeyCodes.NINE,
      weapon2: Phaser.Input.Keyboard.KeyCodes.ZERO,
      ability: Phaser.Input.Keyboard.KeyCodes.P,
    })

    // Mouse for aiming
    this.input.on('pointerdown', () => this.onPointerDown())
    this.input.on('pointerup', () => this.onPointerUp())

    // Explosion animation state
    this.explosions = [] // { x, y, radius, maxRadius, alpha }

    // Damage numbers
    this.damageNumbers = [] // { x, y, text, alpha, vy }

    // Phase timer
    this.phaseTimerEvent = null
    this.startMovePhase()

    // Camera
    this.cameras.main.setBounds(0, 0, this.terrainData.worldWidth, this.terrainData.worldHeight)
    this.cameras.main.setZoom(
      Math.min(
        this.scale.width / this.terrainData.worldWidth,
        this.scale.height / this.terrainData.worldHeight
      )
    )
  }

  // ─── PHASE MANAGEMENT ──────────────────────────────────────

  startMovePhase() {
    this.gs.phase = PHASE.MOVE
    this.gs.movePhaseTimer = 15

    if (this.phaseTimerEvent) this.phaseTimerEvent.destroy()

    this.phaseTimerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        this.gs.movePhaseTimer--
        if (this.gs.movePhaseTimer <= 0) {
          this.startCombatPhase()
        }
      },
    })
  }

  startCombatPhase() {
    this.gs.phase = PHASE.COMBAT
    this.gs.activePlayer = 1
    this.gs.combatShotsThisRound = 0
    this.gs.turnTimer = 30
    this.isAiming = false
    this.powerCharging = false

    if (this.phaseTimerEvent) this.phaseTimerEvent.destroy()

    this.phaseTimerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 29,
      callback: () => {
        this.gs.turnTimer--
        if (this.gs.turnTimer <= 0) {
          this.advanceCombatTurn()
        }
      },
    })
  }

  advanceCombatTurn() {
    this.gs.combatShotsThisRound++

    if (this.gs.combatShotsThisRound >= 2) {
      // Both players have shot, new round
      this.startNewRound()
    } else {
      // Switch to other player
      this.gs.activePlayer = this.gs.activePlayer === 1 ? 2 : 1
      this.gs.turnTimer = 30
      this.isAiming = false
      this.powerCharging = false

      if (this.phaseTimerEvent) this.phaseTimerEvent.destroy()
      this.phaseTimerEvent = this.time.addEvent({
        delay: 1000,
        repeat: 29,
        callback: () => {
          this.gs.turnTimer--
          if (this.gs.turnTimer <= 0) {
            this.advanceCombatTurn()
          }
        },
      })
    }
  }

  startNewRound() {
    this.gs.round++
    this.gs.wind = this.gs.nextWind
    this.gs.nextWind = generateWind()

    // Tick ability cooldowns
    for (const pid of [1, 2]) {
      const ps = this.gs.players[pid]
      if (ps.abilityCooldown > 0) ps.abilityCooldown--
      if (ps.abilityActive) ps.abilityActive = false

      // Tick status effects
      ps.statusEffects = ps.statusEffects
        .map((e) => ({ ...e, turnsRemaining: e.turnsRemaining - 1 }))
        .filter((e) => e.turnsRemaining > 0)
    }

    this.startMovePhase()
  }

  // ─── INPUT HANDLING ────────────────────────────────────────

  onPointerDown() {
    if (this.gs.phase === PHASE.COMBAT && !this.activeProjectile) {
      this.powerCharging = true
      this.aimPower = 0
      this.powerDirection = 1
    }
  }

  onPointerUp() {
    if (this.powerCharging && this.gs.phase === PHASE.COMBAT) {
      this.powerCharging = false
      this.fireProjectile()
    }
  }

  fireProjectile() {
    const pid = this.gs.activePlayer
    const body = this.playerBodies[pid]
    const def = this.playerDefs[pid]
    const ps = this.gs.players[pid]
    const weapon = def.weapons[ps.selectedWeapon]

    const proj = createProjectile(
      body.x,
      body.y - def.bodyHeight / 2,
      this.aimAngle,
      this.aimPower,
      weapon,
      this.gs.wind
    )

    // Apply ability damage multiplier
    if (ps.abilityActive && def.ability.damageMultiplier) {
      proj.damage = Math.round(proj.damage * def.ability.damageMultiplier)
    }

    this.activeProjectile = proj
    this.gs.phase = PHASE.PROJECTILE_FLYING

    if (this.phaseTimerEvent) this.phaseTimerEvent.destroy()
  }

  useAbility(playerNum) {
    const ps = this.gs.players[playerNum]
    const def = this.playerDefs[playerNum]

    if (ps.abilityCooldown > 0) return

    if (def.ability.id === 'pack_howl') {
      ps.abilityActive = true
      ps.abilityCooldown = def.ability.cooldown
    } else if (def.ability.id === 'thick_hide') {
      ps.statusEffects.push({
        type: 'damage_reduction',
        turnsRemaining: def.ability.duration + 1,
        value: def.ability.damageReduction,
      })
      ps.abilityCooldown = def.ability.cooldown
    }
  }

  // ─── UPDATE LOOP ───────────────────────────────────────────

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.033) // cap at 30fps minimum

    this.handleMovement(dt)
    this.updateProjectile(dt)
    this.updateFragments(dt)
    this.updateExplosions(dt)
    this.updateDamageNumbers(dt)
    this.applyGravity(dt)
    this.checkWaterDeath()
    this.updateAiming(dt)

    // Render
    this.entityGraphics.clear()
    this.projectileGraphics.clear()
    this.uiGraphics.clear()

    this.drawEntities()
    this.drawProjectiles()
    this.drawAimingUI()
    this.drawHUD()
  }

  handleMovement(dt) {
    // During move phase: both players can move
    // During combat: no movement
    if (this.gs.phase !== PHASE.MOVE) return

    // Player 1: WASD
    this.movePlayer(1, this.cursors.left.isDown, this.cursors.right.isDown, this.cursors.jump.isDown, dt)

    // Player 2: Arrow keys
    this.movePlayer(2, this.cursorsP2.left.isDown, this.cursorsP2.right.isDown, this.cursorsP2.up.isDown, dt)
  }

  movePlayer(pid, left, right, jump, dt) {
    const body = this.playerBodies[pid]
    const def = this.playerDefs[pid]

    // Horizontal movement
    if (left) {
      body.vx = -def.speed
      this.gs.players[pid].facingRight = false
    } else if (right) {
      body.vx = def.speed
      this.gs.players[pid].facingRight = true
    } else {
      body.vx *= 0.85 // friction
      if (Math.abs(body.vx) < 5) body.vx = 0
    }

    // Jump
    if (jump && (body.onGround || body.onPlatform)) {
      body.vy = -def.jumpForce
      body.onGround = false
      body.onPlatform = false
    }

    // Apply horizontal movement
    body.x += body.vx * dt

    // Clamp to world bounds
    body.x = Math.max(def.bodyWidth / 2, Math.min(this.terrainData.worldWidth - def.bodyWidth / 2, body.x))
  }

  applyGravity(dt) {
    const GRAVITY = 800

    for (const pid of [1, 2]) {
      const body = this.playerBodies[pid]
      const def = this.playerDefs[pid]

      body.vy += GRAVITY * dt
      body.y += body.vy * dt

      body.onGround = false
      body.onPlatform = false

      // Terrain collision
      const surfaceY = getTerrainY(this.terrainData.heightMap, body.x)
      if (body.y >= surfaceY) {
        body.y = surfaceY
        body.vy = 0
        body.onGround = true
      }

      // Platform collision (only from above)
      for (const plat of this.terrainData.platforms) {
        if (
          body.x >= plat.x - plat.width / 2 - def.bodyWidth / 2 &&
          body.x <= plat.x + plat.width / 2 + def.bodyWidth / 2 &&
          body.y >= plat.y &&
          body.y <= plat.y + plat.height + 5 &&
          body.vy >= 0
        ) {
          body.y = plat.y
          body.vy = 0
          body.onPlatform = true
        }
      }
    }
  }

  checkWaterDeath() {
    for (const pid of [1, 2]) {
      const body = this.playerBodies[pid]
      if (isInWater(body.y, this.terrainData.waterLevel)) {
        this.gs.players[pid].hp = 0
        this.handlePlayerDeath(pid === 1 ? 2 : 1)
      }
    }
  }

  // ─── PROJECTILE & COMBAT ──────────────────────────────────

  updateProjectile(dt) {
    if (!this.activeProjectile) return

    const result = stepProjectile(this.activeProjectile, dt, this.terrainData)

    if (result) {
      if (result.type === 'terrain' || result.type === 'platform') {
        this.handleExplosion(result.x, result.y)
      } else if (result.type === 'water') {
        // Water splash -- projectile lost, no explosion
        this.fragments = this.fragments.concat(
          createFragments(result.x, result.y, 6).map((f) => ({
            ...f,
            color: 0x3b82f6,
          }))
        )
        this.activeProjectile = null
        this.afterProjectileLands()
      } else if (result.type === 'oob') {
        this.activeProjectile = null
        this.afterProjectileLands()
      }
    }

    // Also check direct hit on players
    if (this.activeProjectile) {
      for (const pid of [1, 2]) {
        const body = this.playerBodies[pid]
        const def = this.playerDefs[pid]
        const dx = this.activeProjectile.x - body.x
        const dy = this.activeProjectile.y - (body.y - def.bodyHeight / 2)
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < def.bodyWidth / 2 + 5) {
          this.handleExplosion(this.activeProjectile.x, this.activeProjectile.y)
          break
        }
      }
    }
  }

  handleExplosion(x, y) {
    const proj = this.activeProjectile
    if (!proj) return

    // Terrain deformation
    deformTerrain(this.terrainData.heightMap, x, proj.blastRadius)
    this.redrawTerrain()

    // Explosion visual
    this.explosions.push({
      x,
      y,
      radius: 5,
      maxRadius: proj.blastRadius * 1.5,
      alpha: 1,
    })

    // Fragments
    this.fragments = this.fragments.concat(createFragments(x, y, 12))

    // Damage + knockback to both players
    for (const pid of [1, 2]) {
      const body = this.playerBodies[pid]
      const def = this.playerDefs[pid]
      const ps = this.gs.players[pid]

      let damage = calculateExplosionDamage(
        x, y,
        body.x, body.y - def.bodyHeight / 2,
        proj.damage, proj.blastRadius
      )

      if (damage > 0) {
        // Apply damage reduction from status effects
        const reduction = ps.statusEffects
          .filter((e) => e.type === 'damage_reduction')
          .reduce((acc, e) => acc + e.value, 0)
        damage = Math.round(damage * (1 - Math.min(reduction, 0.8)))

        ps.hp = Math.max(0, ps.hp - damage)

        // Damage number
        this.damageNumbers.push({
          x: body.x,
          y: body.y - def.bodyHeight - 10,
          text: `-${damage}`,
          alpha: 1,
          vy: -60,
        })

        // Knockback
        const kb = calculateKnockback(x, y, body.x, body.y, proj.blastRadius)
        body.vx += kb.x
        body.vy += kb.y
        body.onGround = false
        body.onPlatform = false

        // Check death
        if (ps.hp <= 0) {
          this.handlePlayerDeath(pid === 1 ? 2 : 1)
          return
        }
      }
    }

    this.activeProjectile = null
    this.afterProjectileLands()
  }

  afterProjectileLands() {
    // Small delay before advancing turn
    this.time.delayedCall(800, () => {
      if (this.gs.phase !== PHASE.GAME_OVER) {
        this.advanceCombatTurn()
      }
    })
  }

  handlePlayerDeath(winnerPid) {
    this.gs.phase = PHASE.GAME_OVER
    if (this.phaseTimerEvent) this.phaseTimerEvent.destroy()

    this.time.delayedCall(2000, () => {
      this.onGameOver(winnerPid)
    })
  }

  // ─── AIMING ────────────────────────────────────────────────

  updateAiming(dt) {
    if (this.gs.phase !== PHASE.COMBAT || this.activeProjectile) return

    const pid = this.gs.activePlayer
    const body = this.playerBodies[pid]
    const pointer = this.input.activePointer

    // Calculate aim angle from player to mouse
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    this.aimAngle = Math.atan2(
      worldPoint.y - (body.y - this.playerDefs[pid].bodyHeight / 2),
      worldPoint.x - body.x
    )

    // Power charging (oscillates while mouse held)
    if (this.powerCharging) {
      this.aimPower += this.powerDirection * 80 * dt
      if (this.aimPower >= 100) {
        this.aimPower = 100
        this.powerDirection = -1
      } else if (this.aimPower <= 0) {
        this.aimPower = 0
        this.powerDirection = 1
      }
    }

    // Weapon switching
    const keys = pid === 1 ? this.cursors : this.p2Keys
    if (Phaser.Input.Keyboard.JustDown(keys.weapon1)) {
      this.gs.players[pid].selectedWeapon = 0
    }
    if (Phaser.Input.Keyboard.JustDown(keys.weapon2)) {
      this.gs.players[pid].selectedWeapon = 1
    }

    // Ability
    const abilityKey = pid === 1 ? this.cursors.ability : this.p2Keys.ability
    if (Phaser.Input.Keyboard.JustDown(abilityKey)) {
      this.useAbility(pid)
    }
  }

  // ─── FRAGMENT & EFFECT UPDATES ─────────────────────────────

  updateFragments(dt) {
    if (this.fragments.length > 0) {
      this.fragments = stepFragments(this.fragments, dt)
    }
  }

  updateExplosions(dt) {
    for (const exp of this.explosions) {
      exp.radius += (exp.maxRadius - exp.radius) * 5 * dt
      exp.alpha -= dt * 2
    }
    this.explosions = this.explosions.filter((e) => e.alpha > 0)
  }

  updateDamageNumbers(dt) {
    for (const dn of this.damageNumbers) {
      dn.y += dn.vy * dt
      dn.alpha -= dt * 0.8
    }
    this.damageNumbers = this.damageNumbers.filter((d) => d.alpha > 0)
  }

  // ─── RENDERING ─────────────────────────────────────────────

  drawBackground() {
    const w = this.terrainData.worldWidth
    const h = this.terrainData.worldHeight
    this.bgGraphics.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e3a5f, 0x1e3a5f, 1)
    this.bgGraphics.fillRect(0, 0, w, h)
  }

  redrawTerrain() {
    this.terrainGraphics.clear()
    drawTerrain(this.terrainGraphics, this.terrainData)
    drawPlatforms(this.terrainGraphics, this.terrainData.platforms)
  }

  drawEntities() {
    for (const pid of [1, 2]) {
      const body = this.playerBodies[pid]
      const def = this.playerDefs[pid]
      const ps = this.gs.players[pid]

      // Body
      const color = pid === 1 ? 0x3b82f6 : 0xef4444
      const outlineColor = pid === 1 ? 0x60a5fa : 0xf87171

      // Shadow
      this.entityGraphics.fillStyle(0x000000, 0.3)
      this.entityGraphics.fillEllipse(body.x, body.y, def.bodyWidth * 0.6, 8)

      // Main body (rounded rect-ish shape)
      this.entityGraphics.fillStyle(color, 1)
      this.entityGraphics.fillRoundedRect(
        body.x - def.bodyWidth / 2,
        body.y - def.bodyHeight,
        def.bodyWidth,
        def.bodyHeight,
        6
      )

      // Outline
      this.entityGraphics.lineStyle(2, outlineColor, 1)
      this.entityGraphics.strokeRoundedRect(
        body.x - def.bodyWidth / 2,
        body.y - def.bodyHeight,
        def.bodyWidth,
        def.bodyHeight,
        6
      )

      // Eyes (face direction)
      const eyeOffsetX = ps.facingRight ? 6 : -6
      this.entityGraphics.fillStyle(0xffffff, 1)
      this.entityGraphics.fillCircle(body.x + eyeOffsetX - 3, body.y - def.bodyHeight * 0.65, 4)
      this.entityGraphics.fillCircle(body.x + eyeOffsetX + 5, body.y - def.bodyHeight * 0.65, 4)

      // Pupils
      const pupilOffset = ps.facingRight ? 1.5 : -1.5
      this.entityGraphics.fillStyle(0x000000, 1)
      this.entityGraphics.fillCircle(body.x + eyeOffsetX - 3 + pupilOffset, body.y - def.bodyHeight * 0.65, 2)
      this.entityGraphics.fillCircle(body.x + eyeOffsetX + 5 + pupilOffset, body.y - def.bodyHeight * 0.65, 2)

      // Class indicator text
      const label = pid === 1 ? 'P1' : 'P2'
      if (!this[`label_p${pid}`]) {
        this[`label_p${pid}`] = this.add.text(0, 0, label, {
          fontSize: '11px',
          fontFamily: 'monospace',
          color: pid === 1 ? '#93c5fd' : '#fca5a5',
          fontStyle: 'bold',
        }).setOrigin(0.5)
      }
      this[`label_p${pid}`].setPosition(body.x, body.y - def.bodyHeight - 12)

      // HP bar above character
      const hpBarWidth = 40
      const hpPct = ps.hp / ps.maxHp
      this.entityGraphics.fillStyle(0x000000, 0.6)
      this.entityGraphics.fillRect(body.x - hpBarWidth / 2 - 1, body.y - def.bodyHeight - 8, hpBarWidth + 2, 5)
      this.entityGraphics.fillStyle(hpPct > 0.3 ? 0x4ade80 : 0xef4444, 1)
      this.entityGraphics.fillRect(body.x - hpBarWidth / 2, body.y - def.bodyHeight - 7, hpBarWidth * hpPct, 3)

      // Ability active indicator
      if (ps.abilityActive) {
        this.entityGraphics.lineStyle(2, 0xfbbf24, 0.8)
        this.entityGraphics.strokeCircle(body.x, body.y - def.bodyHeight / 2, def.bodyWidth * 0.8)
      }

      // Damage reduction shield indicator
      if (ps.statusEffects.some((e) => e.type === 'damage_reduction')) {
        this.entityGraphics.lineStyle(3, 0x38bdf8, 0.6)
        this.entityGraphics.strokeCircle(body.x, body.y - def.bodyHeight / 2, def.bodyWidth * 0.9)
      }
    }
  }

  drawProjectiles() {
    // Active projectile
    if (this.activeProjectile && this.activeProjectile.alive) {
      const p = this.activeProjectile

      // Trail
      for (let i = 0; i < p.trail.length; i++) {
        const alpha = i / p.trail.length * 0.5
        this.projectileGraphics.fillStyle(0xfbbf24, alpha)
        this.projectileGraphics.fillCircle(p.trail[i].x, p.trail[i].y, 2)
      }

      // Projectile body
      this.projectileGraphics.fillStyle(0xfbbf24, 1)
      this.projectileGraphics.fillCircle(p.x, p.y, 5)
      this.projectileGraphics.fillStyle(0xffffff, 0.8)
      this.projectileGraphics.fillCircle(p.x - 1, p.y - 1, 2)
    }

    // Fragments
    for (const f of this.fragments) {
      this.projectileGraphics.fillStyle(f.color, Math.max(0, f.life))
      this.projectileGraphics.fillCircle(f.x, f.y, f.size * f.life)
    }

    // Explosions
    for (const exp of this.explosions) {
      this.projectileGraphics.fillStyle(0xf97316, exp.alpha * 0.6)
      this.projectileGraphics.fillCircle(exp.x, exp.y, exp.radius)
      this.projectileGraphics.fillStyle(0xfbbf24, exp.alpha * 0.4)
      this.projectileGraphics.fillCircle(exp.x, exp.y, exp.radius * 0.6)
    }

    // Damage numbers
    for (const dn of this.damageNumbers) {
      if (!dn._text) {
        dn._text = this.add.text(dn.x, dn.y, dn.text, {
          fontSize: '16px',
          fontFamily: 'monospace',
          color: '#ef4444',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5)
      }
      dn._text.setPosition(dn.x, dn.y)
      dn._text.setAlpha(dn.alpha)
      if (dn.alpha <= 0) dn._text.destroy()
    }
  }

  drawAimingUI() {
    if (this.gs.phase !== PHASE.COMBAT || this.activeProjectile) return

    const pid = this.gs.activePlayer
    const body = this.playerBodies[pid]
    const def = this.playerDefs[pid]
    const ps = this.gs.players[pid]
    const weapon = def.weapons[ps.selectedWeapon]

    // Aim line
    const aimLen = 50
    const aimEndX = body.x + Math.cos(this.aimAngle) * aimLen
    const aimEndY = (body.y - def.bodyHeight / 2) + Math.sin(this.aimAngle) * aimLen

    this.uiGraphics.lineStyle(2, 0xffffff, 0.6)
    this.uiGraphics.beginPath()
    this.uiGraphics.moveTo(body.x, body.y - def.bodyHeight / 2)
    this.uiGraphics.lineTo(aimEndX, aimEndY)
    this.uiGraphics.strokePath()

    // Trajectory preview dots
    if (this.aimPower > 5) {
      const points = previewTrajectory(
        body.x,
        body.y - def.bodyHeight / 2,
        this.aimAngle,
        this.aimPower,
        weapon,
        this.gs.wind,
        60
      )
      for (let i = 0; i < points.length; i++) {
        const alpha = 1 - i / points.length
        this.uiGraphics.fillStyle(0xffffff, alpha * 0.4)
        this.uiGraphics.fillCircle(points[i].x, points[i].y, 2)
      }
    }

    // Power bar
    if (this.powerCharging) {
      const barX = body.x - 25
      const barY = body.y - def.bodyHeight - 25
      this.uiGraphics.fillStyle(0x000000, 0.7)
      this.uiGraphics.fillRect(barX - 1, barY - 1, 52, 8)
      const powerColor = this.aimPower < 50 ? 0x4ade80 : this.aimPower < 80 ? 0xfbbf24 : 0xef4444
      this.uiGraphics.fillStyle(powerColor, 1)
      this.uiGraphics.fillRect(barX, barY, this.aimPower / 2, 6)
    }
  }

  drawHUD() {
    // Phase indicator
    const phaseText = this.gs.phase === PHASE.MOVE
      ? `MOVE PHASE  ${this.gs.movePhaseTimer}s`
      : this.gs.phase === PHASE.COMBAT
      ? `COMBAT - Player ${this.gs.activePlayer}  ${this.gs.turnTimer}s`
      : this.gs.phase === PHASE.PROJECTILE_FLYING
      ? 'INCOMING!'
      : this.gs.phase === PHASE.GAME_OVER
      ? 'GAME OVER'
      : ''

    if (!this._phaseText) {
      this._phaseText = this.add.text(
        this.terrainData.worldWidth / 2, 20, '',
        {
          fontSize: '18px',
          fontFamily: 'monospace',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
        }
      ).setOrigin(0.5, 0).setScrollFactor(0)

      // Adjust for camera zoom
      const zoom = this.cameras.main.zoom
      this._phaseText.setPosition(this.scale.width / 2 / zoom, 15)
    }
    this._phaseText.setText(phaseText)

    // Wind indicator
    const windText = `Wind: ${getWindArrow(this.gs.wind)} ${getWindLabel(this.gs.wind)}`
    if (!this._windText) {
      this._windText = this.add.text(
        0, 0, '',
        {
          fontSize: '14px',
          fontFamily: 'monospace',
          color: '#94a3b8',
          stroke: '#000000',
          strokeThickness: 3,
        }
      ).setOrigin(0.5, 0).setScrollFactor(0)

      const zoom = this.cameras.main.zoom
      this._windText.setPosition(this.scale.width / 2 / zoom, 40)
    }
    this._windText.setText(windText)

    // Round counter
    if (!this._roundText) {
      this._roundText = this.add.text(
        0, 0, '',
        {
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#64748b',
          stroke: '#000000',
          strokeThickness: 2,
        }
      ).setOrigin(0.5, 0).setScrollFactor(0)

      const zoom = this.cameras.main.zoom
      this._roundText.setPosition(this.scale.width / 2 / zoom, 58)
    }
    this._roundText.setText(`Round ${this.gs.round}`)

    // Player info panels
    this.drawPlayerPanel(1, 10, 10)
    this.drawPlayerPanel(2, this.terrainData.worldWidth - 200, 10)

    // Weapon info (during combat)
    if (this.gs.phase === PHASE.COMBAT && !this.activeProjectile) {
      const pid = this.gs.activePlayer
      const def = this.playerDefs[pid]
      const ps = this.gs.players[pid]
      const weapon = def.weapons[ps.selectedWeapon]

      if (!this._weaponText) {
        this._weaponText = this.add.text(0, 0, '', {
          fontSize: '13px',
          fontFamily: 'monospace',
          color: '#e2e8f0',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5, 0).setScrollFactor(0)

        const zoom = this.cameras.main.zoom
        this._weaponText.setPosition(this.scale.width / 2 / zoom, this.scale.height / zoom - 50)
      }

      const w1Active = ps.selectedWeapon === 0 ? '[' : ' '
      const w1End = ps.selectedWeapon === 0 ? ']' : ' '
      const w2Active = ps.selectedWeapon === 1 ? '[' : ' '
      const w2End = ps.selectedWeapon === 1 ? ']' : ' '
      const abilityStatus = ps.abilityCooldown > 0 ? `(${ps.abilityCooldown} rounds)` : 'READY'
      const keyHint = pid === 1 ? '1/2 weapons  Q ability' : '9/0 weapons  P ability'

      this._weaponText.setText(
        `${w1Active}${def.weapons[0].name}${w1End}  ${w2Active}${def.weapons[1].name}${w2End}  |  ${def.ability.name}: ${abilityStatus}  |  ${keyHint}`
      )
      this._weaponText.setVisible(true)
    } else if (this._weaponText) {
      this._weaponText.setVisible(false)
    }
  }

  drawPlayerPanel(pid, x, y) {
    const def = this.playerDefs[pid]
    const ps = this.gs.players[pid]
    const key = `_panel_p${pid}`

    if (!this[key]) {
      this[key] = this.add.text(x, y, '', {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: pid === 1 ? '#93c5fd' : '#fca5a5',
        stroke: '#000000',
        strokeThickness: 3,
        lineSpacing: 4,
      }).setScrollFactor(0)
    }

    const hpBar = '█'.repeat(Math.ceil((ps.hp / ps.maxHp) * 10)) + '░'.repeat(10 - Math.ceil((ps.hp / ps.maxHp) * 10))
    const effects = ps.statusEffects.length > 0
      ? '\n' + ps.statusEffects.map((e) => `  ${e.type === 'damage_reduction' ? 'SHIELD' : e.type}`).join('')
      : ''
    const abilityGlow = ps.abilityActive ? ' ★ HOWL' : ''

    this[key].setText(
      `P${pid} ${def.name} (${def.className})\n` +
      `HP ${hpBar} ${ps.hp}/${ps.maxHp}${abilityGlow}${effects}`
    )
  }
}
