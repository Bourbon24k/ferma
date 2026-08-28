import { describe, expect, it } from 'vitest'

import { CROP_SHEETS, EFFECT_SHEETS, WORLD_SHEETS } from './manifest'

describe('animated game asset manifest', () => {
  it('defines four equally sized frames for every crop stage', () => {
    for (const stages of Object.values(CROP_SHEETS)) {
      for (const sheet of stages) {
        expect(sheet.frames).toBe(4)
        expect(sheet.frameWidth).toBe(64)
        expect(sheet.frameHeight).toBe(64)
      }
    }

    expect(EFFECT_SHEETS.smoke.frames).toBe(6)
  })

  it('uses the generated full-frame world animations', () => {
    expect(WORLD_SHEETS.bedSoil).toMatchObject({ frames: 4, frameWidth: 128, frameHeight: 128 })
    expect(WORLD_SHEETS.bedSoil.src).toContain('bed-soil-generated-sheet.png')
    expect(EFFECT_SHEETS.butterfly).toMatchObject({ frames: 6, frameWidth: 64, frameHeight: 64 })
    expect(EFFECT_SHEETS.butterfly.src).toContain('butterfly-generated-sheet.png')
    expect(EFFECT_SHEETS.smoke.src).toContain('smoke-generated-sheet.png')
  })
})
