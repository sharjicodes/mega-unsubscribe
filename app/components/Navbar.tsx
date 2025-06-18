'use client'

import { Button } from '@/components/ui/button'
import { Github, Menu, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            mega-unsubscribe
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/how-it-works" className="text-sm hover:text-primary">
              How it works
            </Link>
            <a
              href="https://megaunsubscribe.sharjith.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-primary"
            >
              Privacy Policy
            </a>
            <a
              href="https://github.com/sharjicodes/mega-unsubscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-primary"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link 
              href="/how-it-works" 
              className="block text-sm hover:text-primary py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              How it works
            </Link>
            <a
              href="https://megaunsubscribe.sharjith.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm hover:text-primary py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Privacy Policy
            </a>
            <a
              href="https://github.com/sharjicodes/mega-unsubscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm hover:text-primary py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              GitHub
            </a>
          </div>
        )}
      </div>
    </nav>
  )
} 