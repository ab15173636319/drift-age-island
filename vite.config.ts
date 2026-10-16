import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  // Electron 生产环境通过 file:// 加载 dist，资源需用相对路径
  base: "./",
  server: {
    // 避开 6666 等 Chromium 禁用端口，以及其它项目占用的 5173 / 1420
    port: 4321,
    strictPort: true,
    host: "127.0.0.1",
  },
  build: {
    target: ["es2021", "chrome120"],
    minify: "esbuild",
    sourcemap: false,
  },
});
