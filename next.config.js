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
  // The source ZIP route reads template files from public/, which serverless
  // hosts don't bundle into functions by default.
  outputFileTracingIncludes: {
    '/api/generate-source': ['./public/templates/**/*']
  },
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
        source: '/latex-packages/:path*',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
        ]
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
  async rewrites() {
    return [
      // Siglum requests missing fonts by name (e.g. phvb7t for Helvetica)
      {
        source: '/latex-packages/api/fetch/:font(phv[a-z0-9]+)',
        destination: '/latex-packages/api/fetch/helvetic'
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
