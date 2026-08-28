import type { LevelConfig } from '../types/game'

export const LEVELS: readonly LevelConfig[] = [
  { level: 1, cumulativeXp: 0, maxEnergy: 30, unlocks: ['plot-1', 'carrot', 'potato'] },
  { level: 2, cumulativeXp: 100, maxEnergy: 32, unlocks: ['plot-2', 'wheat', 'strawberry'] },
  { level: 3, cumulativeXp: 260, maxEnergy: 34, unlocks: ['tomato', 'flower-bed'] },
  { level: 4, cumulativeXp: 500, maxEnergy: 36, unlocks: ['corn', 'birdhouse'] },
  { level: 5, cumulativeXp: 850, maxEnergy: 40, unlocks: ['pumpkin', 'plot-3', 'forest-area'] },
]
