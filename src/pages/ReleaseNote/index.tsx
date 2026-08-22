import { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PageTitle from 'components/PageTitle';
import { Page } from 'layout/LayoutRoute';

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

interface ReleaseNotesResponse {
  notes?: ReleaseNoteEntry[];
}

const isThaiLanguage = (language: string): boolean => language.toLowerCase().startsWith('th');

const compareReleaseNotes = (a: ReleaseNoteEntry, b: ReleaseNoteEntry): number => {
  const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
  const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

  if (aTime !== bTime) {
    return bTime - aTime;
  }

  return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
};

export default function ReleaseNote(): JSX.Element {
  const { t, i18n } = useTranslation();
  const [notes, setNotes] = useState<ReleaseNoteEntry[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/release-notes.json', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ReleaseNoteEntry[] | ReleaseNotesResponse;
        const nextNotes = Array.isArray(payload) ? payload : payload.notes || [];

        if (active) {
          setNotes(nextNotes);
        }
      } catch {
        if (active) {
          setNotes([]);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const languageIsThai = useMemo(() => isThaiLanguage(i18n.language), [i18n.language]);
  const sortedNotes = useMemo(() => [...notes].sort(compareReleaseNotes), [notes]);

  return (
    <Page>
      <PageTitle title="Release Note" />
      <Stack spacing={2.5}>

        <Stack spacing={2}>
          {sortedNotes.length ? (
            sortedNotes.map((note) => {
              const title = languageIsThai ? note.titleTh : note.titleEn;
              const summary = languageIsThai ? note.summaryTh : note.summaryEn;
              const items = languageIsThai ? note.itemsTh : note.itemsEn;

              return (
                <Card
                  key={note.version}
                  elevation={0}
                  sx={{
                    border: '1px solid #D9DCE3',
                    borderRadius: 3,
                    overflow: 'hidden',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,251,253,1) 100%)'
                  }}>
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={3}
                      alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                      <Box
                        sx={{
                          minWidth: { xs: '100%', md: 240 },
                          maxWidth: { xs: '100%', md: 280 },
                          p: { xs: 0, md: 0.5 },
                          pr: { md: 2 },
                          borderRight: { xs: 'none', md: '1px solid #E3E8EF' }
                        }}>
                        <Stack spacing={1.5}>
                          <Box>
                            <Typography
                              variant="overline"
                              sx={{
                                letterSpacing: '0.14em',
                                color: 'text.secondary',
                                fontWeight: 700
                              }}>
                              Version
                            </Typography>
                            <Typography
                              variant="h4"
                              fontWeight={900}
                              sx={{
                                lineHeight: 1.05,
                                wordBreak: 'break-word',
                                fontSize: { xs: '2rem', sm: '2.4rem' }
                              }}>
                              {note.version}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              variant="overline"
                              sx={{
                                letterSpacing: '0.14em',
                                color: 'text.secondary',
                                fontWeight: 700
                              }}>
                              Date
                            </Typography>
                            <Typography
                              variant="h5"
                              fontWeight={800}
                              sx={{
                                lineHeight: 1.1,
                                color: '#1F3F37',
                                wordBreak: 'break-word'
                              }}>
                              {note.publishedAt || '-'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack spacing={1.5}>
                          <Box>
                            <Typography variant="h6" fontWeight={800}>
                              {title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {summary}
                            </Typography>
                          </Box>

                          <Divider />

                          <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                            {items.map((item) => (
                              <Box component="li" key={item}>
                                <Typography variant="body2">{item}</Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card elevation={0} sx={{ border: '1px dashed #D9DCE3', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {t('general.noData') || 'No release notes found.'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Stack>
    </Page>
  );
}
