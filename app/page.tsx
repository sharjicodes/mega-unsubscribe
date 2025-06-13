'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { google } from 'googleapis';

interface EmailSubscription {
  id: string;
  from: string;
  subject: string;
  unsubscribeLink: string;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [emails, setEmails] = useState<EmailSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [gapi, setGapi] = useState<any>(null);

  useEffect(() => {
    // Load the Google API client
    const loadGoogleApi = async () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', initClient);
      };
      document.body.appendChild(script);
    };

    loadGoogleApi();
  }, []);

  const initClient = async () => {
    try {
      await window.gapi.client.init({
        apiKey: GOOGLE_CLIENT_ID,
        clientId: GOOGLE_CLIENT_ID,
        scope: SCOPES,
      });

      // Listen for sign-in state changes
      window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      // Handle the initial sign-in state
      updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
    } catch (error) {
      console.error('Error initializing Google API client:', error);
    }
  };

  const updateSigninStatus = (isSignedIn: boolean) => {
    setIsSignedIn(isSignedIn);
    if (isSignedIn) {
      fetchEmails();
    }
  };

  const handleSignIn = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signOut();
      setEmails([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const fetchEmails = async () => {
    if (!isSignedIn) return;
    
    setLoading(true);
    try {
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: 'has:user -category:promotions -category:social',
        maxResults: 50,
      });

      const messages = response.result.messages || [];
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
      setEmails(results.filter((email): email is EmailSubscription => email !== null));
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Mega Unsubscribe
        </h1>
        
        {!isSignedIn ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">
              Sign in with your Google account to start cleaning up your inbox
            </p>
            <button
              onClick={handleSignIn}
              className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Sign in with Google
            </button>
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
                  onClick={handleSignOut}
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