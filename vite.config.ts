// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ✅ Combined config for performance + aliasing
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 🔹 Split heavy 3D and UI libraries for faster incremental loading
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          vendor: ["react", "react-dom", "zustand", "framer-motion"],
        },
      },
    },
  },

  optimizeDeps: {
    include: ["three", "@react-three/fiber", "@react-three/drei"],
  },

  server: {
    host: true, // allows LAN access for testing
    port: 5173, // default Vite port
  },
});
