import type { BoardPosition, FarmBedState, FarmTileState } from '../types/game'

export const BOARD_COLUMNS = 10
export const BOARD_ROWS = 14
export const BOARD_CELL_SIZE = 48
export const BED_FOOTPRINT = 2

export const BLOCKED_BOARD_CELLS: readonly BoardPosition[] = [
  { column: 0, row: 0 },
  { column: 1, row: 0 },
  { column: 2, row: 0 },
  { column: 3, row: 0 },
  { column: 4, row: 0 },
  { column: 5, row: 0 },
  { column: 6, row: 0 },
  { column: 7, row: 0 },
  { column: 8, row: 0 },
  { column: 9, row: 0 },
]

function positionsOverlap(first: BoardPosition, second: BoardPosition): boolean {
  return first.column < second.column + BED_FOOTPRINT
    && first.column + BED_FOOTPRINT > second.column
    && first.row < second.row + BED_FOOTPRINT
    && first.row + BED_FOOTPRINT > second.row
}

function isBlocked(position: BoardPosition): boolean {
  return BLOCKED_BOARD_CELLS.some((blocked) => blocked.column === position.column && blocked.row === position.row)
}

export function isBedPositionValid(position: BoardPosition, beds: readonly FarmBedState[], ignoredBedId?: string): boolean {
  if (position.column < 0 || position.row < 0
    || position.column + BED_FOOTPRINT > BOARD_COLUMNS
    || position.row + BED_FOOTPRINT > BOARD_ROWS) {
    return false
  }

  for (let column = position.column; column < position.column + BED_FOOTPRINT; column += 1) {
    for (let row = position.row; row < position.row + BED_FOOTPRINT; row += 1) {
      if (isBlocked({ column, row })) return false
    }
  }

  return beds.every((bed) => bed.id === ignoredBedId || !positionsOverlap(position, bed.position))
}

export function createBedTiles(bedId: string): Record<string, FarmTileState> {
  return Object.fromEntries(
    Array.from({ length: BED_FOOTPRINT ** 2 }, (_, index) => {
      const id = `${bedId}-${index}`
      return [id, { id, plotId: bedId, index, status: 'empty' }]
    }),
  )
}
