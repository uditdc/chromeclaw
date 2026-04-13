import { create } from 'zustand'
import type { PageContext, ExtractedElement } from '../types/context'

interface ContextState {
  pageContext: PageContext | null
  isExtracting: boolean
  isPickerActive: boolean
  selectedElements: ExtractedElement[]
  totalTokens: number

  extractCurrentPage: () => Promise<void>
  toggleElementPicker: () => void
  addSelectedElement: (el: ExtractedElement) => void
  removeSelectedElement: (id: string) => void
  clearContext: () => void
}

export const useContextStore = create<ContextState>((set, get) => ({
  pageContext: null,
  isExtracting: false,
  isPickerActive: false,
  selectedElements: [],
  totalTokens: 0,

  extractCurrentPage: async () => {
    set({ isExtracting: true })
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (!tab?.id) {
        set({ isExtracting: false })
        return
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_PAGE',
        options: {
          includeMetadata: true,
          includeStructured: true,
          maxTokens: 4000,
        },
      })

      if (response?.context) {
        const context: PageContext = { ...response.context, tabId: tab.id }
        const tokens = context.content.reduce(
          (sum, c) => sum + c.tokenEstimate,
          0,
        )
        set({ pageContext: context, totalTokens: tokens, isExtracting: false })
      } else {
        set({ isExtracting: false })
      }
    } catch {
      set({ isExtracting: false })
    }
  },

  toggleElementPicker: () => {
    const active = !get().isPickerActive
    set({ isPickerActive: active })

    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ELEMENT_PICKER_ACTIVATE',
            active,
          })
        }
      })
  },

  addSelectedElement: (el) => {
    set((s) => {
      const selectedElements = [...s.selectedElements, el]
      const elTokens = selectedElements.reduce(
        (sum, e) => sum + e.tokenEstimate,
        0,
      )
      const contentTokens =
        s.pageContext?.content.reduce((sum, c) => sum + c.tokenEstimate, 0) ?? 0
      return {
        selectedElements,
        totalTokens: contentTokens + elTokens,
      }
    })
  },

  removeSelectedElement: (id) => {
    set((s) => {
      const selectedElements = s.selectedElements.filter((e) => e.id !== id)
      const elTokens = selectedElements.reduce(
        (sum, e) => sum + e.tokenEstimate,
        0,
      )
      const contentTokens =
        s.pageContext?.content.reduce((sum, c) => sum + c.tokenEstimate, 0) ?? 0
      return {
        selectedElements,
        totalTokens: contentTokens + elTokens,
      }
    })
  },

  clearContext: () => {
    set({
      pageContext: null,
      selectedElements: [],
      totalTokens: 0,
      isPickerActive: false,
    })
  },
}))
