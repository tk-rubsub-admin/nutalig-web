import React from 'react';
import styled from 'styled-components';

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;

  > *:not(:first-child) {
    margin-left: ${({ theme }) => theme.spacing(1)}px;
  }
`;

interface PageToolbarProps {
  children: React.ReactChild | React.ReactChildren;
}

export default function PageToolbar({ children }: PageToolbarProps): JSX.Element {
  return <Toolbar>{children}</Toolbar>;
}
