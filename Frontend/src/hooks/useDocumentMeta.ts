import { useEffect } from 'react'

/** Sets document title and robots meta. All pages except `/` are noindex. */
export function useDocumentMeta(title: string, { index = false }: { index?: boolean } = {}) {
  useEffect(() => {
    document.title = title ? `${title} · Continuo` : 'Continuo · Every conversation, continued.'
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    meta.content = index ? 'index, follow' : 'noindex, nofollow'
  }, [title, index])
}
