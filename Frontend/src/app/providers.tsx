import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { CurtainProvider } from '@/components/motion/Curtain'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/lib/auth'

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  )
  return (
    <QueryClientProvider client={client}>
      {/* reducedMotion="user" makes every Framer animation honour prefers-reduced-motion */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <CurtainProvider>{children}</CurtainProvider>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  )
}
