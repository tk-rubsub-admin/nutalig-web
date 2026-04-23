import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { useAuth } from 'auth/AuthContext';
import dayjs from 'dayjs';
import { ReactElement } from 'react';
import { ActivityHistoryRecord } from 'services/ActivityHistory/activity-history-type';

interface ActivityHistoryTimelineProps {
  records: ActivityHistoryRecord[];
  emptyMessage?: string;
}

type DetailJsonSection = Record<string, unknown>;

interface ParsedDetailJson {
  before?: DetailJsonSection;
  after?: DetailJsonSection;
}

function formatDateTime(value?: string | null): string {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm:ss') : '-';
}

function parseDetailJson(detailJson?: string | null): ParsedDetailJson | null {
  if (!detailJson) {
    return null;
  }

  try {
    return JSON.parse(detailJson) as ParsedDetailJson;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatFieldLabel(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderCompareSections(detailJson?: string | null): ReactElement | null {
  const parsed = parseDetailJson(detailJson);

  if (
    !parsed?.before ||
    !parsed?.after ||
    !isPlainObject(parsed.before) ||
    !isPlainObject(parsed.after)
  ) {
    return null;
  }

  const fields = Array.from(new Set([...Object.keys(parsed.before), ...Object.keys(parsed.after)]));

  return (
    <Box
      sx={{
        mt: 0.5,
        border: '1px solid #e6ebf1',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: '#fcfdff'
      }}>
      <Grid container>
        <Grid item xs={12} md={6} sx={{ borderRight: { md: '1px solid #e6ebf1' } }}>
          <Box
            sx={{ px: 2, py: 1.25, backgroundColor: '#fff7ed', borderBottom: '1px solid #e6ebf1' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Before
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box
            sx={{ px: 2, py: 1.25, backgroundColor: '#ecfeff', borderBottom: '1px solid #e6ebf1' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              After
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {fields.map((field, index) => {
        const beforeValue = parsed.before?.[field];
        const afterValue = parsed.after?.[field];
        const isChanged = formatFieldValue(beforeValue) !== formatFieldValue(afterValue);

        return (
          <Grid
            container
            key={field}
            sx={{
              borderBottom: index < fields.length - 1 ? '1px solid #eef2f7' : 'none',
              backgroundColor: isChanged ? '#f8fafc' : '#fff'
            }}>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                px: 2,
                py: 1.5,
                borderRight: { md: '1px solid #eef2f7' }
              }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}>
                {formatFieldLabel(field)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily:
                    isPlainObject(beforeValue) || Array.isArray(beforeValue)
                      ? 'monospace'
                      : 'inherit'
                }}>
                {formatFieldValue(beforeValue)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ px: 2, py: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}>
                {formatFieldLabel(field)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily:
                    isPlainObject(afterValue) || Array.isArray(afterValue) ? 'monospace' : 'inherit'
                }}>
                {formatFieldValue(afterValue)}
              </Typography>
            </Grid>
          </Grid>
        );
      })}
    </Box>
  );
}

export default function ActivityHistoryTimeline({
  records,
  emptyMessage = 'ไม่พบประวัติการใช้งาน'
}: ActivityHistoryTimelineProps): ReactElement {
  const { getRole } = useAuth();
  const isSuperAdmin = getRole() === 'SUPER_ADMIN';

  if (!records.length) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          border: '1px dashed #d7dce2',
          backgroundColor: '#fff'
        }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Timeline
      sx={{
        m: 0,
        p: 0,
        [`& .MuiTimelineItem-root:before`]: {
          flex: 0,
          padding: 0
        }
      }}>
      {records.map((history, index) => (
        <TimelineItem key={history.id}>
          <TimelineSeparator>
            <TimelineDot>
              <LaptopMacIcon />
            </TimelineDot>
            {index < records.length - 1 ? (
              <TimelineConnector sx={{ backgroundColor: '#d7e3ff' }} />
            ) : null}
          </TimelineSeparator>
          <TimelineContent sx={{ pb: 3, pt: 0.25 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e6ebf1',
                backgroundColor: '#fff',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
              }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {history.summary || '-'}
                </Typography>

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(history.actionAt)}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  ผู้ใช้งาน: {history.actorId || '-'}
                </Typography>

                {isSuperAdmin ? renderCompareSections(history.detailJson) : null}
              </Stack>
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
