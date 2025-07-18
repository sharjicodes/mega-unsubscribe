import './globals.css'
import { Inter } from 'next/font/google'
import Providers from './providers'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gmail Unsubscribe Tool',
  description: 'A tool to help you unsubscribe from unwanted emails',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </Providers>
        <footer className="w-full flex justify-center py-4 bg-white border-t">
          <a
            href="https://megaunsubscribe.sharjith.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:text-primary"
          >
            Privacy Policy
          </a>
        </footer>
      </body>
    </html>
  )
} 