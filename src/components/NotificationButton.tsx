/* eslint-disable prettier/prettier */
import React, { useMemo, useState, useCallback } from "react";
import {
    Badge,
    IconButton,
    Menu,
    MenuItem,
    ListItemText,
    ListItemIcon,
    Typography,
    Box,
    Divider,
    Button,
    Tooltip
} from "@mui/material";
import { Email, Circle } from "@mui/icons-material";
import { useHistory } from "react-router-dom";

import { useNotification } from "ws/NotificationProvider";
import { isUnread, NotificationItem } from "ws/notificationType";

// ------- helpers -------
function formatTime(iso: string) {
    try {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return "เมื่อสักครู่";
        if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;

        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;

        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay} วันที่แล้ว`;

        return d.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch {
        return "";
    }
}

function getNotiLink(n: NotificationItem): string | undefined {
    const data: any = n.data;
    if (!data) return undefined;
    if (data.type === 'SALE_ORDER' && data.orderId) return `/sale-order/${data.orderId}`;
    if (data.link) return data.link;

    return undefined;
}

export default function NotificationButton() {
    const history = useHistory();
    const { items, unreadCount, markRead, markAllRead, loaded } = useNotification();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleOpenMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
    }, []);

    const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

    // เอาเฉพาะ 10 อันล่าสุดไปโชว์ในเมนู
    const latestItems = useMemo(() => items.slice(0, 10), [items]);

    const handleClickNoti = useCallback(
        async (n: NotificationItem) => {
            try {
                if (isUnread(n)) {
                    await markRead(n.id);
                }
            } finally {
                handleCloseMenu();
                const link = getNotiLink(n);
                if (link) history.push(link);
                else history.push("/notifications"); // fallback
            }
        },
        [markRead, handleCloseMenu, history]
    );

    const handleViewAll = useCallback(() => {
        handleCloseMenu();
        history.push("/notifications");
    }, [handleCloseMenu, history]);

    const handleMarkAllRead = useCallback(async () => {
        const unreadIds = items.filter(isUnread).map(n => n.id);
        await markAllRead(unreadIds);
        handleCloseMenu();
    }, [markAllRead, handleCloseMenu]);

    return (
        <>
            <Tooltip title="การแจ้งเตือน">
                <IconButton onClick={handleOpenMenu}>
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                        <Email fontSize="large" />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleCloseMenu}
                PaperProps={{
                    sx: {
                        width: 360,
                        maxHeight: 420,
                        overflow: "auto",
                        mt: 1,
                        borderRadius: 2
                    }
                }}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                {/* Header */}
                <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between" }}>
                    <Typography fontWeight={700}>การแจ้งเตือน</Typography>

                    <Button
                        size="small"
                        onClick={handleMarkAllRead}
                        disabled={!loaded || unreadCount === 0}
                    >
                        อ่านทั้งหมด
                    </Button>
                </Box>

                <Divider />

                {/* List */}
                {!loaded ? (
                    <MenuItem disabled>
                        <Typography color="text.secondary">กำลังโหลด...</Typography>
                    </MenuItem>
                ) : latestItems.length === 0 ? (
                    <MenuItem disabled>
                        <Typography color="text.secondary">ไม่มีข้อความใหม่</Typography>
                    </MenuItem>
                ) : (
                    latestItems.map((n) => {
                        const unread = isUnread(n);
                        return (
                            <MenuItem
                                key={n.id}
                                onClick={() => handleClickNoti(n)}
                                sx={{
                                    alignItems: "flex-start",
                                    py: 1.2,
                                    backgroundColor: unread ? "action.hover" : "transparent",
                                    whiteSpace: "normal"
                                }}
                            >
                                <ListItemIcon sx={{ mt: 0.5, minWidth: 22 }}>
                                    {unread && <Circle sx={{ fontSize: 16, color: "primary.main" }} />}
                                </ListItemIcon>

                                <ListItemText
                                    secondary={
                                        <Box>
                                            <Typography fontSize={13} color="text.secondary" noWrap>
                                                {n.message}
                                            </Typography>
                                            <Typography fontSize={11} color="text.disabled" sx={{ mt: 0.4 }}>
                                                {formatTime(n.createdAt)}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </MenuItem>
                        );
                    })
                )}

                {/* <Divider /> */}

                {/* Footer */}
                {/* <Box sx={{ p: 1 }}>
                    <Button fullWidth onClick={handleViewAll}>
                        ดูทั้งหมด
                    </Button>
                </Box> */}
            </Menu>
        </>
    );
}