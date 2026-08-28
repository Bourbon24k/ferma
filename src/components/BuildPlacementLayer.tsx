import { BOARD_COLUMNS, BOARD_ROWS, BED_FOOTPRINT, isBedPositionValid } from '../data/farmLayout'
import type { BoardPosition, FarmBedState } from '../types/game'

interface BuildPlacementLayerProps {
  readonly active: boolean
  readonly beds: readonly FarmBedState[]
  readonly ignoredBedId?: string
  readonly previewPosition: BoardPosition | null
  readonly onPreviewChange: (position: BoardPosition | null) => void
  readonly onPlace: (position: BoardPosition) => void
}

export function BuildPlacementLayer({
  active,
  beds,
  ignoredBedId,
  previewPosition,
  onPreviewChange,
  onPlace,
}: BuildPlacementLayerProps) {
  const previewValid = previewPosition === null
    ? false
    : isBedPositionValid(previewPosition, beds, ignoredBedId)

  return (
    <div
      aria-hidden={!active}
      className={`build-placement-layer${active ? ' build-placement-layer--active' : ''}`}
      onPointerLeave={() => onPreviewChange(null)}
    >
      {Array.from({ length: BOARD_COLUMNS * BOARD_ROWS }, (_, index) => {
        const position = {
          column: index % BOARD_COLUMNS,
          row: Math.floor(index / BOARD_COLUMNS),
        }
        const valid = isBedPositionValid(position, beds, ignoredBedId)

        return (
          <button
            aria-disabled={!valid}
            aria-label={`Ячейка ${position.column + 1}, ${position.row + 1}${valid ? '' : ', занята'}`}
            className="board-cell"
            data-testid={`board-cell-${position.column}-${position.row}`}
            key={`${position.column}-${position.row}`}
            onClick={() => {
              if (active && valid) onPlace(position)
            }}
            onFocus={() => active && onPreviewChange(position)}
            onPointerEnter={() => active && onPreviewChange(position)}
            style={{
              gridColumn: position.column + 1,
              gridRow: position.row + 1,
            }}
            tabIndex={active ? 0 : -1}
            type="button"
          />
        )
      })}

      {active && previewPosition && (
        <div
          aria-label={previewValid ? 'Можно поставить грядку' : 'Здесь нельзя поставить грядку'}
          className="bed-preview"
          data-testid="bed-preview"
          data-valid={String(previewValid)}
          style={{
            gridColumn: `${previewPosition.column + 1} / span ${BED_FOOTPRINT}`,
            gridRow: `${previewPosition.row + 1} / span ${BED_FOOTPRINT}`,
          }}
        />
      )}
    </div>
  )
}
