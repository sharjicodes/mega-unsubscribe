'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">🛠️ How It Works</h1>
          <p className="text-lg text-muted-foreground">
            A simple, privacy-first solution to clean up your Gmail inbox. Mega-Unsubscribe is an open-source tool that scans your Gmail account, identifies subscription emails, and helps you unsubscribe from them efficiently.
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">🔍 Clean Your Gmail, Privately</h2>
            <p className="text-muted-foreground">
              Gmail is powerful, but over time, your inbox gets clogged with newsletters and promotions.
              Mega-Unsubscribe helps you regain control by automatically detecting mailing lists using Gmail's official API and showing you a clean list of subscriptions — no need to dig through each email manually.
            </p>
            <p className="text-muted-foreground">
              Everything runs securely through Google's official APIs, and no data ever leaves your device without your consent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Local Processing</h2>
            <p className="text-muted-foreground">
              All email analysis happens through the Gmail API. We look for standard headers like List-Unsubscribe and sender patterns to detect subscription emails.
              This ensures your inbox is scanned securely and privately, with minimal data processing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Data Security & Authorization</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>No data is stored on any external servers</li>
              <li>We use Google's OAuth 2.0 to request read-only access to your Gmail</li>
              <li>You can revoke access at any time through your Google Account settings</li>
              <li>We never store, log, or transmit your personal emails — you stay in full control of your data at all times</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Open Source Control</h2>
            <p className="text-muted-foreground">
              Mega-Unsubscribe is completely open source. You can audit the code, customize the app, or host it on your own. 
              There are no hidden scripts, no trackers, and no third-party analytics — just transparent, user-owned email cleanup.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Key Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Detects email subscriptions automatically</li>
              <li>Batch unsubscribe from multiple senders at once</li>
              <li>Privacy-first: No email content ever leaves your device</li>
              <li>Open-source: Fully transparent and customizable</li>
              <li>OAuth-based login: Safe & secure Google sign-in</li>
              <li>Fast processing: Everything happens through Gmail's official API</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Technical Implementation</h2>
            <p className="text-muted-foreground">
              Mega-Unsubscribe uses the official Gmail API to fetch recent emails from your inbox. It detects mailing list patterns using:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>List-Unsubscribe headers</li>
              <li>Sender addresses and domain analysis</li>
              <li>Common marketing patterns</li>
            </ul>
            <p className="text-muted-foreground">
              The tool processes unsubscribe requests through Gmail's native mechanisms — ensuring full compliance and security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">⚠️ Important Notes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>We do not delete emails — we only help you unsubscribe from future emails</li>
              <li>If you revoke access to Gmail, the tool will no longer function until you re-authorize</li>
              <li>You should always review which senders you're unsubscribing from before confirming</li>
            </ul>
          </section>
        </div>

        <div className="pt-8">
          <Link href="/">
            <Button className="w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 