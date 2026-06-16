import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  // We provide our own service worker logic (push handlers) and let next-pwa
  // inject the Workbox precache/runtime-caching around it.
  customWorkerSrc: "src/worker",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    runtimeCaching: [
      {
        // Cache GET API reads so previously-loaded data is viewable offline.
        urlPattern: ({ url, request }) =>
          url.pathname.startsWith("/api/") && request.method === "GET",
        handler: "NetworkFirst",
        options: {
          cacheName: "commitdaily-api-reads",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
