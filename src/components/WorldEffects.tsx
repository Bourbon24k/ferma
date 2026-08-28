import { useCallback } from 'react'

import { EFFECT_SHEETS } from '../assets/manifest'
import type { BoardPosition } from '../types/game'
import { AnimatedSprite } from './AnimatedSprite'

export type TileEffectKind = 'dirt' | 'plant' | 'water' | 'harvest'

export interface TileEffect {
  readonly id: number
  readonly kind: TileEffectKind
  readonly position: BoardPosition
  readonly tileId: string
}

interface WorldEffectsProps {
  readonly effects: readonly TileEffect[]
  readonly onEffectComplete: (effect: TileEffect) => void
}

function OneShotEffect({ effect, onComplete }: { effect: TileEffect; onComplete: (effect: TileEffect) => void }) {
  const complete = useCallback(() => onComplete(effect), [effect, onComplete])

  return (
    <span
      className={`world-effect world-effect--${effect.kind}`}
      style={{
        gridColumn: effect.position.column + 1,
        gridRow: effect.position.row + 1,
      }}
    >
      <AnimatedSprite onComplete={complete} sheet={EFFECT_SHEETS[effect.kind]} />
    </span>
  )
}

export function WorldEffects({ effects, onEffectComplete }: WorldEffectsProps) {
  return (
    <div aria-hidden="true" className="world-effects">
      <span className="world-effect world-effect--smoke">
        <AnimatedSprite sheet={EFFECT_SHEETS.smoke} />
      </span>
      <span className="world-effect world-effect--butterfly">
        <AnimatedSprite sheet={EFFECT_SHEETS.butterfly} />
      </span>
      <span className="world-effect world-effect--sparkle">
        <AnimatedSprite sheet={EFFECT_SHEETS.sparkle} />
      </span>
      {effects.map((effect) => (
        <OneShotEffect effect={effect} key={effect.id} onComplete={onEffectComplete} />
      ))}
    </div>
  )
}
