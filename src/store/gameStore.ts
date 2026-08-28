import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import { BUILDINGS } from '../data/buildings'
import { CROPS } from '../data/crops'
import { createBedTiles, isBedPositionValid } from '../data/farmLayout'
import { QUESTS } from '../data/quests'
import { awardXp } from '../game/economy'
import { settleTileTime } from '../game/farmActions'
import { getEnergyAt } from '../game/time'
import type { BoardPosition, CropId, FarmBedState, FarmTileState, ToolId } from '../types/game'
import { createInitialState, type GameDataState } from './initialState'
import { GAME_STORE_VERSION, migratePersistedState } from './migrations'

export const GAME_STORE_KEY = 'repka-farm:v1'

type GameEvent = 'hoe' | 'plant' | 'water' | 'harvest' | 'sellCoins' | 'buySeed' | 'claimQuest' | 'chop' | 'build' | 'buyBed' | 'placeBed' | 'moveBed' | 'storeBed'

export const FARM_BED_WOOD_COST = 6

export type ActionResult =
  | { ok: true; event: GameEvent; notification: string; cost?: { energy?: number; coins?: number; wood?: number }; resourceDeltas?: Record<string, number> }
  | { ok: false; reason: string }

interface GameActions {
  selectTool(tool: ToolId): void
  selectSeed(crop: CropId): void
  interactWithTile(tileId: string, now?: number): ActionResult
  finishHarvestAnimation(tileId: string): void
  buySeed(crop: CropId, amount?: number): ActionResult
  sellCrop(crop: CropId, amount?: number): ActionResult
  claimQuest(questId: string): ActionResult
  chopObstacle(obstacleId: string): ActionResult
  placeBuilding(buildingId: string): ActionResult
  buyFarmBed(): ActionResult
  placeFarmBed(position: BoardPosition): ActionResult
  moveFarmBed(bedId: string, position: BoardPosition): ActionResult
  storeFarmBed(bedId: string): ActionResult
  syncTime(now?: number): void
  resetProgress(): void
}

export type GameStore = GameDataState & GameActions

const memoryStorage = new Map<string, string>()

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name)
      }
    } catch {
      // Local storage is unavailable in some embedded browsers.
    }
    return memoryStorage.get(name) ?? null
  },
  setItem: (name, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value)
        return
      }
    } catch {
      // Retain progress in memory when persistent storage is blocked.
    }
    memoryStorage.set(name, value)
  },
  removeItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name)
      }
    } catch {
      // The in-memory fallback still needs to be cleared.
    }
    memoryStorage.delete(name)
  },
}

function ok(event: GameEvent, notification: string, extra: Omit<Extract<ActionResult, { ok: true }>, 'ok' | 'event' | 'notification'> = {}): ActionResult {
  return { ok: true, event, notification, ...extra }
}

function fail(reason: string): ActionResult {
  return { ok: false, reason }
}

function syncData(state: GameDataState, now: number): GameDataState {
  return {
    ...state,
    player: { ...state.player, ...getEnergyAt(now, state.player) },
    tiles: Object.fromEntries(Object.entries(state.tiles).map(([tileId, tile]) => [tileId, settleTileTime(tile, now)])),
  }
}

function withXp(state: GameDataState, amount: number, now: number): GameDataState {
  const player = awardXp(state.player, amount, now)
  return { ...state, player }
}

function withQuestEvent(state: GameDataState, event: GameEvent, cropId?: CropId, amount = 1): GameDataState {
  const questProgress = { ...state.questProgress }

  for (const quest of QUESTS) {
    if (quest.event === event && (!quest.cropId || quest.cropId === cropId)) {
      questProgress[quest.id] = (questProgress[quest.id] ?? 0) + amount
    }
  }

  return { ...state, questProgress }
}

function spendEnergy(state: GameDataState, cost: number): GameDataState | undefined {
  if (state.player.energy < cost) return undefined
  return { ...state, player: { ...state.player, energy: state.player.energy - cost } }
}

function seededTile(tile: FarmTileState, cropId: CropId, now: number): FarmTileState {
  return { ...tile, status: 'seeded', cropId, plantedAt: now, wateredAt: undefined, growthMs: 0, harvestedAt: undefined }
}

function isBedEmptyOrPrepared(bed: FarmBedState, tiles: Record<string, FarmTileState>): boolean {
  return bed.tileIds.every((tileId) => ['empty', 'prepared'].includes(tiles[tileId]?.status ?? 'empty'))
}

function nextBedId(beds: readonly FarmBedState[]): string {
  const usedIds = new Set(beds.map((bed) => bed.id))
  let number = 1
  while (usedIds.has(`bed-${number}`)) number += 1
  return `bed-${number}`
}

