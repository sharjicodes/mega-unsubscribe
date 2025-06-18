import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Add any custom meta tags, scripts, or links here */}
        <meta name="description" content="Gmail Unsubscribe Tool - Easily manage your email subscriptions" />
        <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 