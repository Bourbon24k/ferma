import { beforeEach, describe, expect, it } from 'vitest'

import { createInitialState } from './initialState'
import { migratePersistedState } from './migrations'
import { resetGameStore, useGameStore } from './gameStore'

describe('createInitialState', () => {
  it('creates the controller-approved player, inventory, and starter bed', () => {
    const state = createInitialState(1_000)

    expect(state.player).toEqual({
      name: 'Репка',
      coins: 420,
      level: 1,
      xp: 0,
      energy: 30,
      maxEnergy: 30,
      energyUpdatedAt: 1_000,
    })
    expect(state.inventory.seeds).toMatchObject({ carrot: 3, potato: 2, wheat: 0, pumpkin: 0 })
    expect(Object.values(state.tiles)).toHaveLength(4)
    expect(state.unlockedPlots).toEqual(['bed-1'])
    expect(state.tiles['bed-1-0']).toMatchObject({ status: 'empty', plotId: 'bed-1', index: 0 })
  })
})

describe('game store tile transitions', () => {
  beforeEach(() => resetGameStore(1_000))

  it('atomically prepares, plants, waters, dries, rewates, and harvests a tile', () => {
    const store = useGameStore

    store.getState().selectTool('hoe')
    expect(store.getState().interactWithTile('bed-1-0', 1_000)).toMatchObject({ ok: true, event: 'hoe' })
    expect(store.getState().player.energy).toBe(29)
    expect(store.getState().tiles['bed-1-0'].status).toBe('prepared')

    store.getState().selectSeed('carrot')
    store.getState().selectTool('seeds')
    expect(store.getState().interactWithTile('bed-1-0', 1_001)).toMatchObject({ ok: true, event: 'plant' })
    expect(store.getState().inventory.seeds.carrot).toBe(2)
    expect(store.getState().tiles['bed-1-0']).toMatchObject({ status: 'seeded', plantedAt: 1_001, growthMs: 0 })

    store.getState().selectTool('water')
    expect(store.getState().interactWithTile('bed-1-0', 1_002)).toMatchObject({ ok: true, event: 'water' })
    expect(store.getState().player.energy).toBe(28)

    store.getState().syncTime(46_002)
    expect(store.getState().tiles['bed-1-0']).toMatchObject({ status: 'needsWater', growthMs: 45_000, wateredAt: undefined })

    expect(store.getState().interactWithTile('bed-1-0', 46_003)).toMatchObject({ ok: true, event: 'water' })
    store.getState().syncTime(61_003)
    expect(store.getState().tiles['bed-1-0'].status).toBe('ready')

    store.getState().selectTool('hand')
    expect(store.getState().interactWithTile('bed-1-0', 61_003)).toMatchObject({ ok: true, event: 'harvest' })
    expect(store.getState().inventory.crops.carrot).toBe(1)
    expect(store.getState().tiles['bed-1-0'].status).toBe('harvested')

    store.getState().syncTime(62_003)
    expect(store.getState().tiles['bed-1-0'].status).toBe('harvested')

    store.getState().finishHarvestAnimation('bed-1-0')
    expect(store.getState().tiles['bed-1-0']).toEqual(expect.objectContaining({ status: 'prepared', cropId: undefined }))
  })

  it('does not partially mutate state when a selected action cannot succeed', () => {
    const before = useGameStore.getState()
    useGameStore.getState().selectTool('hoe')

    const result = useGameStore.getState().interactWithTile('missing-bed-0', 1_000)

    expect(result).toMatchObject({ ok: false })
    expect(useGameStore.getState().player).toEqual(before.player)
    expect(useGameStore.getState().tiles['missing-bed-0']).toEqual(before.tiles['missing-bed-0'])
  })

  it('rejects watering a crop that is already growing without resetting its timer', () => {
    useGameStore.setState((state) => ({
      selectedTool: 'water',
      tiles: {
        ...state.tiles,
        'bed-1-0': {
          ...state.tiles['bed-1-0'],
          status: 'growing',
          cropId: 'carrot',
          plantedAt: 1_000,
          wateredAt: 1_000,
          growthMs: 0,
        },
      },
    }))

    const result = useGameStore.getState().interactWithTile('bed-1-0', 20_000)

    expect(result).toMatchObject({ ok: false })
    expect(useGameStore.getState().tiles['bed-1-0'].wateredAt).toBe(1_000)
    expect(useGameStore.getState().player.energy).toBe(30)
  })
})

