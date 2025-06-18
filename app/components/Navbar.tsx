'use client'

import { Button } from '@/components/ui/button'
import { Github, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              mega-unsubscribe
            </Link>
            <Link href="/how-it-works" className="text-sm hover:text-primary">
              How it works
            </Link>
            <Link href="/privacy" className="text-sm hover:text-primary">
              Privacy Policy
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/sharjitha/mega-unsubscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-primary"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
} 