
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Detectar automaticamente o base path
const getBasePath = (): string => {
  // 1. Verificar se há variável de ambiente definida
  const envBasePath = process.env.VITE_BASE_PATH;
  if (envBasePath && envBasePath !== '/') {
    return envBasePath;
  }
  
  return '/';
};

const basePath = getBasePath();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: basePath,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
