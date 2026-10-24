// @ts-check

/** @type {import('next').NextConfig} **/
const workerHeaders = [
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin'
  }
]

const NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true
  },
  async headers() {
    return [
      {
        source: '/siglum-worker.js',
        headers: workerHeaders
      },
      {
        source: '/pdf.worker.min.mjs',
        headers: workerHeaders
      },
      {
        source: '/generator/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          }
        ]
      }
    ]
  },
  // Handle canvas dependency for react-pdf
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false
      }
    }
    return config
  }
}

module.exports = NextConfig
