# Telegram Pixel Farm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, persistent, mobile-first pixel-art farming game that runs as a React/Vite browser app and is prepared for Telegram Mini Apps.

**Architecture:** A Zustand store owns serializable player, farm, inventory, quest, tutorial, and settings state. Timestamp-driven pure functions derive growth, water, and energy, while React components render a layered PNG farm scene with DOM-based interactive tiles and panels.

**Tech Stack:** React, Vite, TypeScript, Zustand, Vitest, Testing Library, CSS Modules/global CSS, Telegram Web App browser SDK adapter, Playwright or the in-app Browser.

**Spec:** `docs/superpowers/specs/2026-08-28-telegram-pixel-farm-design.md`

## Global Constraints

- The app must run through Node.js/NPM with React, Vite, and TypeScript.
- Target mobile widths are 360–500 px; desktop must remain convenient for testing.
- Core art must be a coherent original pixel-art PNG set; do not use emoji for game art.
- Persist player, plots, plants, resources, inventory, quests, tutorial, energy, and timestamps in `localStorage`.
- Plant growth and energy restoration must derive from timestamps and continue while the app is closed.
- Every visible action has a working baseline behavior.
- Initial values are 420 coins, 8 wood, 30/30 energy, level 1, and 0 XP.
- The final verification must cover the full buy → prepare → plant → water → grow → harvest → sell loop.

---

