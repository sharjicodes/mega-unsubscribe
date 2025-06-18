import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy – MegaUnsubscribe',
  description: 'Privacy policy for MegaUnsubscribe tool - Learn how we protect your data and privacy.',
};

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/">
              <Button variant="outline" className="mb-6">
                ← Back to Home
              </Button>
            </Link>
            
            <h1 className="text-4xl font-bold mb-6 text-foreground">Privacy Policy</h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              MegaUnsubscribe is a Gmail productivity tool that helps you locate and unsubscribe from unwanted promotional emails.
            </p>
          </div>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">What Data We Access</h2>
              <p className="mb-4 text-muted-foreground">
                We request access to your Gmail account using Google's official APIs. Specifically, we use the following scopes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    https://www.googleapis.com/auth/gmail.readonly
                  </code> 
                  — to identify emails with unsubscribe links
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    https://www.googleapis.com/auth/gmail.modify
                  </code> 
                  — to help you mark or move emails (if enabled)
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    https://www.googleapis.com/auth/gmail.send
                  </code> 
                  — to send unsubscribe requests on your behalf
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">What We Do with Your Data</h2>
              <p className="text-muted-foreground">
                All processing is done securely through Google's APIs in your browser. We do not store, log, or share your email content or account information. 
                Our tool only scans email metadata to identify subscription patterns and unsubscribe links.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How Your Data Is Protected</h2>
              <p className="text-muted-foreground">
                Your data stays within your Google account. We do not run any server that stores or accesses your emails. 
                You control all access via Google's consent screen, and you can revoke access at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Processing</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>We only access email headers and metadata, never email content</li>
                <li>All processing happens locally in your browser</li>
                <li>No data is transmitted to our servers</li>
                <li>We do not use cookies or tracking technologies</li>
                <li>Your email content remains private and secure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Revoking Access</h2>
              <p className="mb-4 text-muted-foreground">
                You can revoke the app's access at any time from your Google account dashboard:
              </p>
              <a 
                href="https://myaccount.google.com/permissions" 
                className="text-primary hover:underline break-all"
                target="_blank" 
                rel="noopener noreferrer"
              >
                https://myaccount.google.com/permissions
              </a>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
              <p className="text-muted-foreground">
                We only use Google's official APIs for Gmail access. We do not integrate with any third-party services 
                that would have access to your data. All authentication is handled securely through Google OAuth 2.0.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Open Source Transparency</h2>
              <p className="text-muted-foreground">
                MegaUnsubscribe is open source, which means you can review all the code to understand exactly how your data is handled. 
                The source code is available on GitHub for full transparency.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact</h2>
              <p className="text-muted-foreground">
                For questions about this privacy policy or support, please email:{' '}
                <a href="mailto:me@sharjith.com" className="text-primary hover:underline">
                  me@sharjith.com
                </a>
              </p>
            </section>

            <div className="border-t pt-8 mt-12">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 