import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.englishmaster.app',
  appName: 'ENGLISH MASTER',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
