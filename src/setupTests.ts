// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'jest-styled-components';
import { format } from 'util';
import mediaQuery from 'css-mediaquery';
import i18n from 'i18n';
import { server } from './tests/mockServer';

// Fail the tests if we have a console.error or warning
const error = global.console.error;
const warn = global.console.warn;

global.console.error = function (...args: unknown[]) {
  error(...args);
  throw new Error(format(...args));
};

global.console.warn = function (...args: unknown[]) {
  warn(...args);
  throw new Error(format(...args));
};

// The following is to support testing Material UI's Hidden component
// https://material-ui.com/components/use-media-query/#testing
const createMatchMedia =
  (width: number) =>
  (query: string): MediaQueryList => ({
    matches: mediaQuery.match(query, { width }),
    media: query,
    onchange: null,
    addListener: () => jest.fn(),
    removeListener: () => jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  });

beforeAll(() => {
  window.matchMedia = createMatchMedia(window.innerWidth);

  // If we encounter an un-mocked request in our unit tests,
  // print a warning message to the console.
  // https://mswjs.io/docs/api/setup-server/listen
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(async () => {
  // We need to set the language before running the tests
  // so that i18n.language is defined
  await i18n.changeLanguage('en');
});

afterEach(() => {
  jest.restoreAllMocks();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
