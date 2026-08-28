import { WORLD_SHEETS } from '../assets/manifest'
import { BED_FOOTPRINT } from '../data/farmLayout'
import type { FarmBedState, FarmTileState } from '../types/game'
import { AnimatedSprite } from './AnimatedSprite'
import { PlantSprite } from './PlantSprite'

interface FarmBedProps {
  readonly bed: FarmBedState
  readonly tiles: Record<string, FarmTileState>
  readonly now: number
  readonly buildMode: boolean
  readonly moving: boolean
  readonly onTileAction: (tileId: string) => void
  readonly onMove: (bedId: string) => void
  readonly onStore: (bedId: string) => void
}

export function FarmBed({
  bed,
  tiles,
  now,
  buildMode,
  moving,
  onTileAction,
  onMove,
  onStore,
}: FarmBedProps) {
  return (
    <section
      aria-label={`Грядка ${bed.id}`}
      className={`farm-bed${moving ? ' farm-bed--moving' : ''}`}
      data-bed-id={bed.id}
      style={{
        gridColumn: `${bed.position.column + 1} / span ${BED_FOOTPRINT}`,
        gridRow: `${bed.position.row + 1} / span ${BED_FOOTPRINT}`,
      }}
    >
      <span aria-hidden="true" className="farm-bed__soil">
        <AnimatedSprite sheet={WORLD_SHEETS.bedSoil} />
      </span>

      <div className="farm-bed__tiles">
        {bed.tileIds.map((tileId, index) => {
          const tile = tiles[tileId]
          if (!tile) return null

          return (
            <button
              aria-label={`Клетка ${index + 1}, ${tile.status}`}
              className={`farm-tile farm-tile--${tile.status}`}
              disabled={buildMode}
              key={tileId}
              onClick={() => onTileAction(tileId)}
              type="button"
            >
              <PlantSprite now={now} tile={tile} />
            </button>
          )
        })}
      </div>

      {buildMode && (
        <div className="farm-bed__controls">
          <button
            aria-pressed={moving}
            onClick={() => onMove(bed.id)}
            type="button"
          >
            {moving ? 'Выберите место' : 'Переместить'}
          </button>
          <button onClick={() => onStore(bed.id)} type="button">Убрать</button>
        </div>
      )}
    </section>
  )
}
