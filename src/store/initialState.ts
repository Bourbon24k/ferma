import { createBedTiles } from '../data/farmLayout'
import type { CropId, FarmBedState, FarmTileState, InventoryState, ToolId } from '../types/game'
import type { GamePlayerState } from '../game/economy'

export const PLOT_UNLOCK_LEVELS: Record<string, number> = {
  'plot-1': 1,
  'plot-2': 2,
  'plot-3': 5,
  'plot-4': 7,
}

export interface ObstacleState {
  id: string
  woodReward: number
}

export interface PlacedBuilding {
  id: string
}

export interface GameDataState {
  player: GamePlayerState
  inventory: InventoryState
  tiles: Record<string, FarmTileState>
  beds: FarmBedState[]
  bedInventory: number
  unlockedPlots: string[]
  selectedTool: ToolId
  selectedSeed: CropId
  questProgress: Record<string, number>
  claimedQuestIds: string[]
  obstacles: Record<string, ObstacleState>
  buildings: PlacedBuilding[]
}

const cropIds: CropId[] = ['carrot', 'potato', 'wheat', 'strawberry', 'tomato', 'corn', 'pumpkin']

function createCropRecord(value: number): Record<CropId, number> {
  return Object.fromEntries(cropIds.map((cropId) => [cropId, value])) as Record<CropId, number>
}

export function getUnlockedPlots(level: number): string[] {
  return Object.entries(PLOT_UNLOCK_LEVELS)
    .filter(([, unlockLevel]) => level >= unlockLevel)
    .map(([plotId]) => plotId)
}

export function createInitialState(now: number): GameDataState {
  const seeds = createCropRecord(0)
  seeds.carrot = 3
  seeds.potato = 2

  return {
    player: {
      name: 'Репка',
      coins: 420,
      level: 1,
      xp: 0,
      energy: 30,
      maxEnergy: 30,
      energyUpdatedAt: now,
    },
    inventory: {
      seeds,
      crops: createCropRecord(0),
      wood: 8,
      materials: {},
    },
    tiles: createBedTiles('bed-1'),
    beds: [{ id: 'bed-1', position: { column: 2, row: 5 }, tileIds: ['bed-1-0', 'bed-1-1', 'bed-1-2', 'bed-1-3'] }],
    bedInventory: 0,
    unlockedPlots: ['bed-1'],
    selectedTool: 'hand',
    selectedSeed: 'carrot',
    questProgress: {},
    claimedQuestIds: [],
    obstacles: {
      'stump-1': { id: 'stump-1', woodReward: 2 },
    },
    buildings: [],
  }
}
