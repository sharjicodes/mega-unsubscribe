'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, LogOut } from 'lucide-react';

// Gmail API scopes
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

// Google Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function Home() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Load Google API script
    const loadGoogleScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.head.appendChild(script);
      });
    };

    const initializeGoogleAuth = async () => {
      try {
        console.log('Starting Google Auth initialization...');
        await loadGoogleScript();

        if (!GOOGLE_CLIENT_ID) {
          throw new Error('Google Client ID is not configured');
        }

        // Initialize OAuth2 token client
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.access_token) {
              console.log('Access token received successfully');
              setAccessToken(response.access_token);
              setIsSignedIn(true);
              fetchEmails(response.access_token);
            }
          },
          error_callback: (error) => {
            console.error('OAuth2 error:', error);
            setError(`Authentication error: ${error.message}`);
          }
        });

        // Store tokenClient in window for button click handler
        (window as any).tokenClient = tokenClient;
        console.log('Google OAuth2 initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Auth:', error);
        setError('Failed to initialize Google Auth');
      }
    };

    initializeGoogleAuth();
  }, []);

  const handleSignIn = () => {
    try {
      if (!(window as any).tokenClient) {
        throw new Error('Token client not initialized');
      }
      (window as any).tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Error requesting access token:', error);
      setError('Failed to sign in with Google');
    }
  };

  const fetchEmails = async (token?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentToken = token || accessToken;
      if (!currentToken) {
        throw new Error('No access token available');
      }

      console.log('Fetching emails with token:', currentToken.substring(0, 20) + '...');
      
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=has:user -category:promotions -category:social&maxResults=50',
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gmail API error:', errorData);
        throw new Error(`Failed to fetch emails: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Emails fetched successfully:', data);
      setEmails(data.messages || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch emails');
    } finally {
      setIsLoading(false);
    }
  };

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
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {!isSignedIn ? (
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleSignIn}
                  className="w-full max-w-xs flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Sign in with Google
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Your Emails</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsSignedIn(false);
                      setAccessToken(null);
                      setEmails([]);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : emails.length > 0 ? (
                  <div className="space-y-2">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {email.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No emails found
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 