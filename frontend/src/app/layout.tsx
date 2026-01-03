import type { Metadata } from 'next'
import { Providers } from './providers'
import { DemoBanner } from '@/components/DemoBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'BNB Launchpad',
  description: 'Decentralized token presale platform on BNB Chain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-900 text-zinc-50 min-h-screen">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    BNB Launchpad
                  </h1>
                </div>
                <nav className="flex items-center gap-4">
                  <a href="/" className="text-zinc-400 hover:text-zinc-50 transition-colors">
                    Presales
                  </a>
                  <a href="/launch" className="text-zinc-400 hover:text-zinc-50 transition-colors">
                    Launch
                  </a>
                  <div id="connect-button-portal" />
                </nav>
              </div>
            </header>
            <DemoBanner />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-zinc-800 py-6 mt-12">
              <div className="container mx-auto px-4 text-center text-zinc-500 text-sm">
                BNB Launchpad - Decentralized Presales on BNB Chain
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
