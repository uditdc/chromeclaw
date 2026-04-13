import { z } from 'zod'
import { register } from '../registry'

register({
  name: 'get_active_tab',
  description: 'Get information about the currently active browser tab (URL, title, tab ID).',
  inputSchema: z.object({}),
  requiresConfirmation: false,
  execute: async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab) {
      return { success: false, data: null, error: 'No active tab found' }
    }
    return {
      success: true,
      data: {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
      },
    }
  },
})
