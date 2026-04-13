import type { ExtensionMessage } from '../types/messages'
import { serializeNode } from '../lib/context/serializer'

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    let overlay: HTMLDivElement | null = null
    let highlight: HTMLDivElement | null = null
    let active = false

    function onMouseMove(e: MouseEvent) {
      if (!highlight) return
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el || el === overlay || el === highlight) return

      const rect = el.getBoundingClientRect()
      highlight.style.top = `${rect.top}px`
      highlight.style.left = `${rect.left}px`
      highlight.style.width = `${rect.width}px`
      highlight.style.height = `${rect.height}px`
      highlight.style.display = 'block'
    }

    function onClick(e: MouseEvent) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el || el === overlay || el === highlight) return

      const serialized = serializeNode(el)
      browser.runtime.sendMessage({
        type: 'ELEMENT_PICKER_RESULT',
        selector: serialized.selector,
        html: serialized.html,
        text: serialized.text,
      })

      deactivate()
    }

    function activate() {
      if (active) return
      active = true

      overlay = document.createElement('div')
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;pointer-events:none;'

      highlight = document.createElement('div')
      highlight.style.cssText =
        'position:fixed;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);pointer-events:none;display:none;transition:all 0.05s ease;border-radius:2px;'

      overlay.appendChild(highlight)
      document.documentElement.appendChild(overlay)

      document.addEventListener('mousemove', onMouseMove, true)
      document.addEventListener('click', onClick, true)
    }

    function deactivate() {
      active = false
      document.removeEventListener('mousemove', onMouseMove, true)
      document.removeEventListener('click', onClick, true)

      if (overlay) {
        overlay.remove()
        overlay = null
        highlight = null
      }
    }

    browser.runtime.onMessage.addListener(
      (msg: ExtensionMessage) => {
        if (msg.type === 'ELEMENT_PICKER_ACTIVATE') {
          if (msg.active) {
            activate()
          } else {
            deactivate()
          }
        }
      },
    )
  },
})
