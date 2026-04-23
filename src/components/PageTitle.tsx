import { Breadcrumbs, Divider, Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Fragment } from 'react';
import { Stack } from '@mui/material';
import ManualHelpButton from 'pages/Manual/ManualHelpButton';

interface PageTitleProps {
  title: string;
  breadcrumbs?: PageBreadcrumbs[];
  children?: React.ReactNode;
  manualId?: string;
}
export interface PageBreadcrumbs {
  text: string;
  link: string;
}

const BreadcrumbsCustom = styled(Breadcrumbs)`
  margin: 10px 0;
`;
const DividerCustom = styled(Divider)`
  margin: 10px 0;
`;
const StyledLink = styled(Link)`
  color: #999999;
  &:visited,
  &:link,
  &:active {
    text-decoration: none;
  }
`;
export default function PageTitle({
  title,
  breadcrumbs,
  children,
  manualId
}: PageTitleProps): JSX.Element {
  const breadcrumbLength = breadcrumbs?.length || null;

  return (
    <Fragment>
      <Stack spacing={2} direction="row">
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {/* Manual Help Button */}

        {manualId ? <ManualHelpButton manualId={manualId} /> : ''}
        {children}
      </Stack>
      {breadcrumbs && breadcrumbs.length >= 1 ? (
        <BreadcrumbsCustom aria-label="breadcrumb">
          {breadcrumbs.map(({ text, link }, index) => {
            if (breadcrumbLength && breadcrumbLength - 1 === index) {
              return (
                <Typography key={`breadcrumb-key-${link}`} color="textPrimary">
                  {text}
                </Typography>
              );
            }
            return (
              <StyledLink key={`breadcrumb-key-${link}`} to={link}>
                {text}
              </StyledLink>
            );
          })}
        </BreadcrumbsCustom>
      ) : (
        ''
      )}
      <DividerCustom />
    </Fragment>
  );
}
