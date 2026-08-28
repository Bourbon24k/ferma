import { describe, expect, it } from 'vitest'

import { createBedTiles, isBedPositionValid } from './farmLayout'
import { createInitialState } from '../store/initialState'

describe('isBedPositionValid', () => {
  const beds = [{ id: 'bed-1', position: { column: 2, row: 5 }, tileIds: ['bed-1-0', 'bed-1-1', 'bed-1-2', 'bed-1-3'] as const }]

  it('allows a free 2×2 grass position', () => {
    expect(isBedPositionValid({ column: 5, row: 8 }, beds)).toBe(true)
  })

  it('rejects a placement that overlaps an existing bed', () => {
    expect(isBedPositionValid({ column: 3, row: 5 }, beds)).toBe(false)
  })

  it('rejects a placement that crosses the board edge', () => {
    expect(isBedPositionValid({ column: 9, row: 13 }, beds)).toBe(false)
  })

  it('rejects a placement that covers blocked terrain', () => {
    expect(isBedPositionValid({ column: 0, row: 0 }, beds)).toBe(false)
  })

  it('ignores the bed being moved when checking a position', () => {
    expect(isBedPositionValid({ column: 2, row: 5 }, beds, 'bed-1')).toBe(true)
  })
})

describe('createBedTiles', () => {
  it('creates the four empty local tiles for a bed', () => {
    expect(createBedTiles('bed-1')).toEqual({
      'bed-1-0': { id: 'bed-1-0', plotId: 'bed-1', index: 0, status: 'empty' },
      'bed-1-1': { id: 'bed-1-1', plotId: 'bed-1', index: 1, status: 'empty' },
      'bed-1-2': { id: 'bed-1-2', plotId: 'bed-1', index: 2, status: 'empty' },
      'bed-1-3': { id: 'bed-1-3', plotId: 'bed-1', index: 3, status: 'empty' },
    })
  })
})

describe('initial farm layout', () => {
  it('starts with one empty four-tile bed and no stored beds', () => {
    const state = createInitialState(1_000)

    expect(state.beds).toEqual([
      { id: 'bed-1', position: { column: 2, row: 5 }, tileIds: ['bed-1-0', 'bed-1-1', 'bed-1-2', 'bed-1-3'] },
    ])
    expect(state.bedInventory).toBe(0)
    expect(state.tiles).toEqual(createBedTiles('bed-1'))
  })
})
