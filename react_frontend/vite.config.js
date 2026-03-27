import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // ✅ dev: /
  // ✅ build(GitHub Pages): /boardgame/
  base: command === "serve" ? "/" : "/boardgame/",
}));