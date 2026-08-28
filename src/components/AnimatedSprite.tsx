import { useEffect, useState, type CSSProperties } from 'react'

import type { SpriteSheet } from '../assets/manifest'
import '../styles/game.css'

export interface AnimatedSpriteProps {
  readonly sheet: SpriteSheet
  readonly playing?: boolean
  readonly onComplete?: () => void
  readonly className?: string
}

type SpriteStyle = CSSProperties & Record<`--${string}`, string>

function motionIsReduced() {
  return typeof globalThis.matchMedia === 'function'
    && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function AnimatedSprite({ sheet, playing = true, onComplete, className }: AnimatedSpriteProps) {
  const [reducedMotion, setReducedMotion] = useState(motionIsReduced)
  const animationEnabled = playing && !reducedMotion

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = globalThis.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = (event: MediaQueryListEvent) => setReducedMotion(event.matches)

    setReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    if (!animationEnabled || sheet.loop || !onComplete) {
      return undefined
    }

    const completionTimer = window.setTimeout(onComplete, sheet.durationMs)
    return () => window.clearTimeout(completionTimer)
  }, [animationEnabled, onComplete, sheet.durationMs, sheet.loop])

  const style: SpriteStyle = {
    '--frames': String(sheet.frames),
    '--frame-width': `${sheet.frameWidth}px`,
    '--frame-height': `${sheet.frameHeight}px`,
    '--duration': `${sheet.durationMs}ms`,
    width: `${sheet.frameWidth}px`,
    height: `${sheet.frameHeight}px`,
    backgroundImage: `url(${sheet.src})`,
    animationIterationCount: sheet.loop ? 'infinite' : 1,
    ...(animationEnabled ? {} : { animation: 'none', backgroundPositionX: '0px' }),
  }

  return (
    <span
      className={['sprite-sheet', className].filter(Boolean).join(' ')}
      data-testid="animated-sprite"
      style={style}
    />
  )
}
