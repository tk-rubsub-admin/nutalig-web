interface Config {
  appName: string;
  isProductionEnvironment: boolean;
  tableRowsPerPageOptions: number[];
  dpk: string;
  dkpApi: string;
  timezone: string;
  firebaseApiKey: string;
}

const config: Config = {
  appName: import.meta.env.REACT_APP_NAME || 'dpk_flower',
  isProductionEnvironment: import.meta.env.REACT_APP_ENVIRONMENT === 'production',
  tableRowsPerPageOptions: [10, 20, 50, 100],
  dpk: import.meta.env.REACT_APP_NUTALIG_API || '',
  dkpApi: import.meta.env.REACT_APP_NUTALIG_API || '',
  timezone: 'Asia/Bangkok',
  firebaseApiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY || ''
};

export default config;
