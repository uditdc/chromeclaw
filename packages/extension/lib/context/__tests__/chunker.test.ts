import { describe, it, expect } from 'vitest'
import { fitChunks } from '../chunker'
import type { ContentChunk } from '../../../types/context'

function chunk(
  type: ContentChunk['type'],
  text: string,
  id = String(Math.random()),
): ContentChunk {
  return {
    id,
    text,
    type,
    tokenEstimate: Math.ceil(text.length / 4),
  }
}

describe('fitChunks', () => {
  it('returns all chunks when within budget', () => {
    const chunks = [chunk('paragraph', 'Hello world'), chunk('heading', 'Title')]
    const result = fitChunks(chunks, 1000)
    expect(result).toHaveLength(2)
  })

  it('prioritizes headings over paragraphs', () => {
    const heading = chunk('heading', 'A'.repeat(100))
    const para = chunk('paragraph', 'B'.repeat(100))
    const result = fitChunks([para, heading], 30)
    expect(result[0].type).toBe('heading')
  })

  it('prioritizes code over paragraphs', () => {
    const code = chunk('code', 'C'.repeat(100))
    const para = chunk('paragraph', 'D'.repeat(100))
    const result = fitChunks([para, code], 30)
    expect(result[0].type).toBe('code')
  })

  it('truncates oversized chunks to fit budget', () => {
    const large = chunk('heading', 'word. '.repeat(200))
    const result = fitChunks([large], 20)
    expect(result).toHaveLength(1)
    expect(result[0].tokenEstimate).toBeLessThanOrEqual(20)
  })

  it('returns empty array for zero budget', () => {
    const chunks = [chunk('paragraph', 'Hello')]
    const result = fitChunks(chunks, 0)
    expect(result).toHaveLength(0)
  })

  it('packs multiple chunks greedily', () => {
    const chunks = [
      chunk('heading', 'A'.repeat(40)),
      chunk('code', 'B'.repeat(40)),
      chunk('paragraph', 'C'.repeat(40)),
    ]
    const budget = 20 + 10 + 5
    const result = fitChunks(chunks, budget)
    const totalTokens = result.reduce((s, c) => s + c.tokenEstimate, 0)
    expect(totalTokens).toBeLessThanOrEqual(budget)
  })

  it('drops chunks that are too small to truncate', () => {
    const large = chunk('heading', 'A'.repeat(400))
    const result = fitChunks([large], 3)
    expect(result).toHaveLength(0)
  })

  it('preserves priority order: heading > code > table > list > paragraph > blockquote', () => {
    const types: ContentChunk['type'][] = [
      'blockquote',
      'paragraph',
      'list',
      'table',
      'code',
      'heading',
    ]
    const chunks = types.map((t) => chunk(t, 'x'.repeat(20)))
    const result = fitChunks(chunks, 10000)
    expect(result.map((c) => c.type)).toEqual([
      'heading',
      'code',
      'table',
      'list',
      'paragraph',
      'blockquote',
    ])
  })
})
