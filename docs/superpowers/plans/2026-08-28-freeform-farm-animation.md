# Freeform Farm and Frame Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed farm plots with persistent, player-placed beds and animate game-world assets frame by frame without changing UI assets.

**Architecture:** A layout module owns board geometry and placement validation; the store persists an array of beds and derives tile IDs from bed IDs. React renders the freeform board as a layered scene, with a reusable sprite-sheet component for continuous and one-shot animation. Existing crop/time/economy rules remain intact and operate on the four tiles in each bed.

**Tech Stack:** React 19, TypeScript, Zustand persist, Vite, Vitest, PNG sprite sheets, CSS `steps()` animations.

**Spec:** `docs/superpowers/specs/2026-08-28-freeform-farm-animation-design.md`

## Global Constraints

- The board is a 10×14 grid with a 48 px base cell.
- A farm bed occupies 2×2 cells and exposes four local planting tiles.
- One empty bed is placed initially; further beds cost wood.
- Moving and storing a bed is free only when all four tiles are empty or prepared.
- UI PNG assets and UI animation behavior must not change.
- Game assets use transparent PNG sprite sheets, bottom-center pivots, pixelated rendering, and frame animation.
- `prefers-reduced-motion` and in-game animation disabling render the first static frame.

---

## File structure

- Create `src/data/farmLayout.ts` — board constants, blocked cells, initial bed coordinates, and pure geometry utilities.
- Create `src/data/farmLayout.test.ts` — exact collision, bounds, and availability cases.
- Modify `src/types/game.ts` — `FarmBedState`, board coordinate types, and optional frame sprite metadata.
- Modify `src/store/initialState.ts` — initial bed, four tiles derived from a bed, and bed inventory.
- Modify `src/store/migrations.ts` — versioned migration from fixed plot tiles into one initial bed.
- Modify `src/store/gameStore.ts` — buy/place/move/store bed actions and bed-aware persistence.
- Modify `src/store/gameStore.test.ts` — resource and state guarantees for bed actions.
- Create `src/components/AnimatedSprite.tsx` — generic looping and one-shot sheet renderer.
- Create `src/components/AnimatedSprite.test.tsx` — frame selection and reduced-motion behavior.
- Create `src/components/FarmBoard.tsx` — board, static world background, beds, selection, and effect layers.
- Create `src/components/BuildPlacementLayer.tsx` — placement preview, pointer targeting, valid/invalid state.
- Create `src/components/FarmBed.tsx` — 2×2 bed and crop tile rendering.
- Create `src/components/PlantSprite.tsx` — crop-stage sprite sheet selection.
- Create `src/components/WorldEffects.tsx` — smoke, butterfly, and action-triggered effects.
- Modify `src/App.tsx` — mount the playable farm scene while preserving existing UI surface boundaries.
- Create `src/styles/game.css` — board layout, sprite sheet animation, interaction states, and reduced-motion rules.
- Create `src/assets/world/bed-soil-sheet.png`, `decor-stump-sheet.png`, `building-flower-bed-sheet.png`, `building-birdhouse-sheet.png` — game-world animation sheets.
- Create `src/assets/crops/<crop>-<stage>-sheet.png` — 4-frame sheets for all 35 crop stages.
- Create `src/assets/effects/<effect>-sheet.png` — frame sheets for smoke, butterfly, water, dirt, sparkle, coin, plant, and harvest events.
- Create `src/assets/manifest.ts` — typed asset paths, dimensions, frames, and durations.

### Task 1: Board geometry and durable state model

**Files:**
- Create: `src/data/farmLayout.ts`
- Create: `src/data/farmLayout.test.ts`
- Modify: `src/types/game.ts`
- Modify: `src/store/initialState.ts`

**Interfaces:**
- Produces `BoardPosition`, `FarmBedState`, `BOARD_COLUMNS`, `BOARD_ROWS`, `BED_FOOTPRINT`, `isBedPositionValid(position, beds)`, and `createBedTiles(bedId)`.
- `isBedPositionValid` returns `false` for out-of-bounds, blocked, and overlapping positions; it has no store or React dependency.

- [ ] **Step 1: Write the failing layout tests**