export const useGameStore = create<GameStore>()(persist(
  (set, get) => ({
    ...createInitialState(Date.now()),
    selectTool: (selectedTool) => set({ selectedTool }),
    selectSeed: (selectedSeed) => set({ selectedSeed }),
    interactWithTile: (tileId, now = Date.now()) => {
      const state = get()
      const tile = state.tiles[tileId]
      if (!tile) return fail('Грядка не найдена')
      if (!state.unlockedPlots.includes(tile.plotId)) return fail('Участок ещё закрыт')

      const timed = syncData(state, now)
      const currentTile = timed.tiles[tileId]

      if (timed.selectedTool === 'hoe') {
        if (currentTile.status !== 'empty') return fail('Нужна свободная грядка')
        const paid = spendEnergy(timed, 1)
        if (!paid) return fail('Не хватает энергии')
        set({ ...paid, tiles: { ...paid.tiles, [tileId]: { ...currentTile, status: 'prepared' } } })
        return ok('hoe', 'Грядка подготовлена', { cost: { energy: 1 } })
      }

      if (timed.selectedTool === 'seeds') {
        if (currentTile.status !== 'prepared') return fail('Сначала подготовьте грядку')
        const crop = CROPS[timed.selectedSeed]
        if (timed.player.level < crop.unlockLevel) return fail('Семена ещё не открыты')
        if (timed.inventory.seeds[crop.id] < 1) return fail('Семена закончились')
        let next = {
          ...timed,
          inventory: {
            ...timed.inventory,
            seeds: { ...timed.inventory.seeds, [crop.id]: timed.inventory.seeds[crop.id] - 1 },
          },
          tiles: { ...timed.tiles, [tileId]: seededTile(currentTile, crop.id, now) },
        }
        next = withQuestEvent(next, 'plant', crop.id)
        next = withXp(next, crop.plantXp, now)
        set(next)
        return ok('plant', `${crop.name} посажена`, { resourceDeltas: { [`seeds.${crop.id}`]: -1 } })
      }

      if (timed.selectedTool === 'water') {
        if (!currentTile.cropId || !['seeded', 'needsWater'].includes(currentTile.status)) return fail('Этому растению вода не нужна')
        const paid = spendEnergy(timed, 1)
        if (!paid) return fail('Не хватает энергии')
        const crop = CROPS[currentTile.cropId]
        let next = {
          ...paid,
          tiles: { ...paid.tiles, [tileId]: { ...currentTile, status: 'growing' as const, wateredAt: now } },
        }
        next = withQuestEvent(next, 'water', crop.id)
        next = withXp(next, crop.waterXp, now)
        set(next)
        return ok('water', 'Грядка полита', { cost: { energy: 1 } })
      }

      if (timed.selectedTool === 'hand') {
        if (currentTile.status !== 'ready' || !currentTile.cropId) return fail('Урожай ещё не готов')
        const crop = CROPS[currentTile.cropId]
        let next = {
          ...timed,
          inventory: {
            ...timed.inventory,
            crops: { ...timed.inventory.crops, [crop.id]: timed.inventory.crops[crop.id] + 1 },
          },
          tiles: { ...timed.tiles, [tileId]: { ...currentTile, status: 'harvested' as const, harvestedAt: now } },
        }
        next = withQuestEvent(next, 'harvest', crop.id)
        next = withXp(next, crop.harvestXp, now)
        set(next)
        return ok('harvest', 'Урожай собран', { resourceDeltas: { [`crops.${crop.id}`]: 1 } })
      }

      return fail('Этот инструмент не работает на грядке')
    },
    finishHarvestAnimation: (tileId) => {
      const tile = get().tiles[tileId]
      if (!tile || tile.status !== 'harvested') return
      set({ tiles: { ...get().tiles, [tileId]: { ...tile, status: 'prepared', cropId: undefined, plantedAt: undefined, wateredAt: undefined, growthMs: undefined } } })
    },
    buySeed: (cropId, amount = 1) => {
      if (!Number.isInteger(amount) || amount <= 0) return fail('Количество семян должно быть положительным')
      const state = get()
      const crop = CROPS[cropId]
      if (state.player.level < crop.unlockLevel) return fail('Семена ещё не открыты')
      const total = crop.seedPrice * amount
      if (state.player.coins < total) return fail('Недостаточно монет')
      set({
        player: { ...state.player, coins: state.player.coins - total },
        inventory: { ...state.inventory, seeds: { ...state.inventory.seeds, [cropId]: state.inventory.seeds[cropId] + amount } },
      })
      return ok('buySeed', 'Семена куплены', { cost: { coins: total } })
    },
    sellCrop: (cropId, amount = 1) => {
      if (!Number.isInteger(amount) || amount <= 0) return fail('Количество урожая должно быть положительным')
      const state = get()
      if (state.inventory.crops[cropId] < amount) return fail('Недостаточно урожая')
      const coins = CROPS[cropId].sellPrice * amount
      const next = withQuestEvent({
        ...state,
        player: { ...state.player, coins: state.player.coins + coins },
        inventory: { ...state.inventory, crops: { ...state.inventory.crops, [cropId]: state.inventory.crops[cropId] - amount } },
      }, 'sellCoins', cropId, coins)
      set(next)
      return ok('sellCoins', 'Урожай продан', { resourceDeltas: { coins, [`crops.${cropId}`]: -amount } })
    },
    claimQuest: (questId) => {
      const state = get()
      const quest = QUESTS.find((item) => item.id === questId)
      if (!quest) return fail('Задание не найдено')
      if (state.claimedQuestIds.includes(questId)) return fail('Награда уже получена')
      if ((state.questProgress[questId] ?? 0) < quest.target) return fail('Задание ещё не выполнено')
      const now = Date.now()
      const withReward = withXp({
        ...state,
        player: { ...state.player, coins: state.player.coins + quest.rewardCoins },
        claimedQuestIds: [...state.claimedQuestIds, questId],
      }, quest.rewardXp, now)
      set(withReward)
      return ok('claimQuest', 'Награда получена', { resourceDeltas: { coins: quest.rewardCoins, xp: quest.rewardXp } })
    },
    chopObstacle: (obstacleId) => {
      const state = get()
      const obstacle = state.obstacles[obstacleId]
      if (!obstacle) return fail('Препятствие не найдено')
      const now = Date.now()
      const timed = syncData(state, now)
      const paid = spendEnergy(timed, 2)
      if (!paid) return fail('Не хватает энергии')
      const { [obstacleId]: _removed, ...obstacles } = paid.obstacles
      set({ ...paid, obstacles, inventory: { ...paid.inventory, wood: paid.inventory.wood + obstacle.woodReward } })
      return ok('chop', 'Препятствие убрано', { cost: { energy: 2 }, resourceDeltas: { wood: obstacle.woodReward } })
    },
    placeBuilding: (buildingId) => {
      if (!(buildingId in BUILDINGS)) return fail('Постройка не найдена')
      const building = BUILDINGS[buildingId as keyof typeof BUILDINGS]
      const state = get()
      if (state.player.level < building.unlockLevel) return fail('Постройка ещё не открыта')
      if (state.inventory.wood < building.costWood) return fail('Недостаточно дерева')
      set({
        inventory: { ...state.inventory, wood: state.inventory.wood - building.costWood },
        buildings: [...state.buildings, { id: building.id }],
      })
      return ok('build', 'Постройка размещена', { cost: { wood: building.costWood } })
    },
    buyFarmBed: () => {
      const state = get()
      if (state.inventory.wood < FARM_BED_WOOD_COST) return fail('Недостаточно дерева')
      set({
        inventory: { ...state.inventory, wood: state.inventory.wood - FARM_BED_WOOD_COST },
        bedInventory: state.bedInventory + 1,
      })
      return ok('buyBed', 'Грядка куплена', { cost: { wood: FARM_BED_WOOD_COST } })
    },
    placeFarmBed: (position) => {
      const state = get()
      if (state.bedInventory < 1) return fail('В инвентаре нет грядки')
      if (!isBedPositionValid(position, state.beds)) return fail('Здесь нельзя разместить грядку')
      const id = nextBedId(state.beds)
      const tiles = createBedTiles(id)
      const bed: FarmBedState = { id, position: { ...position }, tileIds: [`${id}-0`, `${id}-1`, `${id}-2`, `${id}-3`] }
      set({ beds: [...state.beds, bed], tiles: { ...state.tiles, ...tiles }, bedInventory: state.bedInventory - 1 })
      return ok('placeBed', 'Грядка размещена')
    },
    moveFarmBed: (bedId, position) => {
      const state = get()
      const bed = state.beds.find((item) => item.id === bedId)
      if (!bed) return fail('Грядка не найдена')
      if (!isBedEmptyOrPrepared(bed, state.tiles)) return fail('На грядке есть растения')
      if (!isBedPositionValid(position, state.beds, bedId)) return fail('Здесь нельзя разместить грядку')
      set({ beds: state.beds.map((item) => item.id === bedId ? { ...item, position: { ...position } } : item) })
      return ok('moveBed', 'Грядка перемещена')
    },
    storeFarmBed: (bedId) => {
      const state = get()
      const bed = state.beds.find((item) => item.id === bedId)
      if (!bed) return fail('Грядка не найдена')
      if (!isBedEmptyOrPrepared(bed, state.tiles)) return fail('На грядке есть растения')
      const tiles = { ...state.tiles }
      for (const tileId of bed.tileIds) delete tiles[tileId]
      set({ beds: state.beds.filter((item) => item.id !== bedId), tiles, bedInventory: state.bedInventory + 1 })
      return ok('storeBed', 'Грядка убрана в инвентарь')
    },
    syncTime: (now = Date.now()) => set(syncData(get(), now)),
    resetProgress: () => set(createInitialState(Date.now())),
  }),
  {
    name: GAME_STORE_KEY,
    version: GAME_STORE_VERSION,
    storage: createJSONStorage(() => safeStorage),
    partialize: (state) => ({
      player: state.player,
      inventory: state.inventory,
      tiles: state.tiles,
      beds: state.beds,
      bedInventory: state.bedInventory,
      unlockedPlots: state.unlockedPlots,
      selectedTool: state.selectedTool,
      selectedSeed: state.selectedSeed,
      questProgress: state.questProgress,
      claimedQuestIds: state.claimedQuestIds,
      obstacles: state.obstacles,
      buildings: state.buildings,
    }),
    migrate: (persistedState, version) => migratePersistedState(persistedState, version),
  },
))

export function resetGameStore(now = Date.now()): void {
  useGameStore.setState(createInitialState(now))
}
