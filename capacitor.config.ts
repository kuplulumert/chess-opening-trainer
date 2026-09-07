import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kuplulumert.openingtrainer',
  appName: 'Opening Trainer',
  webDir: 'dist',
  backgroundColor: '#14151a',
  ios: {
    // 'never', matching MainViewController: the page reserves safe-area
    // space itself via CSS env(safe-area-inset-*), so WKWebView must not
    // also add its own inset. Leaving this on 'automatic' contradicted
    // the Swift side and doubled the offset the layout is built around.
    contentInset: 'never',
    backgroundColor: '#14151a',
  },
  plugins: {
    SplashScreen: {
      // Held until the web home screen has rendered, then hidden from JS
      // with a fade (see hideSplash in src/utils/native.ts) — the launch
      // storyboard shows the same rook in the same spot, so the handoff
      // is a cross-fade around a logo that never moves.
      launchAutoHide: false,
      backgroundColor: '#14151a',
      showSpinner: false,
    },
    StatusBar: {
      // Light text for the dark theme; useTheme switches it at runtime.
      style: 'DARK',
    },
  },
};

export default config;
