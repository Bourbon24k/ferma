import { createInitialState, type GameDataState } from './initialState'

export const GAME_STORE_VERSION = 2

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'number')
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isCurrentGameData(value: unknown): value is GameDataState {
  if (!isRecord(value) || !isRecord(value.player) || !isRecord(value.inventory) || !isRecord(value.tiles)) {
    return false
  }

  const player = value.player
  const inventory = value.inventory
  return typeof player.name === 'string'
    && typeof player.coins === 'number'
    && typeof player.level === 'number'
    && typeof player.xp === 'number'
    && typeof player.energy === 'number'
    && typeof player.maxEnergy === 'number'
    && typeof player.energyUpdatedAt === 'number'
    && isNumberRecord(inventory.seeds)
    && isNumberRecord(inventory.crops)
    && typeof inventory.wood === 'number'
    && isNumberRecord(inventory.materials)
    && isStringArray(value.unlockedPlots)
    && typeof value.selectedTool === 'string'
    && typeof value.selectedSeed === 'string'
    && isNumberRecord(value.questProgress)
    && isStringArray(value.claimedQuestIds)
    && isRecord(value.obstacles)
    && Array.isArray(value.buildings)
    && Array.isArray(value.beds)
    && value.beds.every((bed) => isRecord(bed)
      && typeof bed.id === 'string'
      && isRecord(bed.position)
      && typeof bed.position.column === 'number'
      && typeof bed.position.row === 'number'
      && isStringArray(bed.tileIds)
      && bed.tileIds.length === 4)
    && typeof value.bedInventory === 'number'
}

function isVersionOneGameData(value: unknown): value is Omit<GameDataState, 'beds' | 'bedInventory'> {
  if (!isRecord(value)) return false
  const { beds: _beds, bedInventory: _bedInventory, ...legacy } = value
  return isCurrentGameData({ ...legacy, beds: [], bedInventory: 0 })
}

function migrateVersionOne(value: Omit<GameDataState, 'beds' | 'bedInventory'>, now: number): GameDataState {
  const initial = createInitialState(now)
  const tiles = { ...initial.tiles }
  for (let index = 0; index < 4; index += 1) {
    const legacyTile = value.tiles[`plot-1-${index}`]
    if (legacyTile) {
      tiles[`bed-1-${index}`] = { ...legacyTile, id: `bed-1-${index}`, plotId: 'bed-1', index }
    }
  }
  return { ...value, tiles, beds: initial.beds, bedInventory: 0, unlockedPlots: ['bed-1'] }
}

export function migratePersistedState(value: unknown, version: number, now = Date.now()): GameDataState {
  if (version === GAME_STORE_VERSION && isCurrentGameData(value)) {
    return value
  }

  if (version === 1 && isVersionOneGameData(value)) {
    return migrateVersionOne(value, now)
  }

  return createInitialState(now)
}
