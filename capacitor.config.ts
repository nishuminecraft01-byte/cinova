import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cinova.app',
  appName: 'CINOVA',
  webDir: 'android-shell',
  server: {
    url: 'https://cinova.pages.dev',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#080506',
  },
};

export default config;
