import type { NextConfig } from "next";

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

export default nextConfig;