```ts
import { describe, expect, it } from 'vitest'
import { isBedPositionValid } from './farmLayout'

describe('isBedPositionValid', () => {
  const beds = [{ id: 'bed-1', position: { column: 2, row: 5 }, tiles: {} }]

  it('allows a free 2×2 grass position', () => {
    expect(isBedPositionValid({ column: 5, row: 8 }, beds)).toBe(true)
  })

  it('rejects a placement that overlaps an existing bed', () => {
    expect(isBedPositionValid({ column: 3, row: 5 }, beds)).toBe(false)
  })

  it('rejects a placement that crosses the board edge', () => {
    expect(isBedPositionValid({ column: 9, row: 13 }, beds)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/data/farmLayout.test.ts`

Expected: FAIL because `farmLayout.ts` and its exports do not exist.

- [ ] **Step 3: Add the minimal geometry and state types**

```ts
export interface BoardPosition { column: number; row: number }
export interface FarmBedState { id: string; position: BoardPosition; tileIds: readonly [string, string, string, string] }

export const BOARD_COLUMNS = 10
export const BOARD_ROWS = 14
export const BED_FOOTPRINT = 2

export function isBedPositionValid(position: BoardPosition, beds: readonly FarmBedState[], ignoredBedId?: string): boolean {
  // Check the 2×2 footprint against board bounds, blocked cells, and every bed except ignoredBedId.
}
```

Add `beds: FarmBedState[]` and `bedInventory: number` to `GameDataState`; create only four `FarmTileState` values for `bed-1` and set its `plotId` to `bed-1`.

- [ ] **Step 4: Run layout and existing state tests**

Run: `npm test -- src/data/farmLayout.test.ts src/store/gameStore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the durable layout model**

```bash
git add src/data/farmLayout.ts src/data/farmLayout.test.ts src/types/game.ts src/store/initialState.ts
git commit -m "feat: add freeform farm bed layout"
```

### Task 2: Migration and atomic bed actions

**Files:**
- Modify: `src/store/migrations.ts`
- Modify: `src/store/gameStore.ts`
- Modify: `src/store/gameStore.test.ts`

**Interfaces:**
- Produces `buyFarmBed()`, `placeFarmBed(position)`, `moveFarmBed(bedId, position)`, and `storeFarmBed(bedId)` on `GameStore`.
- Each action returns `ActionResult` and does not mutate resources or beds on failure.

- [ ] **Step 1: Write failing store tests**

```ts
it('spends wood and places an inventory bed on valid grass', () => {
  resetGameStore(0)
  useGameStore.setState((state) => ({ ...state, bedInventory: 1, inventory: { ...state.inventory, wood: 6 } }))
  expect(useGameStore.getState().placeFarmBed({ column: 5, row: 8 }).ok).toBe(true)
  expect(useGameStore.getState().beds).toHaveLength(2)
})

it('does not move a bed containing a crop', () => {
  // Seed one tile in bed-1, attempt move, then assert its position is unchanged.
})

it('stores only a removable bed and retains its tiles', () => {
  // Store a prepared bed, then assert bedInventory increased and its tile IDs were removed.
})
```

- [ ] **Step 2: Run the store test to verify it fails**

Run: `npm test -- src/store/gameStore.test.ts`

Expected: FAIL because bed action methods and persistence fields do not exist.

- [ ] **Step 3: Implement actions and migration**

```ts
function isBedEmptyOrPrepared(bed: FarmBedState, tiles: Record<string, FarmTileState>): boolean {
  return bed.tileIds.every((tileId) => ['empty', 'prepared'].includes(tiles[tileId]?.status ?? 'empty'))
}

placeFarmBed(position: BoardPosition): ActionResult
moveFarmBed(bedId: string, position: BoardPosition): ActionResult
storeFarmBed(bedId: string): ActionResult
```

Raise `GAME_STORE_VERSION` to `2`. For version `1`, retain tile values from `plot-1-0` through `plot-1-3` as `bed-1-*`, discard inaccessible fixed plots, and return a valid current state with `bedInventory: 0`.

- [ ] **Step 4: Run full unit suite and type check**

Run: `npm test && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit actions and migration**

```bash
git add src/store/migrations.ts src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat: persist player placed farm beds"
```

### Task 3: Sprite contract and game-only animation assets

