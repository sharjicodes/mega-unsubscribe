'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

interface EmailSubscription {
  id: string;
  from: string;
  subject: string;
  unsubscribeLink: string;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Enhanced debug logging
console.log('Application Initialization:');
console.log('------------------------');
console.log('Environment Variables:');
console.log('- NEXT_PUBLIC_GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
console.log('- Client ID Status:', GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('- Client ID Format:', GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com') ? 'Valid' : 'Invalid');
console.log('------------------------');

const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type: string;
              theme: string;
              size: string;
              text: string;
              shape: string;
              logo_alignment: string;
              width: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
    gapi: {
      client: {
        init: (config: {
          apiKey?: string;
          clientId: string;
          discoveryDocs: string[];
          scope: string;
        }) => Promise<void>;
        gmail: {
          users: {
            messages: {
              list: (params: { userId: string; q: string; maxResults: number }) => Promise<{
                result: {
                  messages: Array<{ id: string }>;
                };
              }>;
              get: (params: { userId: string; id: string }) => Promise<{
                result: {
                  payload: {
                    headers: Array<{ name: string; value: string }>;
                  };
                };
              }>;
            };
          };
        };
      };
    };
  }
}

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [emails, setEmails] = useState<EmailSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let identityScript: HTMLScriptElement | null = null;
    let gapiScript: HTMLScriptElement | null = null;
    let checkInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const loadGoogleScripts = async () => {
      // Load Google Identity Services
      const loadIdentity = () => {
        return new Promise<void>((resolve, reject) => {
          if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
            console.log('Google Identity script already loaded');
            resolve();
            return;
          }

          console.log('Loading Google Identity script...');
          identityScript = document.createElement('script');
          identityScript.src = 'https://accounts.google.com/gsi/client';
          identityScript.async = true;
          identityScript.defer = true;
          
          identityScript.onload = () => {
            console.log('Google Identity script loaded successfully');
            resolve();
          };
          
          identityScript.onerror = (error) => {
            console.error('Failed to load Google Identity script:', error);
            reject(new Error('Failed to load Google Identity script'));
          };

          document.body.appendChild(identityScript);
        });
      };

      // Load Gmail API
      const loadGapi = () => {
        return new Promise<void>((resolve, reject) => {
          if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
            console.log('Gmail API script already loaded');
            resolve();
            return;
          }

          console.log('Loading Gmail API script...');
          gapiScript = document.createElement('script');
          gapiScript.src = 'https://apis.google.com/js/api.js';
          gapiScript.async = true;
          gapiScript.defer = true;
          
          gapiScript.onload = () => {
            console.log('Gmail API script loaded successfully');
            resolve();
          };
          
          gapiScript.onerror = (error) => {
            console.error('Failed to load Gmail API script:', error);
            reject(new Error('Failed to load Gmail API script'));
          };

          document.body.appendChild(gapiScript);
        });
      };

      try {
        await Promise.all([loadIdentity(), loadGapi()]);
        checkGoogleLoaded();
      } catch (error) {
        console.error('Error loading Google scripts:', error);
        setError('Failed to load Google services');
      }
    };

    const checkGoogleLoaded = () => {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id && window.gapi) {
          console.log('Google services loaded successfully');
          cleanup();
          setIsGoogleLoaded(true);
          // Initialize Google Identity after services are loaded
          initializeGoogleIdentity();
        }
      }, 100);

      timeoutId = setTimeout(() => {
        cleanup();
        setError('Timeout waiting for Google services to initialize');
      }, 5000);
    };

    const cleanup = () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const initializeGoogleIdentity = async () => {
      try {
        console.log('Starting Google Identity initialization...');

        if (!GOOGLE_CLIENT_ID) {
          throw new Error('Google Client ID is not configured');
        }

        // Double check that Google Identity is loaded
        if (!window.google?.accounts?.id) {
          throw new Error('Google Identity not loaded');
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        // Wait for the DOM to be ready and render the button
        const renderButton = () => {
          const buttonDiv = document.getElementById('google-signin-button');
          if (buttonDiv && window.google?.accounts?.id) {
            window.google.accounts.id.renderButton(buttonDiv, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 250,
            });
            console.log('Google Sign-In button rendered');
          } else {
            console.log('Waiting for button container or Google Identity...');
            // Try again after a short delay
            setTimeout(renderButton, 100);
          }
        };

        // Start the rendering process
        renderButton();
        console.log('Google Identity initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Identity:', error);
        setError('Failed to initialize Google Identity');
      }
    };

    loadGoogleScripts();

    // Cleanup function
    return () => {
      cleanup();
      if (identityScript && identityScript.parentNode) {
        identityScript.parentNode.removeChild(identityScript);
      }
      if (gapiScript && gapiScript.parentNode) {
        gapiScript.parentNode.removeChild(gapiScript);
      }
    };
  }, []);

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      console.log('Received credential response');
      // Decode the JWT token to get the access token
      const token = response.credential;
      setAccessToken(token);
      setIsSignedIn(true);
      await fetchEmails();
    } catch (error) {
      console.error('Error handling credential response:', error);
      setError('Failed to sign in with Google');
    }
  };

  const fetchEmails = async () => {
    if (!isSignedIn || !accessToken) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Loading Gmail API client...');
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            console.log('Initializing Gmail API...');
            await window.gapi.client.init({
              apiKey: '',
              clientId: GOOGLE_CLIENT_ID!,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
              scope: SCOPES,
            });
            console.log('Gmail API initialized successfully');
            resolve();
          } catch (error) {
            console.error('Error initializing Gmail API:', error);
            reject(error);
          }
        });
      });

      console.log('Fetching emails...');
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: 'has:user -category:promotions -category:social',
        maxResults: 50,
      });

      const messages = response.result.messages || [];
      console.log(`Found ${messages.length} messages`);

      const emailPromises = messages.map(async (message: any) => {
        const email = await window.gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        const headers = email.result.payload.headers;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
        const from = headers.find((h: any) => h.name === 'From')?.value || '';
        const listUnsubscribe = headers.find((h: any) => h.name === 'List-Unsubscribe')?.value;

        if (listUnsubscribe) {
          return {
            id: message.id,
            from,
            subject,
            unsubscribeLink: listUnsubscribe,
          };
        }
        return null;
      });

      const results = await Promise.all(emailPromises);
      const validEmails = results.filter((email): email is EmailSubscription => email !== null);
      console.log(`Found ${validEmails.length} emails with unsubscribe links`);
      setEmails(validEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  if (!isGoogleLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Loading Google Sign-In...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Mega Unsubscribe
        </h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}
        
        {!isSignedIn ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">
              Sign in with your Google account to start cleaning up your inbox
            </p>
            <div id="google-signin-button" className="flex justify-center"></div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                Your Email Subscriptions
              </h2>
              <div className="space-x-4">
                <button
                  onClick={fetchEmails}
                  disabled={loading}
                  className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh List'}
                </button>
                <button
                  onClick={() => {
                    setIsSignedIn(false);
                    setAccessToken(null);
                    setEmails([]);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {emails.length > 0 ? (
              <div className="space-y-4">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex items-start gap-4">
                      <EnvelopeIcon className="w-6 h-6 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium">{email.from}</h3>
                        <p className="text-gray-600 text-sm mb-2">{email.subject}</p>
                        <a
                          href={email.unsubscribeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-secondary text-sm font-medium"
                        >
                          Unsubscribe
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600">
                {loading
                  ? 'Searching for emails with unsubscribe links...'
                  : 'No emails with unsubscribe links found'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 