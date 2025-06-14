'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, LogOut } from 'lucide-react';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: any) => void; scope?: string }) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// Gmail API scopes
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

// Google Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function Home() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [showAllEmails, setShowAllEmails] = useState(true);

  useEffect(() => {
    console.log('Session Status:', status);
    console.log('Session Data:', session);
  }, [session, status]);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signIn('google', { 
        callbackUrl: '/',
        scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
        redirect: true
      });
      console.log('Sign In Result:', result);
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmails = async () => {
    if (!session?.accessToken) {
      console.error('No access token available in session:', session);
      setError('No access token available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting to fetch emails...');
      console.log('Using access token:', session.accessToken.substring(0, 20) + '...');

      // First, get the list of messages
      const messagesUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50';
      console.log('Fetching messages from:', messagesUrl);
      
      const messagesResponse = await fetch(messagesUrl, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json();
        console.error('Gmail API error response:', errorData);
        throw new Error(`Gmail API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const messagesData = await messagesResponse.json();
      console.log('Gmail API messages response:', messagesData);

      if (!messagesData.messages || messagesData.messages.length === 0) {
        console.log('No messages found in the response');
        setEmails([]);
        return;
      }

      console.log(`Found ${messagesData.messages.length} messages`);

      // Then, get the full details of each message
      const emailDetails = await Promise.all(
        messagesData.messages.map(async (message: any) => {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`;
          console.log('Fetching details for message:', message.id);
          
          const detailResponse = await fetch(detailUrl, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });

          if (!detailResponse.ok) {
            console.error(`Failed to fetch details for message ${message.id}:`, await detailResponse.text());
            return null;
          }

          const emailData = await detailResponse.json();
          console.log('Successfully fetched details for message:', message.id);
          return emailData;
        })
      );

      // Filter out any failed requests and extract unsubscribe links
      const processedEmails = emailDetails
        .filter(Boolean)
        .map(email => {
          const headers = email.payload.headers;
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          
          // Look for List-Unsubscribe header
          const unsubscribeHeader = headers.find((h: any) => 
            h.name.toLowerCase() === 'list-unsubscribe' || 
            h.name.toLowerCase() === 'list-unsubscribe-post'
          );
          
          // Parse the unsubscribe link
          let unsubscribeLink = null;
          if (unsubscribeHeader?.value) {
            console.log('Found unsubscribe header:', unsubscribeHeader.value);
            // The value might be in format: <mailto:unsubscribe@example.com>, <https://example.com/unsubscribe>
            const matches = unsubscribeHeader.value.match(/<(https?:\/\/[^>]+)>/);
            if (matches) {
              unsubscribeLink = matches[1];
              console.log('Extracted unsubscribe link:', unsubscribeLink);
            } else {
              // If no URL found, use the raw value
              unsubscribeLink = unsubscribeHeader.value;
              console.log('Using raw unsubscribe value:', unsubscribeLink);
            }
          }

          // Also check the email body for unsubscribe links
          let bodyUnsubscribeLink = null;
          if (email.payload.parts) {
            const textPart = email.payload.parts.find((part: any) => part.mimeType === 'text/plain');
            if (textPart?.data) {
              const decodedBody = atob(textPart.data.replace(/-/g, '+').replace(/_/g, '/'));
              const unsubscribeMatch = decodedBody.match(/https?:\/\/[^\s<>"]+unsubscribe[^\s<>"]+/i);
              if (unsubscribeMatch) {
                bodyUnsubscribeLink = unsubscribeMatch[0];
                console.log('Found unsubscribe link in body:', bodyUnsubscribeLink);
              }
            }
          }

          return {
            id: email.id,
            subject,
            from,
            unsubscribeLink: unsubscribeLink || bodyUnsubscribeLink,
            snippet: email.snippet,
            date: headers.find((h: any) => h.name === 'Date')?.value || 'Unknown Date',
            hasUnsubscribeLink: !!(unsubscribeLink || bodyUnsubscribeLink)
          };
        });

      console.log('All processed emails:', processedEmails);
      setEmails(processedEmails);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch emails');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      console.log('Session authenticated, fetching emails...');
      fetchEmails();
    }
  }, [status, session]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const filteredEmails = showAllEmails ? emails : emails.filter(email => email.hasUnsubscribeLink);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Gmail Unsubscribe Tool</CardTitle>
            <CardDescription className="text-center">
              Sign in with your Google account to manage your email subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {status !== 'authenticated' ? (
              <div className="space-y-4">
                <p>Please sign in to access your Gmail account.</p>
                <Button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p>Signed in as {session.user?.email}</p>
                  <Button
                    onClick={() => signOut()}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Sign Out
                  </Button>
                </div>
                
                {isLoading ? (
                  <p>Loading...</p>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">
                        {showAllEmails ? 'All Emails' : 'Emails with Unsubscribe Links'}
                      </h2>
                      <Button
                        onClick={() => setShowAllEmails(!showAllEmails)}
                        variant="outline"
                        size="sm"
                      >
                        {showAllEmails ? 'Show Only Unsubscribe Links' : 'Show All Emails'}
                      </Button>
                    </div>
                    {filteredEmails.length > 0 ? (
                      <ul className="space-y-4">
                        {filteredEmails.map((email) => (
                          <li key={email.id} className="p-4 border rounded-lg shadow-sm">
                            <div className="font-medium">{email.subject}</div>
                            <div className="text-sm text-gray-600 mb-2">{email.from}</div>
                            <div className="text-sm text-gray-500 mb-2">{email.snippet}</div>
                            <div className="text-sm text-gray-400 mb-2">{email.date}</div>
                            {email.unsubscribeLink ? (
                              <a
                                href={email.unsubscribeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Unsubscribe
                              </a>
                            ) : (
                              <div className="text-sm text-gray-500">No unsubscribe link found</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No emails found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 