import type { PageContext } from '../../types/context'
import type { Memory } from '../memory/types'

const BASE_PROMPT = `You are ChromeClaw, an AI assistant built into the user's browser. You have access to tools that let you interact with browser tabs, read page content, manage bookmarks, search history, and more.

Be concise and helpful. When a task requires multiple steps, explain your plan before executing. If a tool call fails, explain what went wrong and suggest alternatives.`

export function buildSystemPrompt(options: {
  memories?: Memory[]
  pageContext?: PageContext
}): string {
  const parts = [BASE_PROMPT]

  if (options.memories?.length) {
    parts.push(formatMemories(options.memories))
  }

  if (options.pageContext) {
    parts.push(formatPageContext(options.pageContext))
  }

  return parts.join('\n\n')
}

function formatMemories(memories: Memory[]): string {
  const grouped = new Map<string, string[]>()
  for (const m of memories) {
    const list = grouped.get(m.category) ?? []
    list.push(m.content)
    grouped.set(m.category, list)
  }

  const sections: string[] = []
  for (const [category, items] of grouped) {
    const heading = category.charAt(0).toUpperCase() + category.slice(1)
    sections.push(`## ${heading}\n${items.map((i) => `- ${i}`).join('\n')}`)
  }

  return `<user_profile>\n${sections.join('\n\n')}\n</user_profile>`
}

function formatPageContext(ctx: PageContext): string {
  const meta = `Title: ${ctx.title}\nURL: ${ctx.url}`
  const body = ctx.content.map((c) => c.text).join('\n\n')
  return `<page_context>\n${meta}\n\n${body}\n</page_context>`
}
