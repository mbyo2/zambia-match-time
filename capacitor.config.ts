import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0ba3455787ad4daf962583b174e3a3f6',
  appName: 'zambia-match-time',
  webDir: 'dist',
  server: {
    url: 'https://0ba34557-87ad-4daf-9625-83b174e3a3f6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
  },
};

export default config;
