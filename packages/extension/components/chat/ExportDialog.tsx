import { useState } from 'react'
import type { ChatMessage } from '../../types/messages'

interface Props {
  messages: ChatMessage[]
  title: string
  onClose: () => void
}

export function ExportDialog({ messages, title, onClose }: Props) {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown')

  const exportData = () => {
    let content: string
    let filename: string
    let mime: string

    if (format === 'markdown') {
      content = `# ${title}\n\n` + messages
        .map((m) => `**${m.role === 'user' ? 'You' : 'Assistant'}:**\n\n${m.content}`)
        .join('\n\n---\n\n')
      filename = `${title.slice(0, 40)}.md`
      mime = 'text/markdown'
    } else {
      content = JSON.stringify({ title, messages }, null, 2)
      filename = `${title.slice(0, 40)}.json`
      mime = 'application/json'
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-64 rounded-lg bg-neutral-800 p-4 shadow-xl">
        <h3 className="mb-3 text-sm font-semibold">Export Conversation</h3>

        <div className="mb-4 flex gap-2">
          {(['markdown', 'json'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex-1 rounded px-2 py-1.5 text-xs font-medium ${
                format === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              {f === 'markdown' ? 'Markdown' : 'JSON'}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            onClick={exportData}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
