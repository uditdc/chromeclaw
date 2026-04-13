import type { ContentChunk } from '../../types/context'

const PRIORITY: Record<ContentChunk['type'], number> = {
  heading: 0,
  code: 1,
  table: 2,
  list: 3,
  paragraph: 4,
  blockquote: 5,
}

export function fitChunks(
  chunks: ContentChunk[],
  maxTokens: number,
): ContentChunk[] {
  const sorted = [...chunks].sort(
    (a, b) => PRIORITY[a.type] - PRIORITY[b.type],
  )

  const result: ContentChunk[] = []
  let remaining = maxTokens

  for (const chunk of sorted) {
    if (remaining <= 0) break

    if (chunk.tokenEstimate <= remaining) {
      result.push(chunk)
      remaining -= chunk.tokenEstimate
    } else {
      const truncated = truncateChunk(chunk, remaining)
      if (truncated) {
        result.push(truncated)
        remaining -= truncated.tokenEstimate
      }
    }
  }

  return result
}

function truncateChunk(
  chunk: ContentChunk,
  maxTokens: number,
): ContentChunk | null {
  const maxChars = maxTokens * 4
  if (maxChars < 20) return null

  const sentences = chunk.text.match(/[^.!?]+[.!?]+/g)
  if (!sentences) {
    const text = chunk.text.slice(0, maxChars)
    return {
      ...chunk,
      text,
      tokenEstimate: Math.ceil(text.length / 4),
    }
  }

  let text = ''
  for (const sentence of sentences) {
    if (text.length + sentence.length > maxChars) break
    text += sentence
  }

  if (!text) {
    text = chunk.text.slice(0, maxChars)
  }

  return {
    ...chunk,
    text,
    tokenEstimate: Math.ceil(text.length / 4),
  }
}
