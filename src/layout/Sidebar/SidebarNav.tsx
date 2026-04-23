import { ReactElement, ElementType } from 'react';
import styled from 'styled-components';
import ReactPerfectScrollbar from 'react-perfect-scrollbar';
import { List } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { SidebarItemsType } from './types';
import SidebarNavSection from './SidebarNavSection';

import './perfect-scrollbar.css';

const Scrollbar = styled.div`
  background-color: ${(props) => props.theme.sidebar.background};
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  flex-grow: 1;
`;

const PerfectScrollbar = styled(ReactPerfectScrollbar)`
  background-color: ${(props) => props.theme.sidebar.background};
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  flex-grow: 1;
`;

const Items = styled.div`
  padding-top: ${(props) => props.theme.spacing(2.5)};
  padding-bottom: ${(props) => props.theme.spacing(2.5)};
`;

interface SidebarNavProps {
  items: {
    title: string;
    pages: SidebarItemsType[];
  }[];
  onClick: () => void;
}

function SidebarNav({ items, onClick }: SidebarNavProps): ReactElement {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const ScrollbarComponent = (matches ? PerfectScrollbar : Scrollbar) as ElementType;
  return (
    <ScrollbarComponent>
      <List disablePadding>
        <Items>
          {items?.map((item) => (
            <SidebarNavSection
              component="div"
              key={item.title}
              pages={item.pages}
              title={item.title}
              onClick={onClick}
            />
          ))}
        </Items>
      </List>
    </ScrollbarComponent>
  );
}

export default SidebarNav;
