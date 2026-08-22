import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'auth/AuthContext';
import { SESSION_KEYS } from 'auth/AuthContext';

interface ReleaseNoteEntry {
    version: string;
    publishedAt?: string;
    titleTh: string;
    titleEn: string;
    summaryTh?: string;
    summaryEn?: string;
    itemsTh: string[];
    itemsEn: string[];
}

const STORAGE_KEY = 'nutalig:last-seen-release-note-version';

const parsePublishedAt = (value?: string): number => {
    if (!value) {
        return 0;
    }

    const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
    if (!match) {
        return 0;
    }

    const [, dd, mm, yyyy, hh = '00', min = '00'] = match;
    return new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min)
    ).getTime();
};

const compareReleaseNotes = (a: ReleaseNoteEntry, b: ReleaseNoteEntry): number => {
    const aTime = parsePublishedAt(a.publishedAt);
    const bTime = parsePublishedAt(b.publishedAt);

    if (aTime !== bTime) {
        return bTime - aTime;
    }

    return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
};

const getReleaseNoteContent = (entry: ReleaseNoteEntry, language: string) => {
    const normalizedLanguage = language.toLowerCase();
    const isThai = normalizedLanguage.startsWith('th');

    return {
        title: isThai ? entry.titleTh : entry.titleEn,
        summary: isThai ? entry.summaryTh : entry.summaryEn,
        items: isThai ? entry.itemsTh : entry.itemsEn
    };
};

export default function ReleaseNoteDialog(): JSX.Element | null {
    const { i18n } = useTranslation();
    const { authReady, getToken } = useAuth();
    const [open, setOpen] = useState(false);
    const [releaseNote, setReleaseNote] = useState<ReleaseNoteEntry | null>(null);

    const releaseNoteUrl = useMemo(() => '/release-notes.json', []);

    useEffect(() => {
        if (!authReady || !getToken()) {
            return;
        }

        if (sessionStorage.getItem(SESSION_KEYS.PENDING_RELEASE_NOTE) !== '1') {
            return;
        }

        let active = true;

        const loadReleaseNote = async () => {
            try {
                const response = await fetch(releaseNoteUrl, { cache: 'no-store' });
                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as ReleaseNoteEntry[] | { notes?: ReleaseNoteEntry[] };
                const notes = Array.isArray(payload) ? payload : payload.notes || [];
                const latestNote = [...notes].sort(compareReleaseNotes)[0];

                if (!latestNote) {
                    sessionStorage.removeItem(SESSION_KEYS.PENDING_RELEASE_NOTE);
                    return;
                }

                const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
                if (lastSeenVersion === latestNote.version) {
                    sessionStorage.removeItem(SESSION_KEYS.PENDING_RELEASE_NOTE);
                    return;
                }

                if (!active) {
                    return;
                }

                setReleaseNote(latestNote);
                setOpen(true);
            } catch {
                // Ignore release note loading failures.
                sessionStorage.removeItem(SESSION_KEYS.PENDING_RELEASE_NOTE);
            }
        };

        void loadReleaseNote();

        return () => {
            active = false;
        };
    }, [authReady, getToken, releaseNoteUrl]);

    const handleClose = () => {
        if (releaseNote) {
            localStorage.setItem(STORAGE_KEY, releaseNote.version);
        }

        sessionStorage.removeItem(SESSION_KEYS.PENDING_RELEASE_NOTE);
        setOpen(false);
    };

    if (!releaseNote) {
        return null;
    }

    const content = getReleaseNoteContent(releaseNote, i18n.language);

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pb: 1 }}>
                <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={800}>
                        {content.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Version {releaseNote.version}
                        {releaseNote.publishedAt ? ` • ${releaseNote.publishedAt}` : ''}
                    </Typography>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Stack spacing={2}>
                    {content.summary ? (
                        <Typography variant="body2" color="text.secondary">
                            {content.summary}
                        </Typography>
                    ) : null}

                    <Divider />

                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                            What's new
                        </Typography>
                        <List dense disablePadding>
                            {content.items.map((item) => (
                                <ListItem key={item} disableGutters sx={{ py: 0.5 }}>
                                    <ListItemText
                                        primary={item}
                                        primaryTypographyProps={{
                                            variant: 'body2'
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>

                    <Stack direction="row" justifyContent="flex-end">
                        <Button variant="contained" className="btn-emerald-green" onClick={handleClose}>
                            {i18n.language.toLowerCase().startsWith('en') ? 'Close' : 'ปิด'}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
