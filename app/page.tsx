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
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isUnsubscribing, setIsUnsubscribing] = useState<string | null>(null)
  const [isUnsubscribingAll, setIsUnsubscribingAll] = useState(false)
  const [unsubscribeProgress, setUnsubscribeProgress] = useState({ current: 0, total: 0 })

  // Function to extract organization name from email
  const getOrganizationName = (from: string) => {
    // Try to extract name from common email formats
    const match = from.match(/(?:^|\s)([^<]+)(?:<|$)/)
    if (match) {
      return match[1].trim()
    }
    // If no name found, return the email address
    return from.split('@')[0]
  }

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

  const fetchEmails = async (isLoadMore = false) => {
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

      // Calculate date 6 months ago
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const dateString = sixMonthsAgo.toISOString().split('T')[0];

      // First, get the list of messages
      const messagesUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=after:${dateString}${pageToken ? `&pageToken=${pageToken}` : ''}`;
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
        setHasMore(false);
        if (!isLoadMore) {
          setEmails([]);
        }
        return;
      }

      console.log(`Found ${messagesData.messages.length} messages`);
      setPageToken(messagesData.nextPageToken || null);
      setHasMore(!!messagesData.nextPageToken);

      // Process messages in batches of 10
      const batchSize = 10;
      const emailDetails = [];
      
      for (let i = 0; i < messagesData.messages.length; i += batchSize) {
        const batch = messagesData.messages.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(messagesData.messages.length / batchSize)}`);
        
        const batchPromises = batch.map(async (message: any) => {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`;
          console.log('Fetching details for message:', message.id);
          
          try {
            const detailResponse = await fetch(detailUrl, {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
            });

            if (!detailResponse.ok) {
              const errorData = await detailResponse.json();
              if (errorData.error?.code === 429) {
                console.log('Rate limit hit, waiting before retry...');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                return fetch(detailUrl, {
                  headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                  },
                }).then(res => res.json());
              }
              console.error(`Failed to fetch details for message ${message.id}:`, errorData);
              return null;
            }

            const emailData = await detailResponse.json();
            console.log('Successfully fetched details for message:', message.id);
            return emailData;
          } catch (err) {
            console.error(`Error fetching message ${message.id}:`, err);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        emailDetails.push(...batchResults.filter(Boolean));
        
        // Add a small delay between batches to avoid rate limits
        if (i + batchSize < messagesData.messages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Filter out any failed requests and extract unsubscribe links
      const processedEmails = emailDetails
        .filter(Boolean)
        .map(email => {
          const headers = email.payload.headers;
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          const organizationName = getOrganizationName(from);
          
          // Look for List-Unsubscribe header
          const unsubscribeHeader = headers.find((h: any) => 
            h.name.toLowerCase() === 'list-unsubscribe' || 
            h.name.toLowerCase() === 'list-unsubscribe-post'
          );
          
          // Parse the unsubscribe link
          let unsubscribeLink = null
          if (unsubscribeHeader?.value) {
            console.log('Found unsubscribe header:', unsubscribeHeader.value)
            // Handle multiple formats:
            // 1. <https://example.com/unsubscribe>
            // 2. <mailto:unsubscribe@example.com>
            // 3. https://example.com/unsubscribe
            // 4. Multiple links separated by commas
            const links = unsubscribeHeader.value.split(',').map((link: string) => link.trim())
            
            for (const link of links) {
              // Try to extract URL from angle brackets
              const bracketMatch = link.match(/<(https?:\/\/[^>]+)>/)
              if (bracketMatch) {
                unsubscribeLink = bracketMatch[1]
                break
              }
              
              // Try to extract direct URL
              const urlMatch = link.match(/https?:\/\/[^\s<>"]+/)
              if (urlMatch) {
                unsubscribeLink = urlMatch[0]
                break
              }
              
              // Handle mailto links
              const mailtoMatch = link.match(/<mailto:([^>]+)>/)
              if (mailtoMatch) {
                unsubscribeLink = `mailto:${mailtoMatch[1]}`
                break
              }
            }
            
            if (unsubscribeLink) {
              console.log('Extracted unsubscribe link:', unsubscribeLink)
            }
          }

          // Also check the email body for unsubscribe links
          let bodyUnsubscribeLink = null
          if (email.payload.parts) {
            const textPart = email.payload.parts.find((part: any) => part.mimeType === 'text/plain')
            if (textPart?.data) {
              const decodedBody = atob(textPart.data.replace(/-/g, '+').replace(/_/g, '/'))
              // Look for common unsubscribe patterns in the body
              const unsubscribePatterns = [
                /https?:\/\/[^\s<>"]+unsubscribe[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+opt[_-]?out[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+preferences[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+manage[^\s<>"]+subscription[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+email[^\s<>"]+preferences[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+subscription[^\s<>"]+center[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+account[^\s<>"]+preferences[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+profile[^\s<>"]+preferences[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+settings[^\s<>"]+/i,
                /https?:\/\/[^\s<>"]+preferences[^\s<>"]+/i
              ]
              
              for (const pattern of unsubscribePatterns) {
                const match = decodedBody.match(pattern)
                if (match) {
                  bodyUnsubscribeLink = match[0]
                  console.log('Found unsubscribe link in body:', bodyUnsubscribeLink)
                  break
                }
              }
            }
          }

          // Validate and clean up the final unsubscribe link
          const finalUnsubscribeLink = unsubscribeLink || bodyUnsubscribeLink
          let cleanedLink = null
          
          if (finalUnsubscribeLink) {
            try {
              // Handle mailto links
              if (finalUnsubscribeLink.startsWith('mailto:')) {
                cleanedLink = finalUnsubscribeLink
              } else {
                // Clean and validate HTTP(S) URLs
                const url = new URL(finalUnsubscribeLink)
                // Remove common tracking parameters
                const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'tracking_id', 'tracking', 'source', 'campaign']
                paramsToRemove.forEach(param => url.searchParams.delete(param))
                cleanedLink = url.toString()
              }
            } catch (err) {
              console.error('Invalid unsubscribe link:', finalUnsubscribeLink)
            }
          }

          return {
            id: email.id,
            organizationName,
            from,
            unsubscribeLink: cleanedLink,
            hasUnsubscribeLink: !!cleanedLink
          }
        });

      console.log('All processed emails:', processedEmails);
      if (isLoadMore) {
        setEmails(prev => [...prev, ...processedEmails]);
      } else {
        setEmails(processedEmails);
      }
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
      setPageToken(null);
      setHasMore(true);
      fetchEmails();
    }
  }, [status, session]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchEmails(true);
    }
  };

  const handleUnsubscribe = async (emailId: string, unsubscribeLink: string) => {
    try {
      setIsUnsubscribing(emailId)
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId,
          unsubscribeLink,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to unsubscribe')
      }

      // Remove the email from the list
      setEmails(prev => prev.filter(email => email.id !== emailId))
    } catch (error) {
      console.error('Error unsubscribing:', error)
      setError('Failed to unsubscribe. Please try again.')
    } finally {
      setIsUnsubscribing(null)
    }
  }

  // Function to unsubscribe from multiple emails
  const handleUnsubscribeAll = async () => {
    const emailsToUnsubscribe = emails.filter(email => email.unsubscribeLink)
    if (emailsToUnsubscribe.length === 0) return

    setIsUnsubscribingAll(true)
    setUnsubscribeProgress({ current: 0, total: emailsToUnsubscribe.length })

    // Process in batches of 5 to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < emailsToUnsubscribe.length; i += batchSize) {
      const batch = emailsToUnsubscribe.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (email) => {
          try {
            await handleUnsubscribe(email.id, email.unsubscribeLink)
            setUnsubscribeProgress(prev => ({ ...prev, current: prev.current + 1 }))
          } catch (error) {
            console.error(`Failed to unsubscribe from ${email.organizationName}:`, error)
          }
        })
      )
      // Add a small delay between batches
      if (i + batchSize < emailsToUnsubscribe.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    setIsUnsubscribingAll(false)
    setUnsubscribeProgress({ current: 0, total: 0 })
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const filteredEmails = showAllEmails ? emails : emails.filter(email => email.hasUnsubscribeLink);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Gmail Unsubscribe Tool</h1>
        
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

            {isLoading && !emails.length ? (
              <p>Loading...</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {showAllEmails ? 'All Senders' : 'Senders with Unsubscribe Links'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {!showAllEmails && emails.some(email => email.unsubscribeLink) && (
                      <Button
                        onClick={handleUnsubscribeAll}
                        disabled={isUnsubscribingAll}
                        variant="default"
                        size="sm"
                      >
                        {isUnsubscribingAll
                          ? `Unsubscribing... (${unsubscribeProgress.current}/${unsubscribeProgress.total})`
                          : 'Unsubscribe All'}
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowAllEmails(!showAllEmails)}
                      variant="outline"
                      size="sm"
                    >
                      {showAllEmails ? 'Show Only Unsubscribe Links' : 'Show All Senders'}
                    </Button>
                  </div>
                </div>
                {filteredEmails.length > 0 ? (
                  <>
                    <ul className="space-y-2">
                      {filteredEmails.map((email) => (
                        <li key={email.id} className="p-3 border rounded-lg shadow-sm hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{email.organizationName}</div>
                            {email.unsubscribeLink ? (
                              <button
                                onClick={() => handleUnsubscribe(email.id, email.unsubscribeLink)}
                                disabled={isUnsubscribing === email.id || isUnsubscribingAll}
                                className={`text-sm ${
                                  isUnsubscribing === email.id || isUnsubscribingAll
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-blue-600 hover:text-blue-800'
                                }`}
                              >
                                {isUnsubscribing === email.id
                                  ? 'Unsubscribing...'
                                  : 'Unsubscribe'}
                              </button>
                            ) : (
                              <div className="text-sm text-gray-500">No unsubscribe link</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {hasMore && (
                      <div className="mt-4 text-center">
                        <Button
                          onClick={loadMore}
                          disabled={isLoading}
                          variant="outline"
                        >
                          {isLoading ? 'Loading...' : 'Load More'}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p>No senders found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
} 