'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t py-6 mt-8 md:mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <p className="text-xs md:text-sm text-muted-foreground px-4">© Mega-Unsubscribe – Declutter your Gmail with one click</p>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <a
              href="https://megaunsubscribe.sharjith.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium text-sm"
            >
              Privacy Policy
            </a>
            <span className="hidden md:inline text-muted-foreground">•</span>
            <Link 
              href="/terms" 
              className="text-primary hover:text-primary/80 font-medium text-sm"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">Created by Sharjith A</p>
        </div>
      </div>
    </footer>
  )
} 