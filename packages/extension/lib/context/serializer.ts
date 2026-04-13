import { nanoid } from 'nanoid'
import type { ExtractedElement } from '../../types/context'

const MAX_HTML_LENGTH = 2000

export function computeSelector(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el

  while (current && current !== document.documentElement) {
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`)
      break
    }

    const tag = current.tagName.toLowerCase()
    const parent: Element | null = current.parentElement
    if (parent) {
      const currentTag = current.tagName
      const siblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === currentTag,
      )
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        parts.unshift(`${tag}:nth-of-type(${index})`)
      } else {
        parts.unshift(tag)
      }
    } else {
      parts.unshift(tag)
    }

    current = parent
  }

  return parts.join(' > ')
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function serializeNode(el: Element): ExtractedElement {
  const text = el.textContent?.trim() ?? ''
  let html = el.outerHTML
  if (html.length > MAX_HTML_LENGTH) {
    html = html.slice(0, MAX_HTML_LENGTH) + '…'
  }

  return {
    id: nanoid(),
    selector: computeSelector(el),
    html,
    text,
    type: el.tagName.toLowerCase(),
    tokenEstimate: estimateTokens(text),
  }
}
