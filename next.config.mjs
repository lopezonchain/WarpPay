/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },

  // Proxy a Warpcast para evitar problemas de CORS
  async rewrites() {
    return [
      {
        source: "/api/warpcast/v2/:path*",
        destination: "https://api.warpcast.com/v2/:path*",
      },
      {
        source: "/api/warpcast/fc/:path*",
        destination: "https://api.warpcast.com/fc/:path*",
      },
    ];
  },
};

export default nextConfig;
