import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/motion/PageTransition'
import { ButtonLink } from '@/components/ui/Button'
import { LineArt } from '@/components/ui/LineArt'
import { Logo } from '@/components/ui/Logo'
import { Footer } from '@/components/ui/primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function NotFound() {
  useDocumentMeta('Page not found')

  return (
    <PageTransition>
      <div className="grain bg-dark-gradient relative flex min-h-dvh flex-col justify-between px-6 py-8 text-ivory sm:px-12">
        <header className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between">
          <Logo tone="light" size="sm" />
          <Link
            to="/"
            className="link-underline inline-flex items-center gap-1.5 text-[13px] text-sage hover:text-ivory"
          >
            <ArrowLeft size={14} strokeWidth={1.25} /> Home
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <LineArt name="leaf" size={100} delay={0.2} />
          <p className="eyebrow mt-6">404 · Not found</p>
          <h1 className="t-h1 mt-4 text-ivory">
            A quiet space, <em className="text-champagne-soft">unfound.</em>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[16px] text-sage">
            The page you are looking for does not exist or has been moved.
          </p>

          <div className="mt-8">
            <ButtonLink to="/" variant="primary">
              Return to Continuo
            </ButtonLink>
          </div>
        </main>

        <Footer tone="dark" className="relative z-10 text-center" />
      </div>
    </PageTransition>
  )
}

