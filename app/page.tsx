'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, LogOut } from 'lucide-react';
import Navbar from '../app/components/Navbar';
import Footer from '../app/components/Footer';
import Link from 'next/link';

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
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [unsubscribeStatus, setUnsubscribeStatus] = useState<Record<string, 'success' | 'error' | 'pending'>>({})
  const [iframeKey, setIframeKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
      const batchSize = 50;
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

  const handleIframeLoad = (emailId: string) => {
    console.log(`Iframe loaded for email ${emailId}`)
    setUnsubscribeStatus(prev => ({ ...prev, [emailId]: 'success' }))
    setEmails(prev => prev.filter(email => email.id !== emailId))
  }

  const handleIframeError = (emailId: string) => {
    console.error(`Iframe failed to load for email ${emailId}`)
    setUnsubscribeStatus(prev => ({ ...prev, [emailId]: 'error' }))
  }

  const handleUnsubscribe = async (emailId: string, unsubscribeLink: string) => {
    setIsUnsubscribing(emailId)
    setUnsubscribeStatus(prev => ({ ...prev, [emailId]: 'pending' }))
    
    try {
      // First try the API endpoint
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

      // If API succeeds, also try the iframe method as backup
      if (unsubscribeLink.startsWith('http')) {
        setIframeKey(prev => prev + 1) // Force iframe refresh
      }

      setUnsubscribeStatus(prev => ({ ...prev, [emailId]: 'success' }))
      setEmails(prev => prev.filter(email => email.id !== emailId))
    } catch (error) {
      console.error('Error unsubscribing:', error)
      // If API fails, try the iframe method
      if (unsubscribeLink.startsWith('http')) {
        setIframeKey(prev => prev + 1) // Force iframe refresh
      } else {
        setUnsubscribeStatus(prev => ({ ...prev, [emailId]: 'error' }))
      }
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

  // Function to toggle email selection
  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(emailId)) {
        newSet.delete(emailId)
      } else {
        newSet.add(emailId)
      }
      return newSet
    })
  }

  // Function to select all emails in current batch
  const selectAllInBatch = () => {
    const newSelected = new Set(selectedEmails)
    filteredEmails.forEach(email => {
      if (email.unsubscribeLink) {
        newSelected.add(email.id)
      }
    })
    setSelectedEmails(newSelected)
  }

  // Function to deselect all emails
  const deselectAll = () => {
    setSelectedEmails(new Set())
  }

  // Function to unsubscribe from selected emails
  const handleUnsubscribeSelected = async () => {
    const emailsToUnsubscribe = filteredEmails.filter(email => 
      selectedEmails.has(email.id) && email.unsubscribeLink
    )
    if (emailsToUnsubscribe.length === 0) return

    setIsUnsubscribingAll(true)
    setUnsubscribeProgress({ current: 0, total: emailsToUnsubscribe.length })

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
      if (i + batchSize < emailsToUnsubscribe.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    setIsUnsubscribingAll(false)
    setUnsubscribeProgress({ current: 0, total: 0 })
    setSelectedEmails(new Set())
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const filteredEmails = showAllEmails ? emails : emails.filter(email => email.hasUnsubscribeLink);

  return (
    <>
    <Navbar />
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-foreground">Mega-Unsubscribe</h1>
        <div className="space-y-6 md:space-y-8 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-primary text-xl flex-shrink-0">•</span>
            <p className="text-left leading-relaxed">A privacy-focused tool to clean up your Gmail inbox by unsubscribing from unwanted emails.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-primary text-xl flex-shrink-0">•</span>
            <p className="text-left leading-relaxed">Scans only necessary metadata and unsubscribe links — no emails are read, stored, or shared.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-primary text-xl flex-shrink-0">•</span>
            <p className="text-left leading-relaxed">Built with Next.js and Google's official OAuth & Gmail API — ensuring secure, user-consented access at all times.</p>
          </div>
          <div className="mt-6 text-center px-4">
            <p className="text-muted-foreground">
              Your privacy is our priority. Read our{' '}
              <a 
                href="https://megaunsubscribe.sharjith.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:text-primary/80 font-medium text-sm"
              >
                Privacy Policy
              </a>
              {' '}to learn how we protect your data.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-4 text-foreground">Get Started</h1>
        <p className="mb-6 text-muted-foreground text-sm md:text-base">
          Easily manage your email subscriptions and unsubscribe from unwanted emails in your Gmail inbox.
          Our tool helps you identify and remove subscriptions with just a few clicks. By using our service, you agree to our{' '}
          <a 
            href="https://megaunsubscribe.sharjith.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:text-primary/80 font-medium text-sm"
          >
            Privacy Policy
          </a>.
        </p>
    
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900 dark:border-red-500 dark:text-red-200 text-sm md:text-base">
            {error}
          </div>
        )}
    
        {status !== 'authenticated' ? (
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col items-center justify-center space-y-4 py-8 md:py-12">
              <p className="text-foreground text-base md:text-lg font-medium">Please sign in to access your Gmail account.</p>
              <button 
                onClick={handleSignIn}
                disabled={isLoading}
                className="gsi-material-button w-full md:w-auto bg-white hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg border border-gray-200 px-6 md:px-8 py-3 flex items-center justify-center gap-3 min-w-[240px]"
              >
                <div className="gsi-material-button-icon">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 48 48" 
                    style={{ display: 'block' }}
                  >
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 text-sm md:text-base">
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </button>
            </div>

            {/* Demo Video Section */}
            <div className="mt-12 md:mt-16 mb-8 md:mb-12">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-lg md:text-xl text-muted-foreground">👋 Hey there! Want to see how Mega Unsubscribe works in action?</p>
                  <p className="text-base md:text-lg text-muted-foreground">🎥 I've got a short demo video for you — just scroll down and hit play!</p>
                  <p className="text-sm md:text-base text-muted-foreground">Let me know if you want help connecting your Gmail or have questions after watching.</p>
                </div>
                
                <div id="demo-video" className="relative w-full max-w-3xl mx-auto pb-[56.25%] h-0">
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/-18Xq9YfpbY?rel=0&modestbranding=1"
                    title="How Mega Unsubscribe Works"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-lg shadow-xl"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8 pt-6 md:pt-8 border-t border-border">
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">It's Time to Declutter Your Inbox</h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Gmail is great — until it's buried under newsletters, promotions, and unwanted subscriptions.
                  Mega-Unsubscribe helps you quickly scan and identify all your active email subscriptions, and lets you unsubscribe from them with powerful batch operations. No need to dig through hundreds of emails — we do the work, you stay in control.
                </p>
                <p className="text-sm md:text-base text-muted-foreground">
                  Everything runs securely on your device, and nothing is stored or shared. Your inbox, your rules.
                </p>
              </div>
    
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">100% Open Source. You Own It.</h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Mega-Unsubscribe is fully open-source and transparent. You can audit the code, host your own version, or even extend it however you like. No tracking, no hidden fees — just a tool built for people who value privacy, simplicity, and inbox sanity.
                </p>
              </div>
            </div>
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
                    {!showAllEmails && (
                      <>
                        {selectedEmails.size > 0 ? (
                          <Button
                            onClick={handleUnsubscribeSelected}
                            disabled={isUnsubscribingAll}
                            variant="default"
                            size="sm"
                          >
                            {isUnsubscribingAll
                              ? `Unsubscribing... (${unsubscribeProgress.current}/${unsubscribeProgress.total})`
                              : `Unsubscribe Selected (${selectedEmails.size})`}
                          </Button>
                        ) : (
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
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={selectAllInBatch}
                            variant="outline"
                            size="sm"
                          >
                            Select All
                          </Button>
                          <Button
                            onClick={deselectAll}
                            variant="outline"
                            size="sm"
                          >
                            Deselect All
                          </Button>
                        </div>
                      </>
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
                            <div className="flex-1">
                              <div className="font-medium">{email.organizationName}</div>
                              <div className="text-sm text-gray-500">{email.from}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {email.unsubscribeLink ? (
                                <div className="flex items-center gap-2">
                                  {!showAllEmails && (
                                    <input
                                      type="checkbox"
                                      checked={selectedEmails.has(email.id)}
                                      onChange={() => toggleEmailSelection(email.id)}
                                      className="h-4 w-4 rounded border-gray-300"
                                    />
                                  )}
                                  <button
                                    onClick={() => handleUnsubscribe(email.id, email.unsubscribeLink)}
                                    disabled={isUnsubscribing === email.id}
                                    className={`text-sm ${
                                      isUnsubscribing === email.id
                                        ? 'text-gray-500'
                                        : unsubscribeStatus[email.id] === 'success'
                                        ? 'text-green-600'
                                        : unsubscribeStatus[email.id] === 'error'
                                        ? 'text-red-600 hover:text-red-800'
                                        : 'text-blue-600 hover:text-blue-800'
                                    }`}
                                  >
                                    {isUnsubscribing === email.id
                                      ? 'Unsubscribing...'
                                      : unsubscribeStatus[email.id] === 'success'
                                      ? 'Unsubscribed'
                                      : unsubscribeStatus[email.id] === 'error'
                                      ? 'Retry'
                                      : 'Unsubscribe'}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">No unsubscribe link</div>
                              )}
                            </div>
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
                  <p className="text-center text-gray-500">No emails found</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
    </>
  );
} 