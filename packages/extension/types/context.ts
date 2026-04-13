export interface PageContext {
  tabId: number
  url: string
  title: string
  metadata: PageMetadata
  content: ContentChunk[]
  selectedElements: ExtractedElement[]
  screenshot?: string
  extractedAt: number
}

export interface PageMetadata {
  title: string
  description: string
  ogImage?: string
  author?: string
  publishedDate?: string
  language: string
  siteName?: string
}

export interface ContentChunk {
  id: string
  text: string
  type: 'paragraph' | 'heading' | 'code' | 'table' | 'list' | 'blockquote'
  tokenEstimate: number
  sourceSelector?: string
}

export interface ExtractedElement {
  id: string
  selector: string
  html: string
  text: string
  type: string
  tokenEstimate: number
}
