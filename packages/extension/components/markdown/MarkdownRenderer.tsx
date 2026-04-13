import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { CodeBlock } from './CodeBlock'
import type { ComponentPropsWithoutRef } from 'react'

interface Props {
  content: string
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose prose-invert prose-sm max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children }) {
            return <>{children}</>
          },
          code({ className, children, ...props }: ComponentPropsWithoutRef<'code'>) {
            const isBlock = className?.startsWith('language-')
            if (isBlock) {
              return (
                <CodeBlock className={className}>
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              )
            }
            return (
              <code
                className="rounded bg-neutral-800 px-1 py-0.5 text-sm"
                {...props}
              >
                {children}
              </code>
            )
          },
          table({ children }) {
            return (
              <div className="my-2 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  {children}
                </table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-left text-xs font-medium">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="border border-neutral-700 px-3 py-1.5 text-xs">
                {children}
              </td>
            )
          },
        }}
      />
    </div>
  )
}
