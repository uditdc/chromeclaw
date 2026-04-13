import type { ExtensionMessage } from '../types/messages'
import { extractPageContext } from '../lib/context/extractor'

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    browser.runtime.onMessage.addListener(
      (msg: ExtensionMessage, _sender, sendResponse) => {
        switch (msg.type) {
          case 'EXTRACT_PAGE':
            try {
              const context = extractPageContext(msg.options)
              sendResponse({ type: 'EXTRACTION_RESULT' as const, context })
            } catch (err) {
              console.error('[ChromeClaw] Extraction failed:', err)
              sendResponse({ type: 'EXTRACTION_RESULT' as const, context: null })
            }
            return true
          case 'ELEMENT_PICKER_ACTIVATE':
            break
        }
        return false
      },
    )
  },
})
