# NUTALIG application theme

Colors follow `NUTALIG_CI_Brand_Refresh_Active_Source_Rev03.pdf`, page 7.
`brandTokens.ts` is the shared source for MUI v4, MUI v5, styled-components,
legacy button CSS and Dashboard charts.

| Token | HEX | Role |
| --- | --- | --- |
| white | #FFFFFF | Main background and paper surfaces |
| ivory | #F7F3EE | Brand contrast and secondary surfaces |
| green | #1F3F37 | Primary actions and navigation |
| sand | #D4C5BA | Dividers, borders and supporting surfaces |
| terracotta | #925944 | Secondary actions and accents |
| charcoal | #30302F | Text and contrast |

The CI recommends Ivory/Green/Sand/Terracotta at 60/25/10/5. This is a visual
direction, not a requirement to measure exact screen coverage. UI hover,
selected and disabled states use derived shades. Error and warning colors
remain distinct; LINE and Google identity colors remain recognizable.

`AppThemeProvider` installs all three providers. `applicationThemes.ts` adapts
the shared palette and component styles to MUI v4's `type`, `props` and
`overrides` and MUI v5's `mode`, `components` and `styleOverrides`.
MUI keeps its existing 8px spacing and font sizes; styled-components keeps
its existing 4px spacing and typography hierarchy.

Use `theme.palette` in MUI styles or the shared tokens when a literal color
is needed (for example, color calculations and document chips). Existing
`btn-*` classes use CSS variables installed by `CssBaseline`.

The application retains Noto Sans Thai. Corporate typography and typography
hierarchy are still Pending in Rev.03, so marketing fonts are not applied
as a new application typography standard.
