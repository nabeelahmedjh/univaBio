import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { EASE } from '../motion/easing'

interface ToastItem {
  id: number
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  duration: number
}

type ToastInput = Omit<ToastItem, 'id' | 'duration'> & { duration?: number }

interface ToastApi {
  show: (t: ToastInput) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Top-right ink toasts with a champagne left border. Auto-dismiss after 4s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), [])

  const show = useCallback(
    (t: ToastInput) => {
      const id = nextId.current++
      const item: ToastItem = { duration: 4000, ...t, id }
      setItems((xs) => [...xs, item])
      window.setTimeout(() => dismiss(id), item.duration)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 top-4 z-[95] flex w-[min(380px,calc(100vw-32px))] flex-col gap-3 sm:right-6 sm:top-6"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              role="status"
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 48, transition: { duration: 0.35, ease: 'easeIn' } }}
              transition={{ duration: 0.6, ease: EASE }}
              className="pointer-events-auto relative overflow-hidden rounded-[14px] border border-hairline border-l-2 border-l-champagne bg-ink px-5 py-4 text-ivory shadow-lux"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[20px] leading-tight">{t.title}</p>
                  {t.description && <p className="mt-1 text-[13px] leading-snug text-sage">{t.description}</p>}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action!.onClick()
                        dismiss(t.id)
                      }}
                      className="link-underline mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-champagne"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="-mr-2 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sage transition-colors hover:text-ivory"
                  aria-label="Dismiss notification"
                >
                  <X size={16} strokeWidth={1.25} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
