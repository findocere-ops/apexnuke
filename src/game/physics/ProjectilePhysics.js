/**
 * Projectile physics simulation.
 * Handles gravity, wind, weight, ricochet, and fragment generation.
 */

const GRAVITY = 560 // px/s²

/**
 * Create a new projectile.
 */
export function createProjectile(x, y, angle, power, weaponDef, wind) {
  const speed = weaponDef.projectileSpeed * (power / 100)
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    weight: weaponDef.projectileWeight,
    damage: weaponDef.damage,
    blastRadius: weaponDef.blastRadius,
    ricochet: weaponDef.ricochet,
    bouncesLeft: weaponDef.bounces,
    wind,
    alive: true,
    trail: [], // for trajectory rendering
    age: 0,
  }
}

/**
 * Step projectile physics forward by dt seconds.
 * Returns collision info if the projectile hits something.
 */
export function stepProjectile(proj, dt, terrainData) {
  if (!proj.alive) return null

  proj.age += dt

  // Store trail point
  if (proj.trail.length === 0 || proj.age > proj.trail.length * 0.016) {
    proj.trail.push({ x: proj.x, y: proj.y })
    if (proj.trail.length > 200) proj.trail.shift()
  }

  // Wind effect (inversely proportional to weight)
  const windEffect = proj.wind / proj.weight

  // Apply forces
  proj.vx += windEffect * dt
  proj.vy += GRAVITY * dt

  // Move
  const newX = proj.x + proj.vx * dt
  const newY = proj.y + proj.vy * dt

  // Check terrain collision (sample multiple points along path for fast projectiles)
  const steps = Math.max(1, Math.ceil(Math.sqrt((newX - proj.x) ** 2 + (newY - proj.y) ** 2) / 4))
  for (let s = 1; s <= steps; s++) {
    const t = s / steps
    const checkX = proj.x + (newX - proj.x) * t
    const checkY = proj.y + (newY - proj.y) * t

    // Terrain hit
    const col = Math.floor(checkX / terrainData.resolution)
    if (col >= 0 && col < terrainData.heightMap.length) {
      const surfaceY = terrainData.heightMap[col]
      if (checkY >= surfaceY) {
        if (proj.ricochet && proj.bouncesLeft > 0) {
          return handleRicochet(proj, checkX, surfaceY, terrainData)
        }
        proj.alive = false
        return { type: 'terrain', x: checkX, y: surfaceY }
      }
    }

    // Platform hit
    for (const plat of terrainData.platforms) {
      if (
        checkX >= plat.x - plat.width / 2 &&
        checkX <= plat.x + plat.width / 2 &&
        checkY >= plat.y &&
        checkY <= plat.y + plat.height &&
        proj.vy > 0 // only hit from above
      ) {
        if (proj.ricochet && proj.bouncesLeft > 0) {
          proj.vy = -Math.abs(proj.vy) * 0.6
          proj.bouncesLeft--
          return null
        }
        proj.alive = false
        return { type: 'platform', x: checkX, y: plat.y }
      }
    }

    // Water (instant kill on anything in water)
    if (checkY >= terrainData.waterLevel) {
      proj.alive = false
      return { type: 'water', x: checkX, y: terrainData.waterLevel }
    }

    // Out of bounds
    if (checkX < -100 || checkX > terrainData.worldWidth + 100 || checkY < -500) {
      proj.alive = false
      return { type: 'oob', x: checkX, y: checkY }
    }
  }

  proj.x = newX
  proj.y = newY
  return null
}

/**
 * Handle ricochet off terrain surface.
 */
function handleRicochet(proj, hitX, surfaceY, terrainData) {
  // Estimate surface normal from nearby terrain columns
  const col = Math.floor(hitX / terrainData.resolution)
  const leftCol = Math.max(0, col - 2)
  const rightCol = Math.min(terrainData.heightMap.length - 1, col + 2)
  const slopeY = terrainData.heightMap[rightCol] - terrainData.heightMap[leftCol]
  const slopeX = (rightCol - leftCol) * terrainData.resolution

  // Normal vector (perpendicular to slope)
  const len = Math.sqrt(slopeX * slopeX + slopeY * slopeY)
  const nx = -slopeY / len
  const ny = slopeX / len

  // Reflect velocity
  const dot = proj.vx * nx + proj.vy * ny
  proj.vx = (proj.vx - 2 * dot * nx) * 0.65 // energy loss on bounce
  proj.vy = (proj.vy - 2 * dot * ny) * 0.65

  proj.x = hitX
  proj.y = surfaceY - 2 // slightly above surface
  proj.bouncesLeft--

  return null // projectile continues
}

/**
 * Generate explosion fragments (debris).
 */
export function createFragments(x, y, count) {
  const fragments = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const speed = 100 + Math.random() * 250
    fragments.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 150, // bias upward
      life: 0.5 + Math.random() * 0.8,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.5 ? 0xf97316 : 0xfbbf24,
    })
  }
  return fragments
}

/**
 * Step fragments forward.
 */
export function stepFragments(fragments, dt) {
  for (const f of fragments) {
    f.vy += GRAVITY * 0.8 * dt
    f.x += f.vx * dt
    f.y += f.vy * dt
    f.life -= dt
  }
  return fragments.filter((f) => f.life > 0)
}

/**
 * Calculate damage based on distance from explosion center.
 * Returns damage value (0 if out of range).
 */
export function calculateExplosionDamage(explosionX, explosionY, targetX, targetY, baseDamage, blastRadius) {
  const dist = Math.sqrt((explosionX - targetX) ** 2 + (explosionY - targetY) ** 2)
  if (dist > blastRadius) return 0

  // Linear falloff from center
  const falloff = 1 - dist / blastRadius
  return Math.round(baseDamage * falloff)
}

/**
 * Calculate knockback vector from explosion.
 */
export function calculateKnockback(explosionX, explosionY, targetX, targetY, blastRadius) {
  const dx = targetX - explosionX
  const dy = targetY - explosionY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist > blastRadius || dist < 1) return { x: 0, y: 0 }

  const force = (1 - dist / blastRadius) * 300
  return {
    x: (dx / dist) * force,
    y: (dy / dist) * force - 150, // bias upward for dramatic effect
  }
}

/**
 * Preview trajectory (dots for aiming).
 */
export function previewTrajectory(startX, startY, angle, power, weaponDef, wind, steps) {
  const speed = weaponDef.projectileSpeed * (power / 100)
  let vx = Math.cos(angle) * speed
  let vy = Math.sin(angle) * speed
  let x = startX
  let y = startY

  const windEffect = wind / weaponDef.projectileWeight
  const dt = 0.03
  const points = []

  for (let i = 0; i < steps; i++) {
    vx += windEffect * dt
    vy += GRAVITY * dt
    x += vx * dt
    y += vy * dt
    if (i % 3 === 0) {
      points.push({ x, y })
    }
  }

  return points
}
