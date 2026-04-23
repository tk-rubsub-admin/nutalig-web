import { render, RenderOptions, RenderResult } from '@testing-library/react';
import theme from 'theme';
import { createMemoryHistory, History } from 'history';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Route, Router } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18n';

interface CustomRenderOptions extends RenderOptions {
  /**
   * The path that should be pushed to the History object.
   */
  historyPath?: string;
  /**
   * This is the path that react-router should use to render the component.
   */
  path?: string;
  /**
   * The simulated viewpoint for Jsdom. Relevant mostly for responsive testing.
   */
  viewport?: 'xs' | 'sm' | ' md' | ' lg' | ' xl';
  /**
   * Used to specify the properties of the initial store.
   */
  initialStore?: Record<string, string>;
  /**
   * Used to specify the properties of the initial history state.
   */
  historyState?: Record<string, string>;
  /**
   * You can override the History object with a customer version.
   */
  history?: History;
}

export const testInitialStore = {};

// Test render functions
export function renderComponent(
  children: React.ReactNode,
  renderConfig: CustomRenderOptions = {}
): RenderResult & { history: History<unknown> } {
  const {
    historyPath = '/',
    path,
    historyState,
    viewport = 'lg',
    history = createMemoryHistory({ initialEntries: [historyPath] }),
    ...remainingOptions
  } = renderConfig;

  if (historyState) {
    history.push(historyPath, historyState);
  }

  const testTheme = {
    ...theme,
    props: { MuiWithWidth: { initialWidth: viewport } }
  };
  const queryClient = new QueryClient();

  const view = render(
    <ThemeProvider theme={testTheme}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Router history={history}>
            <Route path={path}>{children}</Route>
          </Router>
        </I18nextProvider>
      </QueryClientProvider>
    </ThemeProvider>,
    remainingOptions
  );
  // https://github.com/testing-library/react-testing-library/issues/218#issuecomment-436730757
  return {
    ...view,
    rerender: (newUi: React.ReactNode) =>
      renderComponent(newUi, {
        container: view.container,
        baseElement: view.baseElement
      }),
    // adding `history` to the returned utilities to allow us to reference it in our tests
    // (just try to avoid using this to test implementation details).
    history
  };
}

export function noop(): void {}
