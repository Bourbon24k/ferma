import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import type { BoardPosition } from '../types/game'
import { BuildPlacementLayer } from './BuildPlacementLayer'

type InteractiveCellProps = {
  'data-testid'?: string
  'aria-disabled'?: boolean
  onPointerEnter?: () => void
  onClick?: () => void
  children?: ReactNode
}

function findCell(node: ReactNode, testId: string): ReactElement<InteractiveCellProps> {
  if (Array.isArray(node)) {
    for (const child of node) {
      try {
        return findCell(child, testId)
      } catch {
        // Continue through sibling elements.
      }
    }
  }

  if (isValidElement<InteractiveCellProps>(node)) {
    if (node.props['data-testid'] === testId) return node

    const children = node.props.children
    const childList = Array.isArray(children) ? children : [children]
    for (const child of childList) {
      try {
        return findCell(child, testId)
      } catch {
        // Continue through sibling elements.
      }
    }
  }

  throw new Error(`Missing test cell: ${testId}`)
}

describe('FarmBoard build placement', () => {
  it('shows a valid build preview over free grass', () => {
    const onPreviewChange = vi.fn<(position: BoardPosition | null) => void>()
    const props = {
      active: true,
      beds: [],
      previewPosition: null,
      onPreviewChange,
      onPlace: vi.fn(),
    }
    const layer = BuildPlacementLayer(props)

    findCell(layer, 'board-cell-5-8').props.onPointerEnter?.()

    expect(onPreviewChange).toHaveBeenCalledWith({ column: 5, row: 8 })
    const preview = renderToStaticMarkup(
      <BuildPlacementLayer {...props} previewPosition={{ column: 5, row: 8 }} />,
    )
    expect(preview).toContain('data-testid="bed-preview"')
    expect(preview).toContain('data-valid="true"')
  })

  it('does not place a bed on blocked terrain', () => {
    const onPlace = vi.fn<(position: BoardPosition) => void>()
    const layer = BuildPlacementLayer({
      active: true,
      beds: [],
      previewPosition: { column: 5, row: 0 },
      onPreviewChange: vi.fn(),
      onPlace,
    })
    const blockedCell = findCell(layer, 'board-cell-5-0')

    blockedCell.props.onClick?.()

    expect(blockedCell.props['aria-disabled']).toBe(true)
    expect(onPlace).not.toHaveBeenCalled()
    const preview = renderToStaticMarkup(layer)
    expect(preview).toContain('data-valid="false"')
  })
})
