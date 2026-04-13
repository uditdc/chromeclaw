import { useState } from 'react'
import { ChatView } from '../../components/chat/ChatView'
import { ConversationList } from '../../components/chat/ConversationList'

type View = 'chat' | 'history'

export default function App() {
  const [view, setView] = useState<View>('chat')

  return (
    <div className="flex h-full flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
        <h1 className="text-sm font-semibold tracking-wide">ChromeClaw</h1>
        <button
          onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
          className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
        >
          {view === 'chat' ? 'History' : 'Back'}
        </button>
      </header>

      <main className="min-h-0 flex-1">
        {view === 'chat' ? (
          <ChatView />
        ) : (
          <ConversationList
            onSelect={() => setView('chat')}
          />
        )}
      </main>
    </div>
  )
}