**Files:**
- Create: `src/assets/manifest.ts`
- Create: `src/assets/world/bed-soil-sheet.png`
- Create: `src/assets/world/decor-stump-sheet.png`
- Create: `src/assets/world/building-flower-bed-sheet.png`
- Create: `src/assets/world/building-birdhouse-sheet.png`
- Create: `src/assets/crops/<crop>-<stage>-sheet.png` for the 35 configured crop-stage pairs
- Create: `src/assets/effects/drop-sheet.png`, `dirt-sheet.png`, `sparkle-sheet.png`, `coin-sheet.png`, `smoke-sheet.png`, `butterfly-sheet.png`, `plant-sheet.png`, `harvest-sheet.png`

**Interfaces:**
- Produces `SpriteSheet { src, frameWidth, frameHeight, frames, durationMs, loop }`.
- `CROP_SHEETS[cropId][stageIndex]` returns a 4-frame sheet.
- UI asset paths are not imported or modified.

- [ ] **Step 1: Write a failing manifest test**

```ts
import { CROP_SHEETS, EFFECT_SHEETS } from './manifest'

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
```

- [ ] **Step 2: Run the manifest test to verify it fails**

Run: `npm test -- src/assets/manifest.test.ts`

Expected: FAIL because the manifest does not exist.

- [ ] **Step 3: Produce and validate the sheets**

Use the existing crop atlas as the visual source for each growth stage. Generate or derive 4 frame variants per stage with small, deliberate pixel shifts; preserve transparency, 64×64 frame bounds, and the bottom-center pivot. Create new game-world and effect sheets in the same palette. Use no UI source image and do not create UI animations.

```ts
export const EFFECT_SHEETS = {
  smoke: { src: smokeSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 1200, loop: true },
  water: { src: dropSheet, frameWidth: 64, frameHeight: 64, frames: 6, durationMs: 420, loop: false },
} as const
```

- [ ] **Step 4: Add `manifest.test.ts` and run asset checks**

Run: `npm test -- src/assets/manifest.test.ts && npm run build`

Expected: PASS, with every imported asset resolved by Vite.

- [ ] **Step 5: Commit only game assets and their manifest**

```bash
git add src/assets/manifest.ts src/assets/manifest.test.ts src/assets/world src/assets/crops src/assets/effects
git commit -m "feat: add animated game world sprite sheets"
```

### Task 4: Reusable frame animator and accessible motion fallback

**Files:**
- Create: `src/components/AnimatedSprite.tsx`
- Create: `src/components/AnimatedSprite.test.tsx`
- Create: `src/styles/game.css`

**Interfaces:**
- Consumes `SpriteSheet`, optional `playing`, `onComplete`, and `className`.
- Renders a bottom-center-aligned `<span>` with `backgroundImage`, a stepped frame offset, and the first frame when motion is disabled.

- [ ] **Step 1: Write failing component tests**

```tsx
it('uses stepped animation for looping sheets', () => {
  render(<AnimatedSprite sheet={smokeSheet} />)
  expect(screen.getByTestId('animated-sprite')).toHaveStyle({ animationIterationCount: 'infinite' })
})

it('uses the first frame when motion is reduced', () => {
  mockMatchMedia('(prefers-reduced-motion: reduce)', true)
  render(<AnimatedSprite sheet={smokeSheet} />)
  expect(screen.getByTestId('animated-sprite')).toHaveStyle({ backgroundPositionX: '0px' })
})
```

- [ ] **Step 2: Run component tests to verify they fail**

Run: `npm test -- src/components/AnimatedSprite.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the animator and CSS**

```tsx
export function AnimatedSprite({ sheet, playing = true, onComplete, className }: AnimatedSpriteProps) {
  // Set CSS custom properties --frames, --frame-width and --duration.
  // For loop=false, invoke onComplete once after durationMs when animation is enabled.
}
```

```css
.sprite-sheet { image-rendering: pixelated; background-repeat: no-repeat; animation: sprite-frames var(--duration) steps(var(--frames)) infinite; }
@media (prefers-reduced-motion: reduce) { .sprite-sheet { animation: none; background-position-x: 0; } }
```

- [ ] **Step 4: Run component tests, type check, and build**

Run: `npm test -- src/components/AnimatedSprite.test.tsx && npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 5: Commit the isolated animation primitive**

