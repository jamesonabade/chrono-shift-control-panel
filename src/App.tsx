
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Detectar automaticamente o basename baseado na variável de ambiente ou URL atual
const getBasename = (): string => {
  // 1. Verificar se há variável de ambiente definida
  const envBasePath = import.meta.env.VITE_BASE_PATH;
  if (envBasePath && envBasePath !== '/') {
    return envBasePath;
  }
  
  // 2. Detectar contexto pela URL atual em produção
  const pathname = window.location.pathname;
  const hostname = window.location.hostname;
  
  // Se não for localhost, tentar detectar contexto
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0 && !pathSegments[0].includes('.')) {
      return `/${pathSegments[0]}`;
    }
  }
  
  return '/';
};

const basename = getBasename();

console.log('🎯 Router basename detectado:', basename);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
