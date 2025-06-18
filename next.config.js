/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https:;
              connect-src 'self' https://gmail.googleapis.com https://oauth2.googleapis.com;
              frame-src 'self' https://accounts.google.com https://content.googleapis.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com;
              object-src 'none';
              media-src 'self';
              form-action 'self';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'megaunsubscribe.vercel.app',
          },
        ],
        destination: 'https://megaunsubscribe.sharjith.com/:path*',
        permanent: true,
      },
    ];
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'app'),
    };
    return config;
  },
};

module.exports = nextConfig;
