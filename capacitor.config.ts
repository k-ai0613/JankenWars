import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jankenwars.app',
  appName: 'JankenWars',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: 'android.keystore',
      keystoreAlias: 'key0',
    }
  }
};

export default config; 