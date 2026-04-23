/* eslint-disable prettier/prettier */
// OrderProgress.tsx
import * as React from "react";
import {
    Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, StepIconProps,
    Stack, Typography, styled, Chip, LinearProgress, Box, useMediaQuery, List, ListItem, ListItemIcon, ListItemText, Avatar
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentIcon from "@mui/icons-material/Payment";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useTranslation } from "react-i18next";

export type OrderStatus =
    | "AWAITING_PAYMENT"
    | "ORDER_CONFIRMED"
    | "PROCESSING"
    | "COMPLETED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";

type StepType = "normal" | "success" | "cancel";

const STEPS: { key: OrderStatus; type: StepType }[] = [
    { key: "AWAITING_PAYMENT", type: "normal" },
    { key: "ORDER_CONFIRMED", type: "normal" },
    { key: "PROCESSING", type: "normal" },
    { key: "COMPLETED", type: "normal" },
    { key: "SHIPPED", type: "normal" },
    { key: "DELIVERED", type: "success" },
    { key: "CANCELLED", type: "cancel" },
];

const ICONS: Record<OrderStatus, React.ReactNode> = {
    "AWAITING_PAYMENT": <PaymentIcon />,
    "ORDER_CONFIRMED": <ShoppingCartIcon />,
    "PROCESSING": <InventoryIcon />,
    "COMPLETED": <InventoryIcon />,
    "SHIPPED": <LocalShippingIcon />,
    "DELIVERED": <CheckCircleIcon />,
    "CANCELLED": <CancelIcon />,
};

const ColorConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
    [`& .${stepConnectorClasses.line}`]: {
        borderTopWidth: 2,
        borderColor: theme.palette.divider,
    },
}));

function CustomStepIcon(
    props: StepIconProps & { stepKey: OrderStatus; stepType: StepType }
) {
    const { active, completed, stepKey, stepType } = props;
    const baseIcon = ICONS[stepKey];

    // สีของไอคอน
    let color = "text.secondary";
    if (stepType === "cancel") color = "error.main";
    else if (stepType === "success") color = "success.main";
    else if (completed || active) color = "primary.main";

    // เน้นสเต็ปปัจจุบันบนเดสก์ท็อป/แท็บเล็ต
    if (active) {
        return (
            <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    boxShadow: 2,
                }}
            >
                {baseIcon}
            </Stack>
        );
    }

    return (
        <Stack sx={{ color }} alignItems="center" justifyContent="center">
            {baseIcon}
        </Stack>
    );
}

export interface OrderProgressProps {
    status: OrderStatus | string;
    label?: string;
}

export default function OrderProgress({ status }: OrderProgressProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const idx = STEPS.filter((s) => s.key !== 'CANCELLED').findIndex((s) => s.key === status);
    const activeStepIndex = Math.max(0, idx);
    const pct = Math.round((activeStepIndex / (STEPS.filter((s) => s.key !== 'CANCELLED').length - 1)) * 100);
    const current = STEPS[activeStepIndex];
    // ========== MOBILE RENDER (ดูง่ายขึ้น) ==========
    if (isMobile) {
        const prev = STEPS[activeStepIndex - 1];
        const next = STEPS[activeStepIndex + 1];

        return (
            <Stack spacing={1.5}>
                {/* สถานะปัจจุบันเป็น Chip ใหญ่ */}
                <Chip
                    label={`${t("viewOrder.currentStatus")}: ${t(`status.saleOrder.${current?.key ?? status}`)}`}
                    color={
                        current?.type === "cancel"
                            ? "error"
                            : current?.type === "success"
                                ? "success"
                                : "primary"
                    }
                    variant="filled"
                    sx={{ fontWeight: "bold", alignSelf: "flex-start" }}
                />
                <br />

                {/* แถบความคืบหน้า */}
                <Box>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 5 }} />
                    <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                </Box>

                {/* ลิสต์แบบย่อ: แสดงแค่ ก่อนหน้า / ปัจจุบัน / ถัดไป */}
                <List dense sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
                    {prev && (
                        <ListItem>
                            <ListItemIcon>
                                <CheckCircleIcon fontSize="small" color="disabled" />
                            </ListItemIcon>
                            <ListItemText
                                primary={<Typography variant="body2" color="text.secondary">{t(`status.saleOrder.${prev.key}`)}</Typography>}
                            />
                        </ListItem>
                    )}

                    {current && (
                        <ListItem sx={{ bgcolor: "action.hover", borderRadius: 2, my: 0.5 }}>
                            <ListItemIcon>
                                <Avatar sx={{ bgcolor: current.type === "cancel" ? "error.main" : current.type === "success" ? "success.main" : "primary.main", width: 28, height: 28 }}>
                                    {/* ไอคอนสีขาวเล็ก ๆ */}
                                    <Box sx={{ color: "common.white" }}>{ICONS[current.key as OrderStatus]}</Box>
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText
                                primary={<Typography variant="body1" fontWeight="bold">{t(`status.saleOrder.${current.key}`)}</Typography>}
                            />
                        </ListItem>
                    )}

                    {next && (
                        <ListItem>
                            <ListItemIcon>
                                <RadioButtonUncheckedIcon fontSize="small" color="disabled" />
                            </ListItemIcon>
                            <ListItemText
                                primary={<Typography variant="body2" color="text.secondary">{t(`status.saleOrder.${next.key}`)}</Typography>}
                            />
                        </ListItem>
                    )}
                </List>
            </Stack>
        );
    }

    // ========== DESKTOP/TABLET RENDER (Stepper ปกติ) ==========
    return (
        <Stack spacing={1}>
            <Chip
                label={`${t("viewOrder.currentStatus")}: ${t(`status.saleOrder.${current?.key ?? status}`)}`}
                color={current?.type === "cancel" ? "error" : current?.type === "success" ? "success" : "primary"}
                variant="filled"
                sx={{ fontWeight: "bold", alignSelf: "flex-start" }}
            />
            <br />
            <Box sx={{ overflowX: "auto", pb: 1 }}>
                <Stepper
                    activeStep={activeStepIndex}
                    alternativeLabel
                    connector={<ColorConnector />}
                    sx={{
                        minWidth: 560, // กันบีบบนจอแคบ ๆ
                        px: 1,
                    }}
                >
                    {STEPS.map((s, i) => {
                        const isCompleted = i < activeStepIndex;
                        const isActive = i === activeStepIndex;
                        return (
                            <Step key={s.key} completed={isCompleted}>
                                <StepLabel
                                    StepIconComponent={(p) => (
                                        <CustomStepIcon {...p} stepKey={s.key} stepType={s.type} />
                                    )}
                                >
                                    <Typography
                                        variant="body2"
                                        fontWeight={isActive ? "bold" : "normal"}
                                        color={isActive ? (s.type === "cancel" ? "error.main" : "primary.main") : "inherit"}
                                        noWrap
                                    >
                                        {t(`status.saleOrder.${s.key}`)}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
            </Box>
        </Stack>
    );
}
