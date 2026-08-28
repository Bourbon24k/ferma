import type { BuildingConfig } from '../types/game'

export const BUILDINGS: Record<BuildingConfig['id'], BuildingConfig> = {
  'flower-bed': { id: 'flower-bed', name: 'Клумба', costWood: 6, unlockLevel: 3, sprite: 'flower-bed' },
  birdhouse: { id: 'birdhouse', name: 'Скворечник', costWood: 10, unlockLevel: 4, sprite: 'birdhouse' },
}
