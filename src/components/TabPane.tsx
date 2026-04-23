import React, { ReactElement } from 'react';

interface Props {
  title: string;
  hideTab?: boolean;
  children: ReactElement | ReactElement[];
}

function TabPane({ children }: Props): JSX.Element {
  return <div>{children}</div>;
}

export default TabPane;
