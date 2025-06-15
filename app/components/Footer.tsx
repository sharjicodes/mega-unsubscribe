'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center text-sm text-muted-foreground">
          <p>© Mega-Unsubscribe – Declutter your Gmail with one click</p>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
          </div>
          <p>Created by Sharjith A</p>
        </div>
      </div>
    </footer>
  )
} 