import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow loading assets (like logo.png) from the repo root.
    fs: {
      allow: ["..", "../.."],
    },
  }
});
