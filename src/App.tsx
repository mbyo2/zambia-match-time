
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import AppGate from "./components/AppGate";
import MainLayout from "./components/MainLayout";
import SubPageRoute from "./components/SubPageRoute";
import DiscoverPage from "./components/discover/DiscoverPage";
import MatchesPage from "./components/matches/MatchesPage";
import ProfilePage from "./components/profile/ProfilePage";
import ProfileEditPage from "./components/profile/ProfileEditPage";
import SecuritySettings from "./components/security/SecuritySettings";
import ContentModerationManager from "./components/safety/ContentModerationManager";
import VerificationManager from "./components/safety/VerificationManager";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import TermsOfService from "./components/legal/TermsOfService";
import SafetyCenter from "./components/safety/SafetyCenter";
import CommunityGuidelines from "./components/legal/CommunityGuidelines";
import DevActions from "./components/admin/DevActions";
import SubscriptionPage from "./components/subscription/SubscriptionPage";
import AccommodationsPage from "./components/accommodations/AccommodationsPage";
import ProfileViews from "./components/social/ProfileViews";

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <OfflineBanner isOnline={isOnline} />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="/app" element={<AppGate />}>
                  <Route element={<MainLayout />}>
                    <Route path="discover" element={<DiscoverPage />} />
                    <Route path="matches" element={<MatchesPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="profile/edit" element={<ProfileEditPage />} />
                    <Route path="profile/views" element={<SubPageRoute title="Profile Views"><ProfileViews /></SubPageRoute>} />
                    <Route path="settings/security" element={<SubPageRoute title="Security Settings"><SecuritySettings /></SubPageRoute>} />
                    <Route path="settings/moderation" element={<SubPageRoute title="Content Moderation"><ContentModerationManager /></SubPageRoute>} />
                    <Route path="settings/verification" element={<SubPageRoute title="Profile Verification"><VerificationManager /></SubPageRoute>} />
                    <Route path="settings/privacy" element={<SubPageRoute title="Privacy Policy"><PrivacyPolicy /></SubPageRoute>} />
                    <Route path="settings/terms" element={<SubPageRoute title="Terms of Service"><TermsOfService /></SubPageRoute>} />
                    <Route path="settings/safety" element={<SubPageRoute title="Safety Center"><SafetyCenter /></SubPageRoute>} />
                    <Route path="settings/guidelines" element={<SubPageRoute title="Community Guidelines"><CommunityGuidelines /></SubPageRoute>} />
                    <Route path="settings/admin" element={<SubPageRoute title="Admin Panel"><DevActions /></SubPageRoute>} />
                    <Route path="settings/subscription" element={<SubPageRoute title="Subscription"><SubscriptionPage /></SubPageRoute>} />
                    <Route path="settings/manage-venues" element={<SubPageRoute title="Manage Venues"><AccommodationsPage /></SubPageRoute>} />
                    <Route index element={<Navigate to="discover" replace />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
