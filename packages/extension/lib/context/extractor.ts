import { Readability } from '@mozilla/readability'
import { nanoid } from 'nanoid'
import type {
  PageContext,
  PageMetadata,
  ContentChunk,
} from '../../types/context'
import { serializeNode, estimateTokens } from './serializer'
import { fitChunks } from './chunker'

interface ExtractionOptions {
  includeMetadata: boolean
  includeStructured: boolean
  maxTokens: number
}

export function extractPageContext(options: ExtractionOptions): PageContext {
  const metadata = options.includeMetadata
    ? extractMetadata()
    : defaultMetadata()

  const chunks: ContentChunk[] = []

  const clone = new DOMParser().parseFromString(
    document.documentElement.outerHTML,
    'text/html',
  )
  const article = new Readability(clone).parse()

  if (article?.content) {
    chunks.push(...parseArticleHtml(article.content))
  }

  if (options.includeStructured) {
    chunks.push(...extractStructuredElements())
  }

  const fitted = fitChunks(chunks, options.maxTokens)

  return {
    tabId: 0,
    url: location.href,
    title: document.title,
    metadata,
    content: fitted,
    selectedElements: [],
    extractedAt: Date.now(),
  }
}

function extractMetadata(): PageMetadata {
  const getMeta = (name: string): string | undefined => {
    const el =
      document.querySelector(`meta[property="${name}"]`) ??
      document.querySelector(`meta[name="${name}"]`)
    return el?.getAttribute('content') ?? undefined
  }

  return {
    title: document.title,
    description: getMeta('description') ?? getMeta('og:description') ?? '',
    ogImage: getMeta('og:image'),
    author: getMeta('author') ?? getMeta('article:author'),
    publishedDate:
      getMeta('article:published_time') ?? getMeta('date'),
    language: document.documentElement.lang || 'en',
    siteName: getMeta('og:site_name'),
  }
}

function defaultMetadata(): PageMetadata {
  return {
    title: document.title,
    description: '',
    language: document.documentElement.lang || 'en',
  }
}

function parseArticleHtml(html: string): ContentChunk[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const chunks: ContentChunk[] = []

  const blockSelectors = 'h1, h2, h3, h4, h5, h6, p, pre, blockquote, table, ul, ol'
  const blocks = doc.querySelectorAll(blockSelectors)

  for (const block of blocks) {
    const text = block.textContent?.trim()
    if (!text) continue

    const type = tagToChunkType(block.tagName.toLowerCase())
    chunks.push({
      id: nanoid(),
      text,
      type,
      tokenEstimate: estimateTokens(text),
    })
  }

  if (chunks.length === 0) {
    const text = doc.body.textContent?.trim()
    if (text) {
      chunks.push({
        id: nanoid(),
        text,
        type: 'paragraph',
        tokenEstimate: estimateTokens(text),
      })
    }
  }

  return chunks
}

function extractStructuredElements(): ContentChunk[] {
  const chunks: ContentChunk[] = []
  const seen = new Set<Element>()

  const selectors: Array<{ selector: string; type: ContentChunk['type'] }> = [
    { selector: 'table', type: 'table' },
    { selector: 'pre', type: 'code' },
    { selector: 'ul, ol', type: 'list' },
    { selector: 'blockquote', type: 'blockquote' },
  ]

  for (const { selector, type } of selectors) {
    for (const el of document.querySelectorAll(selector)) {
      if (seen.has(el)) continue
      seen.add(el)

      const text = el.textContent?.trim()
      if (!text) continue

      const serialized = serializeNode(el)
      chunks.push({
        id: nanoid(),
        text,
        type,
        tokenEstimate: estimateTokens(text),
        sourceSelector: serialized.selector,
      })
    }
  }

  return chunks
}

function tagToChunkType(
  tag: string,
): ContentChunk['type'] {
  if (tag.startsWith('h')) return 'heading'
  if (tag === 'pre') return 'code'
  if (tag === 'table') return 'table'
  if (tag === 'ul' || tag === 'ol') return 'list'
  if (tag === 'blockquote') return 'blockquote'
  return 'paragraph'
}
