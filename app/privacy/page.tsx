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
            <section className="border border-yellow-300 bg-yellow-50 rounded p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-800">How We Protect Your Sensitive Data</h2>
              <ul className="list-disc pl-6 space-y-2 text-yellow-900">
                <li><strong>Data Encryption:</strong> All data transmitted between your browser and Google's servers is encrypted using HTTPS/TLS.</li>
                <li><strong>No Data Storage:</strong> We do <u>not</u> store, save, or cache the contents of your emails or any sensitive Gmail data on our servers. All processing is done in-memory and only for the duration of your session.</li>
                <li><strong>Access Controls:</strong> Only you have access to your Gmail data through secure OAuth authentication. Our team and systems do not have access to your Gmail content.</li>
                <li><strong>No Data Sharing:</strong> We do not share, sell, or disclose your personal or Gmail data to any third parties.</li>
                <li><strong>Data Deletion:</strong> Since we do not store your data, there is nothing to delete. If you have questions or concerns, you may contact us at <a href="mailto:me@sharjith.com" className="text-primary hover:underline">me@sharjith.com</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">What Data We Access</h2>
              <p className="mb-4 text-muted-foreground">
                We request access to your Gmail account using Google's official APIs. Specifically, we use the following scope:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    https://www.googleapis.com/auth/gmail.readonly
                  </code> 
                  — to identify emails with unsubscribe links and read email metadata
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
              <h2 className="text-2xl font-semibold mb-4">Data Protection and Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Encryption:</strong> All data transmitted between your browser and Google's servers is encrypted using HTTPS/TLS.</li>
                <li><strong>No Data Storage:</strong> We do not store your Gmail data or email content on our servers. All processing is performed in-memory and is not retained after your session ends.</li>
                <li><strong>Access Control:</strong> Access to your Gmail account is strictly limited to the permissions you grant via Google OAuth. We only request the minimum necessary scope (<code>gmail.readonly</code>) to provide our service.</li>
                <li><strong>Third-Party Services:</strong> We do not share your data with any third parties.</li>
                <li><strong>User Control:</strong> You can revoke our access to your Gmail account at any time via your Google Account security settings.</li>
              </ul>
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