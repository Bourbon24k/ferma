/// <reference types="vite/client" />

import type { CropId } from '../types/game'

import carrot0 from './crops/carrot-0-sheet.png'
import carrot1 from './crops/carrot-1-sheet.png'
import carrot2 from './crops/carrot-2-sheet.png'
import carrot3 from './crops/carrot-3-sheet.png'
import carrot4 from './crops/carrot-4-sheet.png'
import potato0 from './crops/potato-0-sheet.png'
import potato1 from './crops/potato-1-sheet.png'
import potato2 from './crops/potato-2-sheet.png'
import potato3 from './crops/potato-3-sheet.png'
import potato4 from './crops/potato-4-sheet.png'
import wheat0 from './crops/wheat-0-sheet.png'
import wheat1 from './crops/wheat-1-sheet.png'
import wheat2 from './crops/wheat-2-sheet.png'
import wheat3 from './crops/wheat-3-sheet.png'
import wheat4 from './crops/wheat-4-sheet.png'
import strawberry0 from './crops/strawberry-0-sheet.png'
import strawberry1 from './crops/strawberry-1-sheet.png'
import strawberry2 from './crops/strawberry-2-sheet.png'
import strawberry3 from './crops/strawberry-3-sheet.png'
import strawberry4 from './crops/strawberry-4-sheet.png'
import tomato0 from './crops/tomato-0-sheet.png'
import tomato1 from './crops/tomato-1-sheet.png'
import tomato2 from './crops/tomato-2-sheet.png'
import tomato3 from './crops/tomato-3-sheet.png'
import tomato4 from './crops/tomato-4-sheet.png'
import corn0 from './crops/corn-0-sheet.png'
import corn1 from './crops/corn-1-sheet.png'
import corn2 from './crops/corn-2-sheet.png'
import corn3 from './crops/corn-3-sheet.png'
import corn4 from './crops/corn-4-sheet.png'
import pumpkin0 from './crops/pumpkin-0-sheet.png'
import pumpkin1 from './crops/pumpkin-1-sheet.png'
import pumpkin2 from './crops/pumpkin-2-sheet.png'
import pumpkin3 from './crops/pumpkin-3-sheet.png'
import pumpkin4 from './crops/pumpkin-4-sheet.png'
import dropSheet from './effects/drop-sheet.png'
import dirtSheet from './effects/dirt-sheet.png'
import sparkleSheet from './effects/sparkle-sheet.png'
import coinSheet from './effects/coin-sheet.png'
import smokeSheet from './effects/smoke-sheet.png'
import butterflySheet from './effects/butterfly-sheet.png'
import plantSheet from './effects/plant-sheet.png'
import harvestSheet from './effects/harvest-sheet.png'
import bedSoilSheet from './world/bed-soil-sheet.png'
import stumpSheet from './world/decor-stump-sheet.png'
import flowerBedSheet from './world/building-flower-bed-sheet.png'
import birdhouseSheet from './world/building-birdhouse-sheet.png'

export interface SpriteSheet {
  readonly src: string
  readonly frameWidth: number
  readonly frameHeight: number
  readonly frames: number
  readonly durationMs: number
  readonly loop: boolean
}

const cropSheet = (src: string): SpriteSheet => ({ src, frameWidth: 64, frameHeight: 64, frames: 4, durationMs: 720, loop: true })

export const CROP_SHEETS: Record<CropId, readonly [SpriteSheet, SpriteSheet, SpriteSheet, SpriteSheet, SpriteSheet]> = {
  carrot: [cropSheet(carrot0), cropSheet(carrot1), cropSheet(carrot2), cropSheet(carrot3), cropSheet(carrot4)],
  potato: [cropSheet(potato0), cropSheet(potato1), cropSheet(potato2), cropSheet(potato3), cropSheet(potato4)],
  wheat: [cropSheet(wheat0), cropSheet(wheat1), cropSheet(wheat2), cropSheet(wheat3), cropSheet(wheat4)],
  strawberry: [cropSheet(strawberry0), cropSheet(strawberry1), cropSheet(strawberry2), cropSheet(strawberry3), cropSheet(strawberry4)],
  tomato: [cropSheet(tomato0), cropSheet(tomato1), cropSheet(tomato2), cropSheet(tomato3), cropSheet(tomato4)],
  corn: [cropSheet(corn0), cropSheet(corn1), cropSheet(corn2), cropSheet(corn3), cropSheet(corn4)],
  pumpkin: [cropSheet(pumpkin0), cropSheet(pumpkin1), cropSheet(pumpkin2), cropSheet(pumpkin3), cropSheet(pumpkin4)],
}

export const WORLD_SHEETS = {
  bedSoil: { src: bedSoilSheet, frameWidth: 64, frameHeight: 64, frames: 4, durationMs: 960, loop: true },
  stump: { src: stumpSheet, frameWidth: 64, frameHeight: 64, frames: 4, durationMs: 960, loop: true },
  flowerBed: { src: flowerBedSheet, frameWidth: 64, frameHeight: 64, frames: 4, durationMs: 840, loop: true },
  birdhouse: { src: birdhouseSheet, frameWidth: 64, frameHeight: 64, frames: 4, durationMs: 840, loop: true },
} as const satisfies Record<string, SpriteSheet>

export const EFFECT_SHEETS = {
  water: { src: dropSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 420, loop: false },
  drop: { src: dropSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 420, loop: false },
  dirt: { src: dirtSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 540, loop: false },
  sparkle: { src: sparkleSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 540, loop: true },
  coin: { src: coinSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 600, loop: false },
  smoke: { src: smokeSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 1200, loop: true },
  butterfly: { src: butterflySheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 900, loop: true },
  plant: { src: plantSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 640, loop: false },
  harvest: { src: harvestSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 560, loop: false },
} as const satisfies Record<string, SpriteSheet>
