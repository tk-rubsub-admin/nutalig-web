/* eslint-disable prettier/prettier */
// src/ws/NotificationProvider.tsx

import React, {
    createContext,
    useContext,
    useMemo,
    useReducer,
    useState,
    useCallback,
    useEffect,
} from "react";
import { Snackbar, Alert } from "@mui/material";
import { useQueryClient } from "react-query";
import { useAuth } from "auth/AuthContext";

import {
    NotificationItem,
    NotificationEvent,
    isUnread,
    NotificationType,
} from "./notificationType";
import { useNotificationWS } from "./useNotificationWS";
import { api } from "api/api";

// ----------------------------------------------------
// State + Reducer
// ----------------------------------------------------
type State = {
    items: NotificationItem[];
    unreadCount: number;
    loaded: boolean;
};

type Action =
    | { type: "INIT"; payload: NotificationItem[] }
    | { type: "ADD"; payload: NotificationItem }
    | { type: "MARK_READ"; payload: { id: string } }
    | { type: "MARK_ALL_READ" };

const initialState: State = {
    items: [],
    unreadCount: 0,
    loaded: false,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "INIT": {
            const items = action.payload.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            return {
                items,
                unreadCount: items.filter(isUnread).length,
                loaded: true,
            };
        }
        case "ADD": {
            const items = [action.payload, ...state.items];
            return {
                ...state,
                items,
                unreadCount: items.filter(isUnread).length,
            };
        }
        case "MARK_READ": {
            const items = state.items.map((n) =>
                n.id === action.payload.id
                    ? { ...n, readAt: new Date().toISOString() }
                    : n
            );
            return {
                ...state,
                items,
                unreadCount: items.filter(isUnread).length,
            };
        }
        case "MARK_ALL_READ": {
            const now = new Date().toISOString();
            const items = state.items.map((n) =>
                n.readAt ? n : { ...n, readAt: now }
            );
            return { ...state, items, unreadCount: 0 };
        }
        default:
            return state;
    }
}

type Severity = "success" | "info" | "warning" | "error";

type Ctx = {
    items: NotificationItem[];
    unreadCount: number;
    loaded: boolean;

    initFromServer: () => Promise<void>;
    addNotification: (n: NotificationItem, opts?: { silent?: boolean }) => void;
    markRead: (id: string) => Promise<void>;
    markAllRead: (ids: string[]) => Promise<void>;

    notify: (msg: string, severity?: Severity) => void;
};

const NotificationContext = createContext<Ctx>(null as any);

// ----------------------------------------------------
// Convert WS Event → NotificationItem
// ----------------------------------------------------
function toItem(ev: NotificationEvent): NotificationItem {
    const createdAt = ev.createdAt || new Date().toISOString();
    const id = ev.id || `${createdAt}-${Math.random().toString(36).slice(2)}`;

    const titleByType: Record<NotificationType, string> = {
        NEW_REQUEST: "มีคำขอใหม่",
        JOB_DONE: "งานเสร็จแล้ว",
        SYSTEM_ALERT: "System Alert",
        INFO: "แจ้งเตือน",
    };

    return {
        id,
        type: ev.type,
        title: titleByType[ev.type],
        message: ev.message,
        data: ev.data,
        createdAt,
        readAt: null,
    };
}

// ----------------------------------------------------
// Provider Component
// ----------------------------------------------------
export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const queryClient = useQueryClient();
    const { getToken, getRole, getUserId, authReady } = useAuth();

    const token = getToken();
    const role = getRole();
    const userId = getUserId();

    // ---------------------------
    // Sound
    // ---------------------------
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const [soundEnabled] = useState(true);
    const [soundUnlocked, setSoundUnlocked] = useState(false);

    // ---------------------------
    // Snackbar Queue
    // ---------------------------
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState<Severity>("info");
    const [queue, setQueue] = useState<{ msg: string; sev: Severity }[]>([]);

    const notify = useCallback((msg: string, sev: Severity = "info") => {
        if (open) {
            setQueue((q) => [...q, { msg, sev }]);
            return;
        }
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    }, [open]);

    const handleClose = (_?: any, reason?: string) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    const handleExited = () => {
        setQueue((q) => {
            if (q.length === 0) return q;
            const [next, ...rest] = q;
            setMessage(next.msg);
            setSeverity(next.sev);
            setOpen(true);
            return rest;
        });
    };

    // ----------------------------------------------------
    // API Load
    // ----------------------------------------------------
    const initFromServer = async () => {
        const res = await api.get("/v1/notifications");
        const items: NotificationItem[] = res.data?.data ?? res.data ?? [];
        dispatch({ type: "INIT", payload: items });
    };

    const addNotification = (n: NotificationItem, opts?: { silent?: boolean }) => {
        dispatch({ type: "ADD", payload: n });
        if (!opts?.silent) {
            notify(n.title ? `${n.title}: ${n.message}` : n.message, "info");
            playSound();
        }
    };

    const markRead = async (id: string) => {
        dispatch({ type: "MARK_READ", payload: { id } });
        try {
            await api.patch(`/v1/notifications/${id}/read`);
            queryClient.invalidateQueries("notifications");
        } catch (e) {
            console.error(e);
        }
    };

    const markAllRead = async (ids: string[]) => {
        dispatch({ type: "MARK_ALL_READ" });
        try {
            await api.patch("/v1/notifications/read-all", null, {
                params: { ids },
                paramsSerializer: (params) =>
                    params.ids.map((id: string) => `ids=${encodeURIComponent(id)}`).join("&"),
            });
            queryClient.invalidateQueries("notifications");
        } catch (e) {
            console.error(e);
        }
    };

    // ----------------------------------------------------
    // WebSocket Connect (run only when authReady)
    // ----------------------------------------------------
    useNotificationWS({
        token: authReady ? token : "",
        userId: authReady ? userId : "",
        roles: authReady && role ? [role] : [],
        onEvent: (ev) => {
            console.log("[WS EVENT]", ev);
            addNotification(toItem(ev))
        },
    });

    // ----------------------------------------------------
    // Load notification list after login ready
    // ----------------------------------------------------
    useEffect(() => {
        if (!authReady) return;
        if (!token) return;
        if (!state.loaded) initFromServer();
    }, [authReady, token]);

    // ----------------------------------------------------
    // Sound Setup
    // ----------------------------------------------------
    useEffect(() => {
        audioRef.current = new Audio("/sfx/notification.m4a");
        audioRef.current.preload = "auto";
    }, []);

    useEffect(() => {
        const unlock = () => setSoundUnlocked(true);
        window.addEventListener("click", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
        return () => {
            window.removeEventListener("click", unlock);
            window.removeEventListener("keydown", unlock);
        };
    }, []);

    const playSound = useCallback(() => {
        if (!soundEnabled || !soundUnlocked) return;
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = 0;
        audio.play().catch(() => { });
    }, [soundEnabled, soundUnlocked]);

    // ----------------------------------------------------
    // Context Value
    // ----------------------------------------------------
    const value = useMemo(
        () => ({
            items: state.items,
            unreadCount: state.unreadCount,
            loaded: state.loaded,

            initFromServer,
            addNotification,
            markRead,
            markAllRead,

            notify,
        }),
        [state.items, state.unreadCount, state.loaded, notify]
    );

    // ----------------------------------------------------
    return (
        <NotificationContext.Provider value={value}>
            {children}

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={handleClose}
                TransitionProps={{ onExited: handleExited }}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert severity={severity} variant="filled" onClose={handleClose} sx={{ minWidth: 280 }}>
                    {message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);

export const useNotify = () => {
    const ctx = useContext(NotificationContext);
    return ctx.notify;
};