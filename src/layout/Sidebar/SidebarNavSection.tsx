import React from 'react';
import styled from 'styled-components';
import { Typography } from '@mui/material';
import { SidebarItemsType } from './types';
import SidebarNavList from './SidebarNavList';

const Title = styled(Typography)`
  color: ${(props) => props.theme.sidebar.color};
  font-size: ${(props) => props.theme.typography.caption.fontSize};
  padding: ${(props) => props.theme.spacing(4)} ${(props) => props.theme.spacing(7)}
    ${(props) => props.theme.spacing(1)};
  opacity: 0.4;
  text-transform: uppercase;
  display: block;
`;

interface SidebarNavSectionProps {
  className?: Element;
  component?: React.ElementType;
  pages: SidebarItemsType[];
  title?: string;
  onClick: () => void;
}

const SidebarNavSection: React.FC<SidebarNavSectionProps> = (props) => {
  const { title, pages, className, component: Component = 'nav', onClick, ...rest } = props;
  return (
    <Component {...rest}>
      {title && <Title variant="subtitle2">{title}</Title>}
      <SidebarNavList pages={pages} depth={0} onClick={onClick} />
    </Component>
  );
};

export default SidebarNavSection;
