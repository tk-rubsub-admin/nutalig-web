import React from 'react';
import styled from 'styled-components';
import { NavLink, Link } from 'react-router-dom';
import { rgba, darken } from 'polished';
import { Chip, Collapse, ListItemProps, ListItemButton, ListItemText } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface ItemType {
  activeclassname?: string;
  onClick?: () => void;
  to?: string;
  component?: typeof NavLink;
  depth: number;
}

const Item = styled(ListItemButton) <ItemType>`
  padding-top: ${(props) => props.theme.spacing(props.depth && props.depth > 0 ? 2 : 3)};
  padding-bottom: ${(props) => props.theme.spacing(props.depth && props.depth > 0 ? 2 : 3)};
  padding-left: ${(props) => props.theme.spacing(props.depth && props.depth > 0 ? 14 : 8)};
  padding-right: ${(props) => props.theme.spacing(props.depth && props.depth > 0 ? 4 : 7)};
  font-weight: ${(props) => props.theme.typography.fontWeightRegular};
  svg {
    color: ${(props) => props.theme.sidebar.color};
    font-size: 20px;
    width: 20px;
    height: 20px;
    opacity: 0.5;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.08);
    color: ${(props) => props.theme.sidebar.color};
  }
  &.${(props) => props.activeclassname} {
    background-color: ${(props) => darken(0.03, props.theme.sidebar.background)};
    span {
      color: ${(props) => props.theme.sidebar.color};
    }
  }
`;

const ItemLink = styled(Link)`
  text-decoration: none;
  &.active > div {
    background-color: ${(props) => darken(0.03, props.theme.sidebar.background)};
    span {
      color: ${(props) => props.theme.sidebar.color};
    }
  }
`;

interface TitleType {
  depth: number;
}

const Title = styled(ListItemText) <TitleType>`
  margin: 0;
  span {
    color: ${(props) => rgba(props.theme.sidebar.color, props.depth && props.depth > 0 ? 0.7 : 1)};
    font-size: ${(props) => props.theme.typography.body1.fontSize}px;
    padding: 0 ${(props) => props.theme.spacing(4)};
  }
`;

const Badge = styled(Chip)`
  font-weight: ${(props) => props.theme.typography.fontWeightBold};
  height: 20px;
  position: absolute;
  right: 26px;
  top: 12px;
  background: ${(props) => props.theme.sidebar.badge.background};
  z-index: 1;
  span.MuiChip-label,
  span.MuiChip-label:hover {
    font-size: 11px;
    cursor: pointer;
    color: ${(props) => props.theme.sidebar.badge.color};
    padding-left: ${(props) => props.theme.spacing(2)};
    padding-right: ${(props) => props.theme.spacing(2)};
  }
`;

const ExpandLessIcon = styled(ExpandLess)`
  color: ${(props) => rgba(props.theme.sidebar.color, 0.5)};
`;

const ExpandMoreIcon = styled(ExpandMore)`
  color: ${(props) => rgba(props.theme.sidebar.color, 0.5)};
`;

type SidebarNavListItemProps = ListItemProps & {
  className?: string;
  depth: number;
  href: string;
  icon: React.FC<any>;
  badge?: string;
  open?: boolean;
  isActive?: boolean;
  title: string;
  onClick: () => void;
};

const SidebarNavListItem: React.FC<SidebarNavListItemProps> = (props) => {
  const {
    id,
    title,
    href,
    depth = 0,
    children,
    icon: Icon,
    badge,
    open: openProp = false,
    isActive,
    onClick
  } = props;

  const [open, setOpen] = React.useState(openProp);

  const handleToggle = () => {
    setOpen((state) => !state);
  };

  if (children) {
    return (
      <React.Fragment>
        <Item id={id} depth={depth} onClick={handleToggle}>
          {Icon && <Icon />}
          <Title depth={depth}>
            {title}
            {badge && <Badge label={badge} />}
          </Title>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Item>
        <Collapse in={open}>{children}</Collapse>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <ItemLink id={id} to={href} className={isActive ? 'active' : ''} onClick={onClick}>
        <Item depth={depth}>
          {Icon && <Icon />}
          <Title depth={depth}>
            {title}
            {badge && <Badge label={badge} />}
          </Title>
        </Item>
      </ItemLink>
    </React.Fragment>
  );
};

export default SidebarNavListItem;
