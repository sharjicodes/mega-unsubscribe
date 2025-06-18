'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <p className="text-sm text-muted-foreground">© Mega-Unsubscribe – Declutter your Gmail with one click</p>
          <div className="flex items-center space-x-4">
            <Link 
              href="/privacy" 
              className="text-primary hover:text-primary/80 font-medium"
              aria-label="Read our Privacy Policy"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/terms" 
              className="text-primary hover:text-primary/80 font-medium"
              aria-label="Read our Terms of Service"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">Created by Sharjith A</p>
        </div>
      </div>
    </footer>
  )
} 