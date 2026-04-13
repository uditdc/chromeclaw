import type { PageContext } from '../../types/context'
import type { ExtractPageRequest } from '../../types/messages'

export async function extractFromTabs(
  tabIds: number[],
  options: ExtractPageRequest['options'],
): Promise<Map<number, PageContext>> {
  const results = new Map<number, PageContext>()

  const settled = await Promise.allSettled(
    tabIds.map(async (tabId) => {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'EXTRACT_PAGE' as const,
        options,
      })
      if (response?.context) {
        const context: PageContext = { ...response.context, tabId }
        results.set(tabId, context)
      }
    }),
  )

  for (const result of settled) {
    if (result.status === 'rejected') {
      console.warn('[ChromeClaw] Tab extraction failed:', result.reason)
    }
  }

  return results
}
