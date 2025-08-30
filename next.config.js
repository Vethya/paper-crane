// @ts-check

/** @type {import('next').NextConfig} **/
const NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true
  },
  // Handle canvas dependency for react-pdf
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      }
    }
    return config
  },
}

module.exports = NextConfig
