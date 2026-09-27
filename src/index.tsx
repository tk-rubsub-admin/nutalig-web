import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';
import { CssBaseline, StylesProvider } from '@material-ui/core';
import {
  createMuiTheme as createLegacyMuiTheme,
  ThemeProvider as LegacyMuiThemeProvider
} from '@material-ui/core/styles';
import {
  createTheme as createMuiTheme,
  ThemeProvider as MuiThemeProvider
} from '@mui/material/styles';
import { AuthProvider } from 'auth/AuthContext';
import { PermissionProvider } from 'auth/PermissionContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import theme from 'theme';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { THEMES } from 'theme-constants';
import App from './App';
import reportWebVitals from './reportWebVitals';
import config from './config';

// Ensure that internationalization is bundled into app
import './i18n';

const queryClient = new QueryClient();
const fontFamily =
  '"Noto Sans Thai", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const appTheme = theme(THEMES.DEFAULT);
const muiFontTheme = createMuiTheme({
  typography: {
    fontFamily,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500
  }
});
const legacyMuiTheme = createLegacyMuiTheme({
  typography: {
    fontFamily,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500
  }
});

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

console.log(THEMES.GREEN);

ReactDOM.render(
  <React.StrictMode>
    <StylesProvider injectFirst>
      <LegacyMuiThemeProvider theme={legacyMuiTheme}>
        <CssBaseline />
        <MuiThemeProvider theme={muiFontTheme}>
          <StyledThemeProvider theme={appTheme}>
            {/* <APIProvider apiKey="AIzaSyA7t3pZu_Fc-l1l-R-e6CSyEVfT3heFlaA" onLoad={() => console.log('Maps API has loaded.')}> */}
            {/* <GoogleOAuthProvider clientId="1068212294951-tuieul1537t5bujd6irtvg1206lpr8cj.apps.googleusercontent.com"> */}
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <PermissionProvider>
                  {/* <NotificationProvider> */}
                  <App />
                  {/* </NotificationProvider> */}
                </PermissionProvider>
              </AuthProvider>
            </QueryClientProvider>

            {/* </GoogleOAuthProvider> */}
            {/* </APIProvider> */}
          </StyledThemeProvider>
        </MuiThemeProvider>
      </LegacyMuiThemeProvider>
    </StylesProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
