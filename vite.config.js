import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { updateCommonjsPlugin } from "./Update";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), updateCommonjsPlugin()],
  define: {
    global: 'globalThis',
    // Fix for ReadableStream compatibility
    'process.env': {},
  },
  server: {
    // host: "192.168.1.34",
    port: 5173,
  },
  resolve: {
    alias: {
      // Fix for AWS SDK browser compatibility
      "./runtimeConfig": "./runtimeConfig.browser",
      // Additional stream compatibility fixes
      "stream": "stream-browserify",
      "util": "util",
    },
  },
  optimizeDeps: {
    include: [
      '@aws-sdk/client-s3',
      '@aws-sdk/lib-storage',
      '@aws-sdk/s3-request-presigner',
      'stream-browserify',
      'util'
    ],
    exclude: []
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        globals: {
          util: 'util',
          stream: 'stream'
        }
      }
    }
  }
});