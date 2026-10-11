import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { Drawer as MuiDrawer, ListItemButton, IconButton, Box, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useTranslation } from 'react-i18next';
import { SidebarItemsType } from './types';
import SidebarNav from './SidebarNav';
import Footer from './SidebarFooter';
import { isMobileOnly } from 'react-device-detect';
import { alpha } from '@mui/material/styles';
import { BRAND_COLORS } from 'theme/brandTokens';

/* =========================
   Styled Components
========================= */

const Drawer = styled(MuiDrawer)`
  & .MuiDrawer-paper {
    width: 258px;
    background: ${({ theme }) => theme.sidebar.background};
    color: ${({ theme }) => theme.sidebar.color};
    border-right: none;
    box-shadow: 4px 0 12px ${alpha(BRAND_COLORS.charcoal, 0.15)};
  }
`;

const Brand = styled(ListItemButton)`
  padding: 32px 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  background: transparent !important;
  border-bottom: 1px solid ${alpha(BRAND_COLORS.ivory, 0.12)};

  img {
    height: 65px;
    object-fit: contain;
  }
`;

const CollapseSection = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
`;

const DividerLine = styled.div`
  height: 1px;
  margin: 8px 0;
  background: ${alpha(BRAND_COLORS.ivory, 0.12)};
`;

/* =========================
   Props
========================= */

export interface SidebarProps {
  PaperProps: {
    style: {
      width: number;
    };
  };
  variant?: 'permanent' | 'persistent' | 'temporary';
  open?: boolean;
  onClose?: () => void;
  items: {
    title: string;
    pages: SidebarItemsType[];
  }[];
  showFooter?: boolean;
}

/* =========================
   Component
========================= */

function Sidebar({ items, onClose, ...rest }: SidebarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Drawer
      {...rest}
      PaperProps={{
        sx: {
          width: 280,
          background: BRAND_COLORS.green,
          color: BRAND_COLORS.ivory,
          borderRight: 'none'
        }
      }}>
      {/* Header */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          pt: 4,
          pb: 3,
          background: BRAND_COLORS.green
        }}>
        {/* Collapse Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: alpha(BRAND_COLORS.ivory, 0.75),
            '&:hover': {
              backgroundColor: alpha(BRAND_COLORS.ivory, 0.12)
            }
          }}>
          <ChevronLeftIcon />
        </IconButton>

        {/* Logo */}
        <Box
          component={NavLink}
          to="/"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none'
          }}>
          <Box
            sx={{
              width: 78,
              height: 78,
              borderRadius: 2,
              backgroundColor: BRAND_COLORS.ivory,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              overflow: 'hidden'
            }}>
            <Box
              component="img"
              src="/logo_nutalig.jpg"
              alt="Company Logo"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>

        </Box>
      </Box>

      {/* Menu Section */}
      <SidebarNav items={items} onClick={onClose} />

    </Drawer>
  );
}

export default Sidebar;
