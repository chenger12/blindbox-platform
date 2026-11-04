import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native app wrapper (iOS + Android) around the same Angular build as the website.
 * Change appId / appName once the brand name is final — appId cannot change after store release.
 */
const config: CapacitorConfig = {
  appId: 'com.yourbrand.blindbox',
  appName: 'Blind Box',
  webDir: 'dist/mengbox/browser',
  backgroundColor: '#0a0d1f',
  ios: { contentInset: 'never' },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 900, backgroundColor: '#0a0d1f', showSpinner: false },
    StatusBar: { overlaysWebView: true, style: 'DARK' }
  }
};

export default config;
