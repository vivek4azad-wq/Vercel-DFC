import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dfccil.railportal',
  appName: 'DFCCIL Rail ERP',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://dfcc-erp.vercel.app',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a'
    }
  }
};

export default config;
