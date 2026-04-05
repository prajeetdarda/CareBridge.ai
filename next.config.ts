import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev HMR / _next/* when using a public tunnel (otherwise 401 on webpack-hmr WebSocket)
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
};

export default nextConfig;