describe('game store economy and progression', () => {
  beforeEach(() => resetGameStore(1_000))

  it('records the full coin proceeds for quest progress and prevents duplicate claims', () => {
    useGameStore.setState((state) => ({
      inventory: { ...state.inventory, crops: { ...state.inventory.crops, carrot: 6 } },
    }))

    expect(useGameStore.getState().sellCrop('carrot', 6)).toMatchObject({ ok: true, event: 'sellCoins' })
    expect(useGameStore.getState().questProgress['earn-coins']).toBe(108)
    expect(useGameStore.getState().player.coins).toBe(528)

    expect(useGameStore.getState().claimQuest('earn-coins')).toMatchObject({ ok: true, event: 'claimQuest' })
    expect(useGameStore.getState().player.coins).toBe(628)
    expect(useGameStore.getState().claimQuest('earn-coins')).toMatchObject({ ok: false })
    expect(useGameStore.getState().player.coins).toBe(628)
  })

  it('levels up cumulatively, refills energy, and exposes the next plot', () => {
    useGameStore.setState((state) => ({
      player: { ...state.player, xp: 99, energy: 1 },
      tiles: {
        ...state.tiles,
        'bed-1-0': { ...state.tiles['bed-1-0'], status: 'seeded', cropId: 'carrot', plantedAt: 1_000 },
      },
      selectedTool: 'water',
    }))

    expect(useGameStore.getState().interactWithTile('bed-1-0', 1_000)).toMatchObject({ ok: true, event: 'water' })
    expect(useGameStore.getState().player).toMatchObject({ xp: 100, level: 2, maxEnergy: 32, energy: 32 })
    expect(useGameStore.getState().unlockedPlots).toEqual(['bed-1'])
  })

  it('charges chopping energy, awards wood, and places unlocked buildings', () => {
    expect(useGameStore.getState().chopObstacle('stump-1')).toMatchObject({ ok: true, event: 'chop', cost: { energy: 2 } })
    expect(useGameStore.getState().inventory.wood).toBe(10)

    useGameStore.setState((state) => ({ player: { ...state.player, level: 3 } }))
    expect(useGameStore.getState().placeBuilding('flower-bed')).toMatchObject({ ok: true, event: 'build' })
    expect(useGameStore.getState().inventory.wood).toBe(4)
  })
})

