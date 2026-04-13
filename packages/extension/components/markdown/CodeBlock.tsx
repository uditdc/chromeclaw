import { useState } from 'react'

interface Props {
  children: string
  className?: string
}

export function CodeBlock({ children, className }: Props) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace('language-', '') ?? ''

  const copy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="group relative my-2 rounded-md bg-neutral-900 text-sm">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-1.5 text-xs text-neutral-500">
        <span>{language}</span>
        <button
          onClick={copy}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3">
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}
