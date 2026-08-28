export type CropId = 'carrot' | 'potato' | 'wheat' | 'strawberry' | 'tomato' | 'corn' | 'pumpkin'

export type TileStatus = 'empty' | 'prepared' | 'seeded' | 'growing' | 'needsWater' | 'ready' | 'harvested'

export type ToolId = 'hand' | 'hoe' | 'seeds' | 'water' | 'axe' | 'build'

export type PanelId = 'shop' | 'warehouse' | 'build' | 'quests' | 'settings' | 'seeds' | 'cropInfo' | 'energy' | null

export interface CropConfig {
  id: CropId
  name: string
  seedPrice: number
  growTimeMs: number
  waterDurationMs: number
  sellPrice: number
  plantXp: number
  waterXp: number
  harvestXp: number
  unlockLevel: number
  stages: readonly [string, string, string, string, string]
}

export interface FarmTileState {
  id: string
  plotId: string
  index: number
  status: TileStatus
  cropId?: CropId
  plantedAt?: number
  wateredAt?: number
  harvestedAt?: number
}

export interface PlayerState {
  coins: number
  level: number
  xp: number
  energy: number
  maxEnergy: number
  energyUpdatedAt: number
}

export interface InventoryState {
  seeds: Record<CropId, number>
  crops: Record<CropId, number>
  wood: number
  materials: Record<string, number>
}

export type QuestEvent = 'plant' | 'water' | 'harvest' | 'sellCoins'

export interface QuestConfig {
  id: string
  event: QuestEvent
  cropId?: CropId
  target: number
  rewardCoins: number
  rewardXp: number
}

export interface LevelConfig {
  level: number
  cumulativeXp: number
  maxEnergy: number
  unlocks: readonly string[]
}

export interface BuildingConfig {
  id: 'flower-bed' | 'birdhouse'
  name: string
  costWood: number
  unlockLevel: number
  sprite: string
}
