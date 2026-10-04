import { useEffect, useState } from 'react'

function useMedia(query: string, fallback = false): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? fallback : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** True on devices with a precise hovering pointer (desktop mouse/trackpad). */
export function useFinePointer(): boolean {
  return useMedia('(hover: hover) and (pointer: fine)')
}

export function useIsDesktop(): boolean {
  return useMedia('(min-width: 768px)', true)
}

export default useMedia
