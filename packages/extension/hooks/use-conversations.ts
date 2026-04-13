import { useState, useEffect, useCallback } from 'react'
import type { Conversation } from '../types/chat'
import {
  listConversations,
  searchConversations,
  deleteConversation,
} from '../lib/db/conversations'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const results = query.trim()
      ? await searchConversations(query)
      : await listConversations()
    setConversations(results)
    setLoading(false)
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  const remove = useCallback(
    async (id: string) => {
      await deleteConversation(id)
      await load()
    },
    [load],
  )

  return { conversations, query, setQuery, loading, remove, reload: load }
}
