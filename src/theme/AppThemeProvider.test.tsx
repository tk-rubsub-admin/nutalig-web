// @vitest-environment jsdom
import { useContext } from 'react';
import { Button as LegacyButton } from '@material-ui/core';
import { useTheme as useLegacyTheme } from '@material-ui/core/styles';
import { Button, Card, Dialog, DialogContent, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from 'styled-components';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AppThemeProvider from './AppThemeProvider';

afterEach(cleanup);

function ThemeProbe() {
  const legacy = useLegacyTheme();
  const mui = useTheme();
  const styled = useContext(ThemeContext);
  return (
    <output data-testid="themes">
      {JSON.stringify({
        colors: [legacy, mui, styled].map((theme) => ({
          primary: theme.palette.primary.main,
          secondary: theme.palette.secondary.main,
          background: theme.palette.background.default,
          text: theme.palette.text.primary,
          divider: theme.palette.divider
        })),
        spacing: [legacy.spacing(1), mui.spacing(1), styled.spacing(1)],
        fontSizes: [
          legacy.typography.fontSize,
          mui.typography.fontSize,
          styled.typography.fontSize
        ],
        modes: [legacy.palette.type, mui.palette.mode]
      })}
    </output>
  );
}

function expectButtonColor(label: string, color: string, legacy = false) {
  const button = screen.getByRole('button', { name: label });
  // jsdom does not reliably resolve JSS/Emotion hover rules. Inspect the base CSS
  // emitted for the actual rendered component, excluding pseudo selectors.
  const rules = Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules));
  const matchingRules = rules.filter(
    (rule): rule is CSSStyleRule =>
      rule.type === CSSRule.STYLE_RULE &&
      !(rule as CSSStyleRule).selectorText.includes(':') &&
      (legacy || (rule as CSSStyleRule).selectorText.includes('.css-')) &&
      button.matches((rule as CSSStyleRule).selectorText)
  );
  expect(
    matchingRules.some(
      (rule) => rule.style.getPropertyValue('background-color').toUpperCase() === color
    ),
    label
  ).toBe(true);
}

describe('Application brand theme integration', () => {
  it('provides the same brand colors to all three styling systems while retaining layout defaults', () => {
    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>
    );
    const result = JSON.parse(screen.getByTestId('themes').textContent || '{}');
    expect(result.colors).toEqual(
      Array(3).fill({
        primary: '#1F3F37',
        secondary: '#925944',
        background: '#FFFFFF',
        text: '#30302F',
        divider: '#D4C5BA'
      })
    );
    expect(result.spacing).toEqual([8, '8px', '4px']);
    expect(result.fontSizes).toEqual([14, 14, 13]);
    expect(result.modes).toEqual(['light', 'light']);
  });

  it('applies primary, secondary and error colors to actual MUI v4 and v5 buttons', () => {
    render(
      <AppThemeProvider>
        <LegacyButton color="primary" variant="contained">
          Legacy primary
        </LegacyButton>
        <LegacyButton color="secondary" variant="contained">
          Legacy secondary
        </LegacyButton>
        <Button color="primary" variant="contained">
          Primary
        </Button>
        <Button color="secondary" variant="contained">
          Secondary
        </Button>
        <Button color="error" variant="contained">
          Error
        </Button>
      </AppThemeProvider>
    );
    expectButtonColor('Legacy primary', '#1F3F37', true);
    expectButtonColor('Legacy secondary', '#925944', true);
    expectButtonColor('Primary', '#1F3F37');
    expectButtonColor('Secondary', '#925944');
    expectButtonColor('Error', '#DC1B0D');
  });

  it('styles cards, inputs and portal dialogs and exposes the tokens used by legacy CSS classes', () => {
    render(
      <AppThemeProvider>
        <Card data-testid="card">
          <TextField label="Material" />
          <Typography color="primary" data-testid="primary-text">
            Heading
          </Typography>
        </Card>
        <Dialog open>
          <DialogContent>Confirmation</DialogContent>
        </Dialog>
      </AppThemeProvider>
    );
    expect(getComputedStyle(screen.getByTestId('card')).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(screen.getByTestId('card')).borderColor).toBe('#d4c5ba');
    expect(getComputedStyle(screen.getByRole('dialog')).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(document.querySelector('fieldset')!).borderColor).toBe('#d4c5ba');
    expect(getComputedStyle(document.documentElement).getPropertyValue('--nutalig-green')).toBe(
      '#1F3F37'
    );
    expect(
      getComputedStyle(document.documentElement).getPropertyValue('--nutalig-terracotta')
    ).toBe('#925944');
    expect(getComputedStyle(document.body).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(screen.getByTestId('primary-text')).color).toBe('rgb(31, 63, 55)');
  });
});
