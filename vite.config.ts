import { defineConfig } from "vite";
// @ts-ignore
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
// @ts-ignore
import glsl from "vite-plugin-glsl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      // React 18の新しい機能を使用
      jsxRuntime: 'automatic',
    }),
    // runtimeErrorOverlay(), // エラーオーバーレイプラグインを無効化
    glsl(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  publicDir: path.resolve(__dirname, "client", "public"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-switch'],
          game: ['zustand'],
        }
      }
    }
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
  server: {
    host: true,
    port: 5001,
    // セッション安定性を改善するための設定
    hmr: {
      overlay: false,
      protocol: 'ws',
      clientPort: 5001,
      timeout: 30000,
      port: 24678,
    },
    // ポート使用時の設定
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        timeout: 30000,
        headers: {
          'Connection': 'keep-alive',
        }
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        timeout: 30000,
      },
      '/ws': {
        target: 'ws://localhost:5000',
        changeOrigin: true,
        ws: true,
        timeout: 30000,
      }
    }
  },
  // Reactの最適化設定
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
    // 依存関係の前ビルドを最適化
    entries: ['./client/src/main.tsx'],
    exclude: ['@stagewise/toolbar-next'], // stagewiseツールバーを除外
  },
  // エラーハンドリングの改善
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  // セッション安定性のための追加設定
  clearScreen: false,
  logLevel: 'info',
});
