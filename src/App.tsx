
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { lazy, Suspense } from "react";
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

// Lazy-loaded sub-pages (route-level code splitting)
const ProfileEditPage = lazy(() => import("./components/profile/ProfileEditPage"));
const SecuritySettings = lazy(() => import("./components/security/SecuritySettings"));
const ContentModerationManager = lazy(() => import("./components/safety/ContentModerationManager"));
const VerificationManager = lazy(() => import("./components/safety/VerificationManager"));
const PrivacyPolicy = lazy(() => import("./components/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/legal/TermsOfService"));
const SafetyCenter = lazy(() => import("./components/safety/SafetyCenter"));
const CommunityGuidelines = lazy(() => import("./components/legal/CommunityGuidelines"));
const DevActions = lazy(() => import("./components/admin/DevActions"));
const SubscriptionPage = lazy(() => import("./components/subscription/SubscriptionPage"));
const AccommodationsPage = lazy(() => import("./components/accommodations/AccommodationsPage"));
const ProfileViews = lazy(() => import("./components/social/ProfileViews"));

const SuspendedSubPage = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <SubPageRoute title={title}>
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>}>
      {children}
    </Suspense>
  </SubPageRoute>
);

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
                    <Route path="profile/edit" element={<Suspense fallback={null}><ProfileEditPage /></Suspense>} />
                    <Route path="profile/views" element={<SuspendedSubPage title="Profile Views"><ProfileViews /></SuspendedSubPage>} />
                    <Route path="settings/security" element={<SuspendedSubPage title="Security Settings"><SecuritySettings /></SuspendedSubPage>} />
                    <Route path="settings/moderation" element={<SuspendedSubPage title="Content Moderation"><ContentModerationManager /></SuspendedSubPage>} />
                    <Route path="settings/verification" element={<SuspendedSubPage title="Profile Verification"><VerificationManager /></SuspendedSubPage>} />
                    <Route path="settings/privacy" element={<SuspendedSubPage title="Privacy Policy"><PrivacyPolicy /></SuspendedSubPage>} />
                    <Route path="settings/terms" element={<SuspendedSubPage title="Terms of Service"><TermsOfService /></SuspendedSubPage>} />
                    <Route path="settings/safety" element={<SuspendedSubPage title="Safety Center"><SafetyCenter /></SuspendedSubPage>} />
                    <Route path="settings/guidelines" element={<SuspendedSubPage title="Community Guidelines"><CommunityGuidelines /></SuspendedSubPage>} />
                    <Route path="settings/admin" element={<SuspendedSubPage title="Admin Panel"><DevActions /></SuspendedSubPage>} />
                    <Route path="settings/subscription" element={<SuspendedSubPage title="Subscription"><SubscriptionPage /></SuspendedSubPage>} />
                    <Route path="settings/manage-venues" element={<SuspendedSubPage title="Manage Venues"><AccommodationsPage /></SuspendedSubPage>} />
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
