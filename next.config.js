/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/api/auth/error",
        destination: "/login",
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
