interface Config {
  appName: string;
  isProductionEnvironment: boolean;
  tableRowsPerPageOptions: number[];
  rfqEnableRequestQuotation: boolean;
  maxRfqPictures: number;
  systemStartDate: string;
  dpk: string;
  dkpApi: string;
  timezone: string;
  firebaseApiKey: string;
}

function normalizeSystemStartDate(value?: string): string {
  const raw = value?.trim();

  if (!raw) {
    return '';
  }

  const slashDateMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashDateMatch) {
    const [, day, month, year] = slashDateMatch;
    return `${year}-${month}-${day}`;
  }

  return raw;
}

function normalizePositiveInteger(value?: string, fallback = 12): number {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const systemStartDate = normalizeSystemStartDate(import.meta.env.REACT_APP_SYSTEM_START_DATE);

const config: Config = {
  appName: import.meta.env.REACT_APP_NAME || 'dpk_flower',
  isProductionEnvironment: import.meta.env.REACT_APP_ENVIRONMENT === 'production',
  tableRowsPerPageOptions: [10, 20, 50, 100],
  rfqEnableRequestQuotation: String(import.meta.env.REACT_APP_RFQ_ENABLE_REQUEST_QUOTATION || '').toLowerCase() === 'true',
  maxRfqPictures: normalizePositiveInteger(import.meta.env.REACT_APP_MAX_RFQ_PICTURES, 12),
  systemStartDate,
  dpk: import.meta.env.REACT_APP_NUTALIG_API || '',
  dkpApi: import.meta.env.REACT_APP_NUTALIG_API || '',
  timezone: 'Asia/Bangkok',
  firebaseApiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY || ''
};

export default config;
