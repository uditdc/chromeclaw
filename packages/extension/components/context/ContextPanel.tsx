import { useContextStore } from '../../stores/context-store'

export function ContextPanel() {
  const {
    pageContext,
    isExtracting,
    selectedElements,
    totalTokens,
    extractCurrentPage,
    removeSelectedElement,
    clearContext,
  } = useContextStore()

  if (!pageContext && !isExtracting) return null

  return (
    <div className="border-b border-neutral-800 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {isExtracting ? (
            <span className="text-xs text-neutral-500">Extracting page...</span>
          ) : pageContext ? (
            <div className="truncate text-xs text-neutral-400">
              {pageContext.title || pageContext.url}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {totalTokens > 0 && (
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
              ~{totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens} tokens
            </span>
          )}
          <button
            onClick={extractCurrentPage}
            disabled={isExtracting}
            className="rounded p-0.5 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-50"
            title="Refresh page context"
          >
            ↻
          </button>
          <button
            onClick={clearContext}
            className="rounded p-0.5 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
            title="Clear context"
          >
            ✕
          </button>
        </div>
      </div>

      {selectedElements.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedElements.map((el) => (
            <span
              key={el.id}
              className="inline-flex items-center gap-1 rounded bg-blue-900/30 px-1.5 py-0.5 text-[10px] text-blue-300"
            >
              &lt;{el.type}&gt;
              <button
                onClick={() => removeSelectedElement(el.id)}
                className="hover:text-blue-100"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
