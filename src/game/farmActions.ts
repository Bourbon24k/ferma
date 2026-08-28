import { CROPS } from '../data/crops'
import type { FarmTileState } from '../types/game'
import { getPlantSnapshot } from './time'

export function settleTileTime(tile: FarmTileState, now: number): FarmTileState {
  // The harvested frame is an interaction state, not a time-derived crop state.
  // It is cleared only after the harvest sprite reports completion.
  if (tile.status === 'harvested') return tile
  if (!tile.cropId) return tile

  const crop = CROPS[tile.cropId]
  const snapshot = getPlantSnapshot(tile, now)

  if (snapshot.status === 'ready') {
    return { ...tile, status: 'ready', growthMs: crop.growTimeMs, wateredAt: undefined }
  }

  if (snapshot.status === 'needsWater') {
    const elapsedWaterMs = tile.wateredAt === undefined ? 0 : Math.max(0, now - tile.wateredAt)
    return {
      ...tile,
      status: 'needsWater',
      growthMs: Math.min(crop.growTimeMs, (tile.growthMs ?? 0) + Math.min(elapsedWaterMs, crop.waterDurationMs)),
      wateredAt: undefined,
    }
  }

  return { ...tile, status: 'growing' }
}
