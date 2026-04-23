/* eslint-disable prettier/prettier */
import { ReactNode, useState } from 'react';
import { Card, CardContent, Collapse, IconButton, Stack, Typography, styled, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { CheckCircle } from '@mui/icons-material';

const StyledCard = styled(Card)`
  padding: 0;
  margin-top: 20px;
  border-radius: 10px;
`;

const HeaderBox = styled(Box) <{ clickable?: boolean }>`
  padding: 16px 16px 8px 16px;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
`;

const ContentBox = styled(CardContent)`
  padding: 8px 16px 16px 16px !important;
`;

export interface CollapsibleWrapperProps {
    title: ReactNode;
    subtitle?: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    disabled?: boolean;
    isCompleted?: boolean;
    action?: ReactNode;
    onToggle?: (expanded: boolean) => void;
}

function CollapsibleWrapper({
    title,
    subtitle,
    children,
    defaultExpanded = true,
    disabled = false,
    isCompleted = false,
    action,
    onToggle
}: CollapsibleWrapperProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const handleToggle = () => {
        if (disabled) return;
        const next = !expanded;
        setExpanded(next);
        onToggle?.(next);
    };

    return (
        <StyledCard elevation={1}>
            <HeaderBox clickable={!disabled} onClick={handleToggle}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    {isCompleted && (
                        <CheckCircle
                            sx={{
                                color: '#2e7d32',
                                // fontSize: 20
                            }}
                        />
                    )}

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {title}
                        </Typography>

                        {subtitle && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={1}>
                        {action && (
                            <Box
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                {action}
                            </Box>
                        )}

                        {!disabled && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggle();
                                }}
                            >
                                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        )}
                    </Stack>
                </Stack>
            </HeaderBox>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <ContentBox>{children}</ContentBox>
            </Collapse>
        </StyledCard>
    );
}

export default CollapsibleWrapper;