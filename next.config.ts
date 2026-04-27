import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // Don't run SW aggressively in dev
});

const nextConfig: NextConfig = {
  // WebLLM requires SharedArrayBuffer — needs cross-origin isolation
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },

  // Silence the "webpack config but no turbopack config" warning
  // (we don't need custom webpack config with Turbopack)
  turbopack: {},
};

export default withSerwist(nextConfig);