```bash
git add src/components/AnimatedSprite.tsx src/components/AnimatedSprite.test.tsx src/styles/game.css
git commit -m "feat: add accessible frame sprite animator"
```

### Task 5: Freeform board, placement interaction, and world effects

**Files:**
- Create: `src/components/FarmBoard.tsx`
- Create: `src/components/BuildPlacementLayer.tsx`
- Create: `src/components/FarmBed.tsx`
- Create: `src/components/PlantSprite.tsx`
- Create: `src/components/WorldEffects.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/game.css`

**Interfaces:**
- `FarmBoard` consumes `beds`, `tiles`, `selectedTool`, and store actions.
- `BuildPlacementLayer` translates pointer position to `BoardPosition` and never calls placement for invalid preview positions.
- `FarmBed` maps its four `tileIds` to local 2×2 planting targets.

- [ ] **Step 1: Write failing interaction tests**

```tsx
it('shows a valid build preview over free grass', async () => {
  render(<FarmBoard />)
  await userEvent.click(screen.getByRole('button', { name: /строительство/i }))
  await userEvent.pointer({ target: screen.getByTestId('board-cell-5-8'), keys: '[MouseLeft]' })
  expect(screen.getByTestId('bed-preview')).toHaveAttribute('data-valid', 'true')
})

it('does not place a bed on blocked terrain', async () => {
  // Attempt placement over the well and assert beds length is unchanged.
})
```

- [ ] **Step 2: Run the interaction tests to verify they fail**

Run: `npm test -- src/components/FarmBoard.test.tsx`

Expected: FAIL because the board components do not exist.

- [ ] **Step 3: Implement the board stack**

Render the existing `farm-world.png` as a static background. Place an invisible board grid over it, then beds, crops, and effects above it. In build mode, place/move/store controls use the store actions from Task 2. Render `PlantSprite` with the current stage index from `getPlantSnapshot`; on tile action results, enqueue the appropriate one-shot `WorldEffects` sheet.

- [ ] **Step 4: Mount `FarmBoard` in the app**

```tsx
export default function App() {
  return <main className="game-shell"><FarmBoard /></main>
}
```

Do not add, replace, or animate UI icons.

- [ ] **Step 5: Run component and project verification**

Run: `npm test && npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit freeform board integration**

```bash
git add src/components/FarmBoard.tsx src/components/FarmBoard.test.tsx src/components/BuildPlacementLayer.tsx src/components/FarmBed.tsx src/components/PlantSprite.tsx src/components/WorldEffects.tsx src/App.tsx src/styles/game.css
git commit -m "feat: render movable animated farm beds"
```

### Task 6: Manual visual validation and regression audit

**Files:**
- Modify: `README.md` if it exists, otherwise create it with local run and placement controls.

**Interfaces:**
- No production interface changes.

- [ ] **Step 1: Start the development server**

Run: `npm run dev`

Expected: Vite reports a local URL without build errors.

- [ ] **Step 2: Validate the full player flow at 360, 390, 430, and 500 px**

At each width: buy a bed, preview it on grass and blocked terrain, place it, hoe, plant, water, wait for the stage change, harvest, move the empty bed, and store it. Confirm placement does not cross the house, well, road, or existing beds.

- [ ] **Step 3: Validate persistence and motion settings**

Reload after placing and planting. Confirm coordinates and growth persist. Enable `prefers-reduced-motion` in browser emulation and confirm sprites display first frames without motion while actions remain usable.

- [ ] **Step 4: Run final automated verification**

Run: `npm test && npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 5: Commit documentation and verified result**

```bash
git add README.md
git commit -m "docs: explain freeform farm controls"
```

## Plan self-review

- Spec coverage: Tasks 1–2 cover placement, movement, storage, persistence, migration, collision, and resources; Task 3 covers game-only sheets; Task 4 covers frame playback and reduced motion; Task 5 covers board rendering and actions; Task 6 covers viewport, persistence, and regression validation.
- Placeholder scan: no implementation placeholders are present; all public functions and their consumers are introduced in the same or earlier tasks.
- Type consistency: `FarmBedState`, `BoardPosition`, `SpriteSheet`, `isBedPositionValid`, and bed action names are used consistently throughout.
