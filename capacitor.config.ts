import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kuplulumert.openingtrainer',
  appName: 'Opening Trainer',
  webDir: 'dist',
  backgroundColor: '#14151a',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#14151a',
  },
};

export default config;
