import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  // Silence Turbopack warning (Next.js 16+)
  turbopack: {},
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  },
  fallbacks: {
    document: "/offline",
  },
})(nextConfig);
