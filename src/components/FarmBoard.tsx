import { useCallback, useEffect, useRef, useState } from 'react'

import farmWorld from '../assets/world/farm-world.png'
import { FARM_BED_WOOD_COST, useGameStore, type ActionResult } from '../store/gameStore'
import type { BoardPosition, ToolId } from '../types/game'
import { BuildPlacementLayer } from './BuildPlacementLayer'
import { FarmBed } from './FarmBed'
import { WorldEffects, type TileEffect, type TileEffectKind } from './WorldEffects'
import '../styles/game.css'

const TOOLS: readonly { id: ToolId; label: string }[] = [
  { id: 'hand', label: 'Собрать' },
  { id: 'hoe', label: 'Вскопать' },
  { id: 'seeds', label: 'Посадить' },
  { id: 'water', label: 'Полить' },
  { id: 'build', label: 'Строительство' },
]

const EFFECT_BY_EVENT: Partial<Record<Extract<ActionResult, { ok: true }>['event'], TileEffectKind>> = {
  hoe: 'dirt',
  plant: 'plant',
  water: 'water',
  harvest: 'harvest',
}

function getTilePosition(bedColumn: number, bedRow: number, tileIndex: number): BoardPosition {
  return {
    column: bedColumn + tileIndex % 2,
    row: bedRow + Math.floor(tileIndex / 2),
  }
}

export function FarmBoard() {
  const game = useGameStore()
  const [previewPosition, setPreviewPosition] = useState<BoardPosition | null>(null)
  const [movingBedId, setMovingBedId] = useState<string>()
  const [effects, setEffects] = useState<TileEffect[]>([])
  const [notice, setNotice] = useState('Выберите инструмент и клетку грядки')
  const [now, setNow] = useState(Date.now)
  const nextEffectId = useRef(1)
  const buildMode = game.selectedTool === 'build'

  useEffect(() => {
    const timer = window.setInterval(() => {
      const tick = Date.now()
      setNow(tick)
      useGameStore.getState().syncTime(tick)
    }, 1_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!buildMode) {
      setMovingBedId(undefined)
      setPreviewPosition(null)
    }
  }, [buildMode])

  const reportResult = useCallback((result: ActionResult) => {
    setNotice(result.ok ? result.notification : result.reason)
  }, [])

  const handleTileAction = useCallback((tileId: string) => {
    const current = useGameStore.getState()
    const result = current.interactWithTile(tileId)
    reportResult(result)
    if (!result.ok) return

    const effectKind = EFFECT_BY_EVENT[result.event]
    const tile = current.tiles[tileId]
    const bed = current.beds.find((item) => item.id === tile?.plotId)
    if (!effectKind || !tile || !bed) return

    setEffects((existing) => [...existing, {
      id: nextEffectId.current++,
      kind: effectKind,
      position: getTilePosition(bed.position.column, bed.position.row, tile.index),
      tileId,
    }])
  }, [reportResult])

  const handleEffectComplete = useCallback((effect: TileEffect) => {
    setEffects((existing) => existing.filter((item) => item.id !== effect.id))
    if (effect.kind === 'harvest') {
      useGameStore.getState().finishHarvestAnimation(effect.tileId)
    }
  }, [])

  const handlePlacement = useCallback((position: BoardPosition) => {
    const current = useGameStore.getState()
    const result = movingBedId
      ? current.moveFarmBed(movingBedId, position)
      : current.placeFarmBed(position)

    reportResult(result)
    if (result.ok) {
      setMovingBedId(undefined)
      setPreviewPosition(null)
    }
  }, [movingBedId, reportResult])

  const handleStore = useCallback((bedId: string) => {
    const result = useGameStore.getState().storeFarmBed(bedId)
    reportResult(result)
    if (result.ok && movingBedId === bedId) setMovingBedId(undefined)
  }, [movingBedId, reportResult])

  return (
    <main className="game-shell">
      <header className="game-hud">
        <div aria-label="Ресурсы" className="game-resources">
          <span>Монеты: {game.player.coins}</span>
          <span>Дерево: {game.inventory.wood}</span>
          <span>Энергия: {game.player.energy}/{game.player.maxEnergy}</span>
        </div>
        <div aria-label="Инструменты" className="tool-row" role="toolbar">
          {TOOLS.map((tool) => (
            <button
              aria-pressed={game.selectedTool === tool.id}
              key={tool.id}
              onClick={() => game.selectTool(tool.id)}
              type="button"
            >
              {tool.label}
            </button>
          ))}
        </div>
        {buildMode && (
          <div className="build-toolbar">
            <span>Грядки: {game.bedInventory}</span>
            <button
              onClick={() => reportResult(game.buyFarmBed())}
              type="button"
            >
              Купить грядку · {FARM_BED_WOOD_COST} дерева
            </button>
            {movingBedId && (
              <button onClick={() => setMovingBedId(undefined)} type="button">Отменить перенос</button>
            )}
          </div>
        )}
        <p aria-live="polite" className="game-notice">{notice}</p>
      </header>

      <section aria-label="Ферма" className="farm-world">
        <img alt="" aria-hidden="true" className="farm-world__background" src={farmWorld} />
        <div className="farm-board-grid">
          <BuildPlacementLayer
            active={buildMode}
            beds={game.beds}
            ignoredBedId={movingBedId}
            onPlace={handlePlacement}
            onPreviewChange={setPreviewPosition}
            previewPosition={previewPosition}
          />

          <div className="farm-bed-layer">
            {game.beds.map((bed) => (
              <FarmBed
                bed={bed}
                buildMode={buildMode}
                key={bed.id}
                moving={movingBedId === bed.id}
                now={now}
                onMove={(bedId) => {
                  setMovingBedId((current) => current === bedId ? undefined : bedId)
                  setPreviewPosition(null)
                }}
                onStore={handleStore}
                onTileAction={handleTileAction}
                tiles={game.tiles}
              />
            ))}
          </div>

          <WorldEffects effects={effects} onEffectComplete={handleEffectComplete} />
        </div>
      </section>
    </main>
  )
}
