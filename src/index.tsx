import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';
import { AuthProvider } from 'auth/AuthContext';
import { PermissionProvider } from 'auth/PermissionContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import AppThemeProvider from 'theme/AppThemeProvider';
import App from './App';
import reportWebVitals from './reportWebVitals';
import config from './config';

// Ensure that internationalization is bundled into app
import './i18n';

const queryClient = new QueryClient();

if (config.isProductionEnvironment) {
  // eslint-disable-next-line
  console.info('[Application] Running in production mode.');
  Sentry.init({
    dsn: config.sentry.dsn,
    release: `${config.appName}@${config.appVersion}`,
    integrations: [new Integrations.BrowserTracing()],
    environment: config.sentry.environment,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0
  });
} else {
  // eslint-disable-next-line
  console.info('[Application] Running in development mode.');
}

ReactDOM.render(
  <React.StrictMode>
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PermissionProvider>
            <App />
          </PermissionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
