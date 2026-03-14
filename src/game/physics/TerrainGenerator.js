/**
 * Procedural terrain generator.
 * Creates a heightmap and identifies water zones, platforms, and spawn points.
 */

const WORLD_WIDTH = 1600
const WORLD_HEIGHT = 900
const TERRAIN_RESOLUTION = 4 // pixels per column
const WATER_LEVEL = WORLD_HEIGHT - 60

export function generateTerrain() {
  const columns = Math.ceil(WORLD_WIDTH / TERRAIN_RESOLUTION)
  const heightMap = new Float32Array(columns)

  // Base terrain using layered sine waves (simplex-like)
  const seed = Math.random() * 1000
  for (let i = 0; i < columns; i++) {
    const x = i / columns
    let h = 0

    // Large rolling hills
    h += Math.sin(x * 3.2 + seed) * 120
    // Medium bumps
    h += Math.sin(x * 7.8 + seed * 2.1) * 50
    // Small detail
    h += Math.sin(x * 18.3 + seed * 0.7) * 20
    // Tiny roughness
    h += Math.sin(x * 41.0 + seed * 3.3) * 8

    // Base ground level (higher number = lower on screen)
    const baseY = WORLD_HEIGHT - 280
    heightMap[i] = baseY + h
  }

  // Carve a valley/pit in the center for water hazard
  const centerStart = Math.floor(columns * 0.42)
  const centerEnd = Math.floor(columns * 0.58)
  const pitDepth = 180
  for (let i = centerStart; i < centerEnd; i++) {
    const t = (i - centerStart) / (centerEnd - centerStart)
    const curve = Math.sin(t * Math.PI) // smooth U shape
    heightMap[i] = Math.max(heightMap[i], WATER_LEVEL - 20 + (1 - curve) * pitDepth)
  }

  // Ensure edges have walls (slight rise)
  for (let i = 0; i < 15; i++) {
    const t = i / 15
    heightMap[i] = Math.min(heightMap[i], heightMap[15]) - (1 - t) * 40
  }
  for (let i = columns - 15; i < columns; i++) {
    const t = (columns - i) / 15
    heightMap[i] = Math.min(heightMap[i], heightMap[columns - 16]) - (1 - t) * 40
  }

  // Platforms (floating ledges for strategic positioning)
  const platforms = [
    { x: WORLD_WIDTH * 0.2, y: WORLD_HEIGHT - 480, width: 100, height: 14 },
    { x: WORLD_WIDTH * 0.75, y: WORLD_HEIGHT - 500, width: 90, height: 14 },
    { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT - 560, width: 70, height: 14 },
  ]

  // Spawn points (on solid ground, away from water)
  const spawnP1 = {
    x: WORLD_WIDTH * 0.15,
    y: getTerrainY(heightMap, WORLD_WIDTH * 0.15) - 40,
  }
  const spawnP2 = {
    x: WORLD_WIDTH * 0.85,
    y: getTerrainY(heightMap, WORLD_WIDTH * 0.85) - 40,
  }

  return {
    heightMap,
    platforms,
    spawnP1,
    spawnP2,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    resolution: TERRAIN_RESOLUTION,
    waterLevel: WATER_LEVEL,
  }
}

/** Get the terrain surface Y at a given world X coordinate */
export function getTerrainY(heightMap, worldX) {
  const col = Math.floor(worldX / TERRAIN_RESOLUTION)
  const clampedCol = Math.max(0, Math.min(col, heightMap.length - 1))
  return heightMap[clampedCol]
}

/** Check if a point is inside terrain (below the surface) */
export function isInsideTerrain(heightMap, worldX, worldY) {
  return worldY >= getTerrainY(heightMap, worldX)
}

/** Check if a point is in water */
export function isInWater(worldY, waterLevel) {
  return worldY >= waterLevel
}

/**
 * Deform terrain around an impact point (crater).
 * Returns the modified heightMap.
 */
export function deformTerrain(heightMap, impactX, blastRadius) {
  const centerCol = Math.floor(impactX / TERRAIN_RESOLUTION)
  const radiusCols = Math.ceil(blastRadius / TERRAIN_RESOLUTION)

  for (let i = centerCol - radiusCols; i <= centerCol + radiusCols; i++) {
    if (i < 0 || i >= heightMap.length) continue
    const dist = Math.abs(i - centerCol) / radiusCols
    const depth = (1 - dist * dist) * blastRadius * 0.8
    heightMap[i] += depth // push terrain down (increase Y = lower on screen)
  }

  return heightMap
}

/**
 * Render the terrain onto a Phaser Graphics object.
 */
export function drawTerrain(graphics, terrainData) {
  const { heightMap, worldWidth, worldHeight, resolution, waterLevel } = terrainData

  // Draw water first (behind terrain)
  graphics.fillStyle(0x1a3a5c, 0.8)
  graphics.fillRect(0, waterLevel, worldWidth, worldHeight - waterLevel)

  // Water surface shimmer
  graphics.fillStyle(0x2563eb, 0.3)
  graphics.fillRect(0, waterLevel, worldWidth, 3)

  // Draw terrain body
  graphics.fillStyle(0x3d2817)
  graphics.beginPath()
  graphics.moveTo(0, worldHeight)

  for (let i = 0; i < heightMap.length; i++) {
    graphics.lineTo(i * resolution, heightMap[i])
  }

  graphics.lineTo(worldWidth, worldHeight)
  graphics.closePath()
  graphics.fillPath()

  // Grass top layer
  graphics.lineStyle(3, 0x4ade80, 1)
  graphics.beginPath()
  graphics.moveTo(0, heightMap[0])

  for (let i = 1; i < heightMap.length; i++) {
    graphics.lineTo(i * resolution, heightMap[i])
  }

  graphics.strokePath()
}

/**
 * Draw floating platforms.
 */
export function drawPlatforms(graphics, platforms) {
  platforms.forEach((p) => {
    // Platform body
    graphics.fillStyle(0x52525b)
    graphics.fillRect(p.x - p.width / 2, p.y, p.width, p.height)

    // Top edge highlight
    graphics.fillStyle(0x71717a)
    graphics.fillRect(p.x - p.width / 2, p.y, p.width, 3)
  })
}
