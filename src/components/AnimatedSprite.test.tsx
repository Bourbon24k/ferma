import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SpriteSheet } from '../assets/manifest'
import { AnimatedSprite } from './AnimatedSprite'

const smokeSheet: SpriteSheet = {
  src: '/smoke-sheet.png',
  frameWidth: 64,
  frameHeight: 64,
  frames: 6,
  durationMs: 1200,
  loop: true,
}

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AnimatedSprite', () => {
  it('uses stepped animation for looping sheets', () => {
    const markup = renderToStaticMarkup(<AnimatedSprite sheet={smokeSheet} />)

    expect(markup).toContain('animation-iteration-count:infinite')
    expect(markup).toContain('--frames:6')
    expect(markup).toContain('--frame-width:64px')
    expect(markup).toContain('--duration:1200ms')
  })

  it('uses a single stepped animation for one-shot sheets', () => {
    const markup = renderToStaticMarkup(<AnimatedSprite sheet={{ ...smokeSheet, loop: false }} />)

    expect(markup).toContain('animation-iteration-count:1')
  })

  it('uses the first frame when motion is reduced', () => {
    mockMatchMedia(true)

    const markup = renderToStaticMarkup(<AnimatedSprite sheet={smokeSheet} />)

    expect(markup).toContain('animation:none')
    expect(markup).toContain('background-position-x:0px')
  })

  it('uses the first frame when playing is disabled', () => {
    const markup = renderToStaticMarkup(<AnimatedSprite sheet={smokeSheet} playing={false} />)

    expect(markup).toContain('animation:none')
    expect(markup).toContain('background-position-x:0px')
  })
})
