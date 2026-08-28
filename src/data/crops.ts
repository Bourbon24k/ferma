import type { CropConfig, CropId } from '../types/game'

export const CROPS: Record<CropId, CropConfig> = {
  carrot: { id: 'carrot', name: 'Морковь', seedPrice: 10, growTimeMs: 60_000, waterDurationMs: 45_000, sellPrice: 18, plantXp: 2, waterXp: 1, harvestXp: 5, unlockLevel: 1, stages: ['carrot-0', 'carrot-1', 'carrot-2', 'carrot-3', 'carrot-4'] },
  potato: { id: 'potato', name: 'Картофель', seedPrice: 14, growTimeMs: 90_000, waterDurationMs: 60_000, sellPrice: 26, plantXp: 2, waterXp: 1, harvestXp: 6, unlockLevel: 1, stages: ['potato-0', 'potato-1', 'potato-2', 'potato-3', 'potato-4'] },
  wheat: { id: 'wheat', name: 'Пшеница', seedPrice: 18, growTimeMs: 120_000, waterDurationMs: 75_000, sellPrice: 34, plantXp: 3, waterXp: 1, harvestXp: 8, unlockLevel: 2, stages: ['wheat-0', 'wheat-1', 'wheat-2', 'wheat-3', 'wheat-4'] },
  strawberry: { id: 'strawberry', name: 'Клубника', seedPrice: 24, growTimeMs: 150_000, waterDurationMs: 90_000, sellPrice: 46, plantXp: 3, waterXp: 2, harvestXp: 10, unlockLevel: 2, stages: ['strawberry-0', 'strawberry-1', 'strawberry-2', 'strawberry-3', 'strawberry-4'] },
  tomato: { id: 'tomato', name: 'Помидор', seedPrice: 30, growTimeMs: 180_000, waterDurationMs: 105_000, sellPrice: 58, plantXp: 4, waterXp: 2, harvestXp: 12, unlockLevel: 3, stages: ['tomato-0', 'tomato-1', 'tomato-2', 'tomato-3', 'tomato-4'] },
  corn: { id: 'corn', name: 'Кукуруза', seedPrice: 38, growTimeMs: 240_000, waterDurationMs: 120_000, sellPrice: 74, plantXp: 4, waterXp: 2, harvestXp: 15, unlockLevel: 4, stages: ['corn-0', 'corn-1', 'corn-2', 'corn-3', 'corn-4'] },
  pumpkin: { id: 'pumpkin', name: 'Тыква', seedPrice: 50, growTimeMs: 300_000, waterDurationMs: 150_000, sellPrice: 98, plantXp: 5, waterXp: 3, harvestXp: 20, unlockLevel: 5, stages: ['pumpkin-0', 'pumpkin-1', 'pumpkin-2', 'pumpkin-3', 'pumpkin-4'] },
}