## File Map

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html` — project and test setup.
- `src/types/game.ts` — shared domain types.
- `src/data/crops.ts`, `levels.ts`, `quests.ts`, `buildings.ts` — typed game configuration.
- `src/game/time.ts`, `economy.ts`, `farmActions.ts` — pure timestamp and rules logic.
- `src/store/gameStore.ts`, `initialState.ts`, `migrations.ts` — central persistent state.
- `src/components/game/*` — scene, grids, tiles, plants, decorations, effects.
- `src/components/hud/*` — top bar, plant card, tools, navigation, notifications.
- `src/components/panels/*` — seeds, shop, warehouse, quests, build, settings, crop details.
- `src/components/tutorial/*` — contextual tutorial bubble and target pointer.
- `src/telegram/webApp.ts` — Telegram/no-op adapter.
- `src/styles/*` — tokens, layout, animation, and responsive styling.
- `src/assets/*` — accepted concept, world art, crop stages, tools, icons, and effects.
- `src/test/*`, `tests/e2e/*` — unit, component, and full-cycle tests.

---

### Task 1: Project foundation and typed configuration

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `src/main.tsx`, `src/App.tsx`
- Create: `src/types/game.ts`, `src/data/crops.ts`, `src/data/levels.ts`, `src/data/quests.ts`, `src/data/buildings.ts`
- Test: `src/data/config.test.ts`

**Interfaces:**
- Produces: `CropId`, `CropConfig`, `FarmTileState`, `PlayerState`, `InventoryState`, `QuestConfig`, `CROPS`, `LEVELS`, `QUESTS`.

- [ ] **Step 1: Create the Vite/React/TypeScript package and test scripts**

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Write failing configuration tests**

```ts
it('defines seven crops with five unique stages', () => {
  expect(Object.keys(CROPS)).toHaveLength(7)
  for (const crop of Object.values(CROPS)) {
    expect(crop.stages).toHaveLength(5)
    expect(new Set(crop.stages).size).toBe(5)
  }
})
```

- [ ] **Step 3: Run `npm install` and `npm test -- src/data/config.test.ts`**

Expected: the first test run fails because the typed configurations do not exist.

- [ ] **Step 4: Implement exact domain types and configurations**

```ts
export type CropId = 'carrot' | 'potato' | 'wheat' | 'strawberry' | 'tomato' | 'corn' | 'pumpkin'
export type TileStatus = 'empty' | 'prepared' | 'seeded' | 'growing' | 'needsWater' | 'ready' | 'harvested'

export interface CropConfig {
  id: CropId
  name: string
  seedPrice: number
  growTimeMs: number
  waterDurationMs: number
  sellPrice: number
  plantXp: number
  waterXp: number
  harvestXp: number
  unlockLevel: number
  stages: readonly [string, string, string, string, string]
}
```

- [ ] **Step 5: Run `npm test -- src/data/config.test.ts` and `npm run typecheck`**

Expected: both commands pass.

- [ ] **Step 6: Commit foundation**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig*.json src
git commit -m "feat: scaffold typed farm game"
```

### Task 2: Timestamp game rules and persistent Zustand store

**Files:**
- Create: `src/game/time.ts`, `src/game/economy.ts`, `src/game/farmActions.ts`
- Create: `src/store/initialState.ts`, `src/store/migrations.ts`, `src/store/gameStore.ts`
- Test: `src/game/time.test.ts`, `src/store/gameStore.test.ts`

**Interfaces:**
- Consumes: `CropId`, `TileStatus`, `CROPS`, `LEVELS`, `QUESTS`.
- Produces: `getEnergyAt(now, state)`, `getPlantSnapshot(tile, now)`, `useGameStore`, `resetGameStore()`.

- [ ] **Step 1: Write failing timestamp tests**

```ts
expect(getEnergyAt(1_200_000, { energy: 28, energyUpdatedAt: 0, maxEnergy: 30 })).toEqual({ energy: 30, energyUpdatedAt: 1_200_000 })
expect(getPlantSnapshot(tilePlantedHalfwayAgo, now).growthPercent).toBe(50)
expect(getPlantSnapshot(dryTile, now).status).toBe('needsWater')
```

- [ ] **Step 2: Run `npm test -- src/game/time.test.ts`**

Expected: FAIL because timestamp helpers do not exist.

- [ ] **Step 3: Implement deterministic timestamp helpers**

```ts
export const ENERGY_INTERVAL_MS = 5 * 60 * 1000
export function getEnergyAt(now: number, state: EnergyClock): EnergyClock
export function getPlantSnapshot(tile: FarmTile, now: number): PlantSnapshot
export function getStageIndex(growthPercent: number, stageCount: number): number
```

- [ ] **Step 4: Write failing store transition tests**

```ts
store.getState().selectTool('hoe')
store.getState().interactWithTile('plot-1-0', now)
expect(store.getState().player.energy).toBe(29)
expect(store.getState().tiles['plot-1-0'].status).toBe('prepared')
```

- [ ] **Step 5: Implement atomic store actions and persist migration**

```ts
interface GameActions {
  selectTool(tool: ToolId): void
  selectSeed(crop: CropId): void
  interactWithTile(tileId: string, now?: number): ActionResult
  buySeed(crop: CropId, amount?: number): ActionResult
  sellCrop(crop: CropId, amount?: number): ActionResult
  claimQuest(questId: string): ActionResult
  chopObstacle(obstacleId: string): ActionResult
  placeBuilding(buildingId: string): ActionResult
  syncTime(now?: number): void
  resetProgress(): void
}
```

- [ ] **Step 6: Run store tests, typecheck, and commit**

```bash
npm test -- src/game/time.test.ts src/store/gameStore.test.ts
npm run typecheck
git add src/game src/store
git commit -m "feat: add persistent timestamp game engine"
```

### Task 3: Pixel-art concept and asset set

**Files:**
- Create: `src/assets/concept/farm-concept.png`
- Create: `src/assets/world/farm-world.png`, `src/assets/world/farm-world-small.png`
- Create: `src/assets/crops/<crop>-<stage>.png` for 35 crop stages
- Create: `src/assets/ui/*.png`, `src/assets/tools/*.png`, `src/assets/effects/*.png`
- Create: `scripts/verify-assets.mjs`

**Interfaces:**
- Consumes: crop stage paths from `CROPS`.
- Produces: coherent transparent PNG assets and one accepted full-scene concept.

- [ ] **Step 1: Generate a full-scene visual concept from the approved reference direction**

Prompt requirements: vertical cozy forest farm, warm modern pixel art, house and well in the upper scene, four 3×3 field zones, dense original decorations, beige wooden HUD framing, no text baked into the image, no copied characters or logos.

- [ ] **Step 2: Inspect the concept at original resolution**

Acceptance points: 360–500 px readability, four clear plot anchors, foreground controls remain legible when overlaid, no photographic or smooth vector rendering, and no direct copy of the reference.

- [ ] **Step 3: Generate matching transparent sprite sheets and crop them into files**

Required groups: seven crops × five stages, six tools, five navigation icons, coin/wood/energy/XP, water drops, soil particles, butterfly, smoke, lock, house decoration, stump, and placed flower bed.

- [ ] **Step 4: Add an asset verifier**

```js
const required = crops.flatMap(crop => [0, 1, 2, 3, 4].map(stage => `src/assets/crops/${crop}-${stage}.png`))
const missing = required.filter(path => !existsSync(path))
if (missing.length) throw new Error(`Missing assets: ${missing.join(', ')}`)
```

- [ ] **Step 5: Run `node scripts/verify-assets.mjs` and commit**

```bash
git add src/assets scripts/verify-assets.mjs
git commit -m "feat: add original pixel art farm assets"
```

### Task 4: Layered farm scene and responsive HUD

**Files:**
- Create: `src/components/game/GameScene.tsx`, `FarmGrid.tsx`, `FarmTile.tsx`, `Plant.tsx`, `WorldDecor.tsx`
- Create: `src/components/hud/TopBar.tsx`, `PlantInfo.tsx`, `ToolBar.tsx`, `BottomNavigation.tsx`, `GameNotifications.tsx`
- Create: `src/styles/tokens.css`, `src/styles/app.css`, `src/styles/animations.css`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/components/game/GameScene.test.tsx`, `src/components/hud/ToolBar.test.tsx`

**Interfaces:**
- Consumes: `useGameStore`, `CROPS`, generated assets.
- Produces: semantic tool buttons, interactive tiles with `data-tile-id`, responsive scene shell.

- [ ] **Step 1: Write failing component tests**

```tsx
render(<GameScene now={NOW} />)
expect(screen.getAllByRole('button', { name: /грядка/i })).toHaveLength(9)
await user.click(screen.getByRole('button', { name: 'Мотыга' }))
expect(screen.getByRole('button', { name: 'Мотыга' })).toHaveAttribute('aria-pressed', 'true')
```

- [ ] **Step 2: Run `npm test -- src/components`**

Expected: FAIL because scene and HUD components do not exist.

- [ ] **Step 3: Implement the scene shell and CSS tokens**

```css
:root {
  --panel: #f7dfab;
  --panel-deep: #dca958;
  --wood: #5a351b;
  --gold: #ffc629;
  --grass: #4f8c35;
  --shadow-pixel: 0 3px 0 #3e2818, 0 6px 14px rgb(24 35 17 / 35%);
}
.game-shell { width: min(100%, 500px); min-height: 100dvh; margin-inline: auto; }
```

- [ ] **Step 4: Implement accessible tiles, plants, HUD, and notification layer**

Each tile exposes its status and crop in an accessible label, calls `interactWithTile`, and renders the correct stage asset from `getPlantSnapshot`.

- [ ] **Step 5: Run component tests at 360 and 500 CSS pixel layouts, then commit**

```bash
npm test -- src/components
npm run typecheck
git add src/components src/styles src/App.tsx src/main.tsx
git commit -m "feat: render responsive layered farm scene"
```

### Task 5: Seed selection, shop, warehouse, quests, and crop details

**Files:**
- Create: `src/components/panels/PanelShell.tsx`, `SeedInventory.tsx`, `Shop.tsx`, `Warehouse.tsx`, `QuestPanel.tsx`, `PlantDetails.tsx`
- Create: `src/components/panels/Panels.test.tsx`

**Interfaces:**
- Consumes: store actions `buySeed`, `sellCrop`, `claimQuest`, `selectSeed`.
- Produces: `PanelId` navigation and complete transaction UI.

- [ ] **Step 1: Write failing transaction UI tests**

```tsx
await user.click(screen.getByRole('button', { name: 'Купить морковь' }))
expect(screen.getByText('Монеты: 410')).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: 'Продать всю морковь' }))
expect(screen.getByText(/получено монет/i)).toBeInTheDocument()
```

- [ ] **Step 2: Run the panel tests and verify failure**

Run: `npm test -- src/components/panels/Panels.test.tsx`.

- [ ] **Step 3: Implement modal panels with real store actions**

`PanelShell` traps focus, closes on Escape/backdrop, and preserves the selected tile. Locked crops display the exact required level. Quest rewards disable after claim.

- [ ] **Step 4: Run panel tests and commit**

```bash
npm test -- src/components/panels/Panels.test.tsx
git add src/components/panels
git commit -m "feat: add farm economy and quest panels"
```

### Task 6: Tutorial, axe, construction, energy panel, and settings

**Files:**
- Create: `src/components/tutorial/Tutorial.tsx`, `tutorialSteps.ts`
- Create: `src/components/panels/BuildPanel.tsx`, `EnergyPanel.tsx`, `Settings.tsx`
- Modify: `src/components/game/WorldDecor.tsx`, `src/App.tsx`
- Test: `src/components/tutorial/Tutorial.test.tsx`, `src/components/panels/SecondaryActions.test.tsx`

**Interfaces:**
- Consumes: `tutorialStep`, `chopObstacle`, `placeBuilding`, `resetProgress`, settings actions.
- Produces: contextual target overlays and working secondary actions.

- [ ] **Step 1: Write failing tutorial progression tests**

```tsx
expect(screen.getByText('Нажми на грядку, чтобы выбрать её')).toBeVisible()
await completePreparePlantWaterFlow(user)
expect(store.getState().tutorial.completed).toBe(true)
```

- [ ] **Step 2: Implement action-gated tutorial targets and skip/restart controls**

Tutorial transitions listen to successful domain action names, not arbitrary clicks. The pointer is positioned from target element bounds and recalculates on resize.

- [ ] **Step 3: Write and implement secondary action tests**

```ts
expect(chopResult.cost.energy).toBe(2)
expect(store.getState().inventory.wood).toBe(10)
expect(placeResult.ok).toBe(true)
```

- [ ] **Step 4: Run tests, typecheck, and commit**

```bash
npm test -- src/components/tutorial src/components/panels/SecondaryActions.test.tsx
npm run typecheck
git add src/components src/store
git commit -m "feat: add tutorial and secondary farm actions"
```

### Task 7: Telegram adapter, animation polish, and resilience

**Files:**
- Create: `src/telegram/webApp.ts`, `src/telegram/webApp.test.ts`
- Modify: `src/App.tsx`, `src/styles/animations.css`, `src/store/migrations.ts`
- Create: `src/components/ErrorBoundary.tsx`

**Interfaces:**
- Produces: `telegram.ready()`, `telegram.expand()`, `telegram.haptic(kind)`, `telegram.safeArea` with browser-safe defaults.

- [ ] **Step 1: Write adapter fallback tests**

```ts
delete window.Telegram
expect(() => telegram.ready()).not.toThrow()
expect(telegram.safeArea).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
```

- [ ] **Step 2: Implement Telegram/no-op adapter and initialize it in App**

The adapter reads `window.Telegram?.WebApp`, calls `ready()` and `expand()`, and maps safe-area values to CSS custom properties.

- [ ] **Step 3: Add reduced-motion fallbacks, save migration recovery, and error boundary**

Corrupt persisted JSON restores the exact initial state and shows one non-blocking notification. `prefers-reduced-motion: reduce` removes looping decoration motion.

- [ ] **Step 4: Run all unit tests and commit**

```bash
npm test
npm run typecheck
git add src
git commit -m "feat: prepare farm for telegram mini apps"
```

### Task 8: Full-cycle browser QA and visual fidelity

**Files:**
- Create: `tests/e2e/full-cycle.spec.ts`, `playwright.config.ts`
- Create: `README.md`
- Modify: implementation and styles for issues discovered during QA.

**Interfaces:**
- Consumes: the complete application.
- Produces: reproducible full-cycle verification and setup documentation.

- [ ] **Step 1: Write the full-cycle browser test**

```ts
test('buy, prepare, plant, water, harvest, and sell', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Магазин' }).click()
  await page.getByRole('button', { name: 'Купить морковь' }).click()
  await preparePlantWaterAndAdvanceClock(page)
  await page.getByRole('button', { name: /собрать морковь/i }).click()
  await page.getByRole('button', { name: 'Склад' }).click()
  await page.getByRole('button', { name: 'Продать всю морковь' }).click()
  await expect(page.getByText(/получено монет/i)).toBeVisible()
})
```

- [ ] **Step 2: Run `npm run build`, start `npm run dev`, and execute E2E**

Expected: TypeScript, production build, and full-cycle test pass.

- [ ] **Step 3: Capture and inspect native screenshots**

Required viewports: 360×800, 390×844, 430×932, 500×1000, and desktop 1280×900. Compare scene framing, crop clarity, decoration density, panel typography, active tool, plant card, and both bottom bars against the accepted concept.

- [ ] **Step 4: Repair every actionable mismatch and rerun checks**

No clipped primary controls, horizontal overflow, unreadable text, missing assets, inert buttons, placeholder graphics, or mismatched crop stage may remain.

- [ ] **Step 5: Verify persistence manually and through browser state**

Reload once during plant growth and once after selling. Confirm tiles, timestamps, inventory, resources, quest progress, tutorial completion, and settings survive.

- [ ] **Step 6: Write setup and Telegram instructions, then commit**

```bash
git add README.md tests playwright.config.ts src package*.json
git commit -m "test: verify complete pixel farm gameplay"
```

### Task 9: Final verification and GitHub publication

**Files:**
- Modify: only files required by final verification fixes.

**Interfaces:**
- Produces: clean repository state and a pushed default branch.

- [ ] **Step 1: Run fresh final verification**

```bash
npm install
npm test
npm run typecheck
npm run build
node scripts/verify-assets.mjs
```

- [ ] **Step 2: Confirm repository hygiene**

Run `git status --short`, verify `.gitignore` excludes `node_modules`, `dist`, test artifacts, environment files, and local screenshots unless intentionally documented.

- [ ] **Step 3: Inspect `lirns200/click-grow-farm` without overwriting unrelated history**

Inspect the existing `main` branch before publishing. If its contents represent an earlier version of this same farm project, preserve its history and replace the site in a normal commit. If it is unrelated, stop publication and request a different repository while leaving the completed local project intact.

- [ ] **Step 4: Push and verify the remote commit**

```bash
git remote add origin https://github.com/lirns200/click-grow-farm.git
git push -u origin HEAD:main
```

Verify the remote repository reports the pushed commit SHA and all source/assets files.
