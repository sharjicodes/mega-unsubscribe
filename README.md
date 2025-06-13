# Mega Unsubscribe

A Next.js application that helps you unsubscribe from unwanted emails in your Gmail inbox. The application uses Google OAuth to securely access your Gmail account and finds emails with unsubscribe links.

## Features

- Client-side Google OAuth authentication
- Automatic detection of emails with unsubscribe links
- Clean and modern user interface
- No server-side API required
- One-click unsubscribe functionality

## Prerequisites

- Node.js 18.x or later
- A Google Cloud Platform account
- Gmail account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mega-unsubscribe.git
cd mega-unsubscribe
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google OAuth:
   - Go to the [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable the Gmail API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000` as an authorized JavaScript origin
   - Add `http://localhost:3000` as an authorized redirect URI

4. Create a `.env.local` file in the root directory with your Google Client ID:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Security

- The application only requests read-only access to your Gmail account
- All authentication is handled directly through Google's OAuth flow
- No email data is stored anywhere
- The application only processes emails with unsubscribe links
- No server-side API or secrets required

## How it Works

1. The application uses the Google API JavaScript client library
2. Users sign in with their Google account
3. The application fetches emails directly from Gmail using the Gmail API
4. It scans email headers for unsubscribe links
5. Users can click the unsubscribe links to opt out of unwanted emails

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 