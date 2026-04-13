import type { ExtensionMessage } from '../types/messages'

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    browser.runtime.onMessage.addListener(
      (msg: ExtensionMessage, _sender, sendResponse) => {
        switch (msg.type) {
          case 'EXTRACT_PAGE':
            extractPage(msg.options).then(sendResponse)
            return true // async response
          case 'ELEMENT_PICKER_ACTIVATE':
            // Handled by the dedicated element-picker content script (plan 02)
            break
        }
        return false
      },
    )
  },
})

async function extractPage(_options: {
  includeMetadata: boolean
  includeStructured: boolean
  maxTokens: number
}) {
  // Implemented in plan 02 (page context engine)
  return { type: 'EXTRACTION_RESULT' as const, context: null }
}