describe('game store farm beds', () => {
  beforeEach(() => resetGameStore(1_000))

  it('buys a farm bed with wood and places an inventory bed on valid grass', () => {
    expect(useGameStore.getState().buyFarmBed()).toMatchObject({ ok: true, event: 'buyBed', cost: { wood: 6 } })
    expect(useGameStore.getState().inventory.wood).toBe(2)
    expect(useGameStore.getState().bedInventory).toBe(1)

    expect(useGameStore.getState().placeFarmBed({ column: 5, row: 8 })).toMatchObject({ ok: true, event: 'placeBed' })
    expect(useGameStore.getState().beds).toHaveLength(2)
    expect(useGameStore.getState().bedInventory).toBe(0)
    expect(useGameStore.getState().tiles['bed-2-0']).toMatchObject({ plotId: 'bed-2', status: 'empty' })
  })

  it('lets the player prepare tiles on a newly placed bed', () => {
    useGameStore.setState({ bedInventory: 1 })
    expect(useGameStore.getState().placeFarmBed({ column: 5, row: 8 })).toMatchObject({ ok: true })

    useGameStore.getState().selectTool('hoe')
    expect(useGameStore.getState().interactWithTile('bed-2-0', 1_000)).toMatchObject({ ok: true, event: 'hoe' })
    expect(useGameStore.getState().tiles['bed-2-0'].status).toBe('prepared')
  })

  it('does not partially mutate state when buying or placing a bed cannot succeed', () => {
    useGameStore.setState((state) => ({ inventory: { ...state.inventory, wood: 5 } }))
    const beforePurchase = useGameStore.getState()
    expect(useGameStore.getState().buyFarmBed()).toMatchObject({ ok: false })
    expect(useGameStore.getState().inventory).toEqual(beforePurchase.inventory)
    expect(useGameStore.getState().bedInventory).toBe(beforePurchase.bedInventory)

    useGameStore.setState((state) => ({ ...state, bedInventory: 1 }))
    const beforePlacement = useGameStore.getState()
    expect(useGameStore.getState().placeFarmBed({ column: 2, row: 5 })).toMatchObject({ ok: false })
    expect(useGameStore.getState().beds).toEqual(beforePlacement.beds)
    expect(useGameStore.getState().tiles).toEqual(beforePlacement.tiles)
    expect(useGameStore.getState().bedInventory).toBe(beforePlacement.bedInventory)
  })

  it('does not move a bed containing a crop', () => {
    useGameStore.setState((state) => ({
      tiles: { ...state.tiles, 'bed-1-0': { ...state.tiles['bed-1-0'], status: 'seeded', cropId: 'carrot', plantedAt: 1_000 } },
    }))
    const before = useGameStore.getState().beds[0].position

    expect(useGameStore.getState().moveFarmBed('bed-1', { column: 5, row: 8 })).toMatchObject({ ok: false })
    expect(useGameStore.getState().beds[0].position).toEqual(before)
  })

  it('stores only a removable bed and removes its tiles', () => {
    useGameStore.setState((state) => ({ ...state, bedInventory: 1 }))
    useGameStore.getState().placeFarmBed({ column: 5, row: 8 })
    useGameStore.setState((state) => ({
      tiles: { ...state.tiles, 'bed-2-0': { ...state.tiles['bed-2-0'], status: 'prepared' } },
    }))

    expect(useGameStore.getState().storeFarmBed('bed-2')).toMatchObject({ ok: true, event: 'storeBed' })
    expect(useGameStore.getState().bedInventory).toBe(1)
    expect(useGameStore.getState().beds.map((bed) => bed.id)).toEqual(['bed-1'])
    expect(useGameStore.getState().tiles['bed-2-0']).toBeUndefined()

    useGameStore.setState((state) => ({
      tiles: { ...state.tiles, 'bed-1-0': { ...state.tiles['bed-1-0'], status: 'seeded', cropId: 'carrot', plantedAt: 1_000 } },
    }))
    const before = useGameStore.getState()
    expect(useGameStore.getState().storeFarmBed('bed-1')).toMatchObject({ ok: false })
    expect(useGameStore.getState().beds).toEqual(before.beds)
    expect(useGameStore.getState().tiles).toEqual(before.tiles)
    expect(useGameStore.getState().bedInventory).toBe(before.bedInventory)
  })
})

describe('persisted schema', () => {
  it('guards invalid saved data by restoring a valid current state', () => {
    const state = migratePersistedState({ player: 'corrupted' }, 0, 4_000)

    expect(state.player).toMatchObject({ coins: 420, energyUpdatedAt: 4_000 })
    expect(Object.values(state.tiles)).toHaveLength(4)
  })

  it('rejects incomplete data even when its player shape is valid', () => {
    const saved = createInitialState(1_000)
    const state = migratePersistedState({ ...saved, inventory: {} }, 2, 4_000)

    expect(state.inventory.seeds.carrot).toBe(3)
    expect(state.player.energyUpdatedAt).toBe(4_000)
  })

  it('migrates the accessible version-one plot tiles into the starter bed', () => {
    const current = createInitialState(1_000)
    const legacy = {
      ...current,
      tiles: Object.fromEntries(Array.from({ length: 36 }, (_, index) => {
        const plot = Math.floor(index / 9) + 1
        const tileIndex = index % 9
        const id = `plot-${plot}-${tileIndex}`
        return [id, { id, plotId: `plot-${plot}`, index: tileIndex, status: tileIndex === 0 ? 'prepared' : 'empty' }]
      })),
      unlockedPlots: ['plot-1'],
    }
    delete (legacy as Partial<typeof legacy>).beds
    delete (legacy as Partial<typeof legacy>).bedInventory

    const state = migratePersistedState(legacy, 1, 4_000)

    expect(state.beds).toEqual(current.beds)
    expect(state.bedInventory).toBe(0)
    expect(state.unlockedPlots).toEqual(['bed-1'])
    expect(state.tiles).toEqual(expect.objectContaining({
      'bed-1-0': expect.objectContaining({ id: 'bed-1-0', plotId: 'bed-1', index: 0, status: 'prepared' }),
      'bed-1-3': expect.objectContaining({ id: 'bed-1-3', plotId: 'bed-1', index: 3 }),
    }))
    expect(Object.keys(state.tiles)).toHaveLength(4)
  })
})
