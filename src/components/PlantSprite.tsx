import { CROP_SHEETS } from '../assets/manifest'
import { CROPS } from '../data/crops'
import { getPlantSnapshot } from '../game/time'
import type { FarmTileState } from '../types/game'
import { AnimatedSprite } from './AnimatedSprite'

interface PlantSpriteProps {
  readonly tile: FarmTileState
  readonly now: number
}

export function PlantSprite({ tile, now }: PlantSpriteProps) {
  if (!tile.cropId) return null

  const snapshot = getPlantSnapshot(tile, now)
  const crop = CROPS[tile.cropId]
  const sheet = CROP_SHEETS[tile.cropId][snapshot.stageIndex]

  return (
    <span
      aria-label={`${crop.name}, этап ${snapshot.stageIndex + 1} из ${crop.stages.length}`}
      className="plant-sprite"
      data-stage={snapshot.stageIndex}
      role="img"
    >
      <AnimatedSprite sheet={sheet} />
    </span>
  )
}
