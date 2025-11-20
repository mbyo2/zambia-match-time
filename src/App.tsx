
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const { isOnline } = useOfflineDetection();
  
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner isOnline={isOnline} />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
