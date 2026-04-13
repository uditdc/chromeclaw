import { useState, useEffect } from 'react'
import { ChatView } from '../../components/chat/ChatView'
import { ConversationList } from '../../components/chat/ConversationList'
import { ExportDialog } from '../../components/chat/ExportDialog'
import { useSettingsStore } from '../../stores/settings-store'
import { useChatStore } from '../../stores/chat-store'

type View = 'chat' | 'history'

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [showExport, setShowExport] = useState(false)
  const { hasCompletedOnboarding, checkOnboarding } = useSettingsStore()
  const conversation = useChatStore((s) => s.conversation)
  const messages = useChatStore((s) => s.messages)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      checkOnboarding(),
      useChatStore.getState().loadLastConversation(),
    ]).then(() => setLoaded(true))
  }, [checkOnboarding])

  return (
    <div className="flex h-full flex-col bg-neutral-950 text-neutral-100">
      {loaded && !hasCompletedOnboarding && (
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="border-b border-blue-900/50 bg-blue-950/50 px-3 py-2 text-left text-xs text-blue-300 hover:bg-blue-950/70"
        >
          Set up your API key to get started &rarr;
        </button>
      )}

      <main className="min-h-0 flex-1">
        {view === 'chat' ? (
          <ChatView />
        ) : (
          <ConversationList onSelect={() => setView('chat')} />
        )}
      </main>

      <footer className="flex items-center justify-end gap-1 border-t border-neutral-800 px-3 py-1.5">
        {conversation && messages.length > 0 && (
          <button
            onClick={() => setShowExport(true)}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
            title="Export conversation"
          >
            Export
          </button>
        )}
        <button
          onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
          className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
        >
          {view === 'chat' ? 'History' : 'Back'}
        </button>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
          title="Settings"
        >
          &#9881;
        </button>
      </footer>

      {showExport && conversation && (
        <ExportDialog
          messages={messages}
          title={conversation.title}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
