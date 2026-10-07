import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Guards against leaving the page while `when` is true:
 * - browser close/refresh → native beforeunload prompt
 * - in-app link clicks → returns a pending href so the page can show a
 *   branded confirm dialog.
 *
 * (react-router's useBlocker needs a data router; this works with BrowserRouter.)
 */
export function useLeaveGuard(when: boolean) {
  const navigate = useNavigate()
  const [pending, setPending] = useState<string | null>(null)
  const whenRef = useRef(when)

  useEffect(() => {
    whenRef.current = when
  }, [when])

  useEffect(() => {
    if (!when) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    const onClick = (e: MouseEvent) => {
      if (!whenRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return
      const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank') return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      setPending(url.pathname + url.search + url.hash)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [when])

  return {
    pending,
    stay: () => setPending(null),
    leave: () => {
      const to = pending
      whenRef.current = false
      setPending(null)
      if (to) navigate(to)
    },
  }
}
