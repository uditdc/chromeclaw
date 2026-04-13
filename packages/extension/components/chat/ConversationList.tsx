import { useConversations } from '../../hooks/use-conversations'
import { useChatStore } from '../../stores/chat-store'

interface Props {
  onSelect: () => void
}

export function ConversationList({ onSelect }: Props) {
  const { conversations, query, setQuery, loading, remove } = useConversations()
  const { setConversation, loadConversation } = useChatStore()

  const handleSelect = async (conv: (typeof conversations)[0]) => {
    setConversation(conv)
    await loadConversation(conv.id)
    onSelect()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-800 p-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations…"
          className="w-full rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-center text-xs text-neutral-500">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-center text-xs text-neutral-500">
            {query ? 'No matches' : 'No conversations yet'}
          </p>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li
                key={conv.id}
                className="group flex items-center justify-between border-b border-neutral-800/50 px-3 py-2.5 hover:bg-neutral-800/50"
              >
                <button
                  onClick={() => handleSelect(conv)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm">{conv.title}</p>
                  <p className="text-[10px] text-neutral-500">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={() => remove(conv.id)}
                  className="ml-2 text-xs text-neutral-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
