import { describe, expect, it } from 'vitest'

import { CROPS } from './crops'
import { LEVELS } from './levels'
import { QUESTS } from './quests'
import { BUILDINGS } from './buildings'

describe('crop configuration', () => {
  it('defines seven crops with five unique stable stage keys', () => {
    expect(Object.keys(CROPS)).toHaveLength(7)

    for (const crop of Object.values(CROPS)) {
      expect(crop.stages).toHaveLength(5)
      expect(new Set(crop.stages).size).toBe(5)
    }
  })

  it('uses the controller-approved crop economics, experience, unlocks, and stages', () => {
    expect(CROPS).toEqual({
      carrot: { id: 'carrot', name: 'Морковь', seedPrice: 10, growTimeMs: 60_000, waterDurationMs: 45_000, sellPrice: 18, plantXp: 2, waterXp: 1, harvestXp: 5, unlockLevel: 1, stages: ['carrot-0', 'carrot-1', 'carrot-2', 'carrot-3', 'carrot-4'] },
      potato: { id: 'potato', name: 'Картофель', seedPrice: 14, growTimeMs: 90_000, waterDurationMs: 60_000, sellPrice: 26, plantXp: 2, waterXp: 1, harvestXp: 6, unlockLevel: 1, stages: ['potato-0', 'potato-1', 'potato-2', 'potato-3', 'potato-4'] },
      wheat: { id: 'wheat', name: 'Пшеница', seedPrice: 18, growTimeMs: 120_000, waterDurationMs: 75_000, sellPrice: 34, plantXp: 3, waterXp: 1, harvestXp: 8, unlockLevel: 2, stages: ['wheat-0', 'wheat-1', 'wheat-2', 'wheat-3', 'wheat-4'] },
      strawberry: { id: 'strawberry', name: 'Клубника', seedPrice: 24, growTimeMs: 150_000, waterDurationMs: 90_000, sellPrice: 46, plantXp: 3, waterXp: 2, harvestXp: 10, unlockLevel: 2, stages: ['strawberry-0', 'strawberry-1', 'strawberry-2', 'strawberry-3', 'strawberry-4'] },
      tomato: { id: 'tomato', name: 'Помидор', seedPrice: 30, growTimeMs: 180_000, waterDurationMs: 105_000, sellPrice: 58, plantXp: 4, waterXp: 2, harvestXp: 12, unlockLevel: 3, stages: ['tomato-0', 'tomato-1', 'tomato-2', 'tomato-3', 'tomato-4'] },
      corn: { id: 'corn', name: 'Кукуруза', seedPrice: 38, growTimeMs: 240_000, waterDurationMs: 120_000, sellPrice: 74, plantXp: 4, waterXp: 2, harvestXp: 15, unlockLevel: 4, stages: ['corn-0', 'corn-1', 'corn-2', 'corn-3', 'corn-4'] },
      pumpkin: { id: 'pumpkin', name: 'Тыква', seedPrice: 50, growTimeMs: 300_000, waterDurationMs: 150_000, sellPrice: 98, plantXp: 5, waterXp: 3, harvestXp: 20, unlockLevel: 5, stages: ['pumpkin-0', 'pumpkin-1', 'pumpkin-2', 'pumpkin-3', 'pumpkin-4'] },
    })
  })
})

describe('level configuration', () => {
  it('uses cumulative experience, energy, and unlocks approved by the controller', () => {
    expect(LEVELS).toEqual([
      { level: 1, cumulativeXp: 0, maxEnergy: 30, unlocks: ['plot-1', 'carrot', 'potato'] },
      { level: 2, cumulativeXp: 100, maxEnergy: 32, unlocks: ['plot-2', 'wheat', 'strawberry'] },
      { level: 3, cumulativeXp: 260, maxEnergy: 34, unlocks: ['tomato', 'flower-bed'] },
      { level: 4, cumulativeXp: 500, maxEnergy: 36, unlocks: ['corn', 'birdhouse'] },
      { level: 5, cumulativeXp: 850, maxEnergy: 40, unlocks: ['pumpkin', 'plot-3', 'forest-area'] },
    ])
  })
})

describe('quest configuration', () => {
  it('defines the approved progression events, targets, and rewards', () => {
    expect(QUESTS).toEqual([
      { id: 'plant-carrots', event: 'plant', cropId: 'carrot', target: 3, rewardCoins: 60, rewardXp: 25 },
      { id: 'water-plots', event: 'water', target: 5, rewardCoins: 45, rewardXp: 20 },
      { id: 'harvest-crops', event: 'harvest', target: 3, rewardCoins: 80, rewardXp: 35 },
      { id: 'earn-coins', event: 'sellCoins', target: 100, rewardCoins: 100, rewardXp: 45 },
    ])
  })
})

describe('building configuration', () => {
  it('defines the approved wood costs, level locks, and sprite keys', () => {
    expect(BUILDINGS).toEqual({
      'flower-bed': { id: 'flower-bed', name: 'Клумба', costWood: 6, unlockLevel: 3, sprite: 'flower-bed' },
      birdhouse: { id: 'birdhouse', name: 'Скворечник', costWood: 10, unlockLevel: 4, sprite: 'birdhouse' },
    })
  })
})
