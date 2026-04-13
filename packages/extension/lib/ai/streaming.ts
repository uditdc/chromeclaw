import type { ChatRequest, ChatStreamChunk } from '../../types/messages'

export function connectChatPort() {
  return browser.runtime.connect({ name: 'chat' })
}

export function sendChatRequest(
  port: Browser.runtime.Port,
  request: ChatRequest,
) {
  port.postMessage(request)
}

export function onStreamChunk(
  port: Browser.runtime.Port,
  callback: (chunk: ChatStreamChunk) => void,
): () => void {
  const listener = (msg: ChatStreamChunk) => {
    if (msg.type === 'CHAT_STREAM_CHUNK') {
      callback(msg)
    }
  }
  port.onMessage.addListener(listener)
  return () => port.onMessage.removeListener(listener)
}
