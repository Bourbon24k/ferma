import { describe, expect, it } from 'vitest'

import { CROP_SHEETS, EFFECT_SHEETS } from './manifest'

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
})
