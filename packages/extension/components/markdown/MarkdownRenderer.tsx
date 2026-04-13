import { useMemo } from 'react'
import { marked } from 'marked'

interface Props {
  content: string
}

marked.setOptions({
  gfm: true,
  breaks: true,
})

export function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => {
    if (!content) return ''
    return marked.parse(content, { async: false }) as string
  }, [content])

  return (
    <div
      className="prose prose-invert prose-sm max-w-none break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
