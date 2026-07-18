import {
  Business,
  Add,
  CalendarMonth,
  FlightTakeoff,
  LocalShipping,
  EventAvailable,
  Groups,
  MeetingRoom,
  FlightLand
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Chip,
  Grid,
  TextField,
  Tooltip,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { viewMonthGrid } from '@schedule-x/calendar';
import { darken, getLuminance, lighten, readableColor } from 'polished';
import dayjs from 'dayjs';
import 'temporal-polyfill/global';
import '@schedule-x/theme-default';
import UserTodoPanel from 'components/UserTodoPanel';
import { createMyCalendarEvent, getCalendarEvents } from 'services/Calendar/calendar-api';
import { CalendarEventDto, CreateMyCalendarEventRequest } from 'services/Calendar/calendar-type';
import { ROUTE_PATHS } from 'routes';

const Temporal = (
  globalThis as typeof globalThis & {
    Temporal: typeof import('temporal-polyfill').Temporal;
  }
).Temporal;
const DASHBOARD_TIME_ZONE = 'Asia/Bangkok';
const DEFAULT_CALENDAR_COLOR = '#64748b';

const normalizeCalendarColor = (value?: string | null) => {
  const color = (value || DEFAULT_CALENDAR_COLOR).trim();
  if (color.startsWith('#')) {
    return color;
  }

  if (/^[0-9a-f]{3,8}$/i.test(color)) {
    return `#${color}`;
  }

  return DEFAULT_CALENDAR_COLOR;
};

const buildCalendarColorName = (colorCode: string) =>
  `calendar-${colorCode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'default'}`;

const buildCalendarColors = (colorCode: string) => {
  const main = normalizeCalendarColor(colorCode);
  const container = getLuminance(main) < 0.5 ? lighten(0.36, main) : darken(0.08, main);
  const onContainer = readableColor(container, '#000', '#fff');

  return {
    main,
    container,
    onContainer
  };
};

interface CalendarMonthGridEventProps {
  calendarEvent: {
    title?: string;
    start?: unknown;
    calendarId?: string;
    eventType?: string | null;
    status?: string | null;
    sourceModule?: string | null;
  };
  compact?: boolean;
}

interface CalendarDialogEvent {
  title?: string;
  description?: string | null;
  location?: string | null;
  start?: string | { year: number; month: number; day: number; hour?: number; minute?: number };
  end?: string | { year: number; month: number; day: number; hour?: number; minute?: number };
  eventType?: string | null;
  status?: string | null;
}

function getCalendarEventIcon(calendarEvent: CalendarMonthGridEventProps['calendarEvent']) {
  const eventType = calendarEvent.eventType?.trim().toUpperCase();

  if (eventType === 'AIR_SHIPPING') {
    return FlightLand;
  }

  if (eventType === 'SEA_SHIPPING' || eventType === 'LAND_SHIPPING') {
    return LocalShipping;
  }

  if (eventType === 'INTERNAL') {
    return MeetingRoom;
  }

  if (eventType === 'HOLIDAY' || eventType === 'CHINA_HOLIDAY') {
    return EventAvailable;
  }

  return CalendarMonth;
}

function getCalendarEventTime(start?: unknown): string | null {
  if (!start || typeof start !== 'object' || !('hour' in start) || !('minute' in start)) {
    return null;
  }

  const calendarDateTime = start as { hour: number; minute: number };
  return `${String(calendarDateTime.hour).padStart(2, '0')}:${String(
    calendarDateTime.minute
  ).padStart(2, '0')}`;
}

function CalendarMonthGridEvent({
  calendarEvent,
  compact = false
}: CalendarMonthGridEventProps): JSX.Element {
  const Icon = getCalendarEventIcon(calendarEvent);
  const colorName = calendarEvent.calendarId || buildCalendarColorName(DEFAULT_CALENDAR_COLOR);
  const startTime = getCalendarEventTime(calendarEvent.start);
  const fullTitle = calendarEvent.title || '-';

  return (
    <Tooltip title={fullTitle} arrow placement="top" enterDelay={300}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0 : 0.5,
          width: '100%',
          height: '100%',
          minHeight: compact ? 24 : 28,
          minWidth: 0,
          px: compact ? 0 : 0.75,
          py: compact ? 0 : 0.5,
          borderRadius: compact ? 999 : 'var(--sx-rounding-extra-small)',
          color: compact ? 'transparent' : `var(--sx-color-on-${colorName}-container)`,
          backgroundColor: compact
            ? `var(--sx-color-${colorName})`
            : `var(--sx-color-${colorName}-container)`,
          borderInlineStart: compact ? 'none' : `4px solid var(--sx-color-${colorName})`,
          overflow: 'hidden'
        }}>
        {compact ? null : (
          <>
            <Icon sx={{ fontSize: compact ? 12 : 14, flexShrink: 0 }} />
            {startTime ? (
              <Typography
                component="span"
                sx={{
                  flexShrink: 0,
                  fontSize: compact ? 10 : 12,
                  fontWeight: 700,
                  lineHeight: 1.2
                }}>
                {startTime}
              </Typography>
            ) : null}
            <Typography
              component="span"
              sx={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: compact ? 10 : 12,
                fontWeight: 700,
                lineHeight: 1.2
              }}>
              {fullTitle}
            </Typography>
          </>
        )}
      </Box>
    </Tooltip>
  );
}

const applyCalendarColors = (
  definitions: Record<
    string,
    { colorName: string; lightColors: { main: string; container: string; onContainer: string } }
  >
) => {
  if (typeof document === 'undefined') {
    return;
  }

  Object.values(definitions).forEach((definition) => {
    const { colorName, lightColors } = definition;
    document.documentElement.style.setProperty(`--sx-color-${colorName}`, lightColors.main);
    document.documentElement.style.setProperty(
      `--sx-color-${colorName}-container`,
      lightColors.container
    );
    document.documentElement.style.setProperty(
      `--sx-color-on-${colorName}-container`,
      lightColors.onContainer
    );
  });
};

const getDefaultCalendarStart = () =>
  dayjs().add(1, 'day').hour(12).minute(0).second(0).millisecond(0).toISOString();

const getDefaultCalendarEnd = () =>
  dayjs().add(1, 'day').hour(13).minute(0).second(0).millisecond(0).toISOString();

export default function HomeWidgets(): JSX.Element {
  const history = useHistory();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarDialogEvent | null>(
    null
  );
  const [isCreateCalendarDialogOpen, setIsCreateCalendarDialogOpen] = useState(false);
  const [createCalendarForm, setCreateCalendarForm] = useState<CreateMyCalendarEventRequest>({
    title: '',
    description: '',
    start: getDefaultCalendarStart(),
    end: getDefaultCalendarEnd(),
    allDay: false,
    remark: ''
  });
  const { data: calendarEventsData } = useQuery<CalendarEventDto[]>(
    ['calendar-events'],
    () => getCalendarEvents(),
    {
      refetchOnWindowFocus: false
    }
  );
  const createCalendarMutation = useMutation(
    (payload: CreateMyCalendarEventRequest) => createMyCalendarEvent(payload),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['calendar-events']);
        await queryClient.refetchQueries(['calendar-events'], { active: true });
        setIsCreateCalendarDialogOpen(false);
        setCreateCalendarForm({
          title: '',
          description: '',
          start: getDefaultCalendarStart(),
          end: getDefaultCalendarEnd(),
          allDay: false,
          remark: ''
        });
      }
    }
  );

  const calendarDefinitions = useMemo(() => {
    const definitions: Record<
      string,
      {
        colorName: string;
        lightColors: { main: string; container: string; onContainer: string };
        darkColors: { main: string; container: string; onContainer: string };
      }
    > = {};

    const uniqueColorCodes = new Set(
      (calendarEventsData || [])
        .filter((event) => event.active !== false)
        .map((event) => normalizeCalendarColor(event.colorCode))
    );

    uniqueColorCodes.forEach((colorCode) => {
      const colorName = buildCalendarColorName(colorCode);
      const colors = buildCalendarColors(colorCode);
      definitions[colorName] = {
        colorName,
        lightColors: colors,
        darkColors: colors
      };
    });

    return definitions;
  }, [calendarEventsData]);

  const toCalendarDateTime = (value: string) =>
    Temporal.Instant.from(dayjs(value).toISOString()).toZonedDateTimeISO(DASHBOARD_TIME_ZONE);

  const eventsServicePlugin = useMemo(() => createEventsServicePlugin(), []);

  const calendarApp = useCalendarApp(
    {
      datePicker: {
        disabled: true
      },
      callbacks: {
        onEventClick: (event) => {
          setSelectedCalendarEvent({
            title: event.title,
            description: event.description,
            location: event.location,
            start: event.start,
            end: event.end,
            eventType: event.eventType,
            status: event.status
          });
        }
      },
      views: [viewMonthGrid],
      selectedDate: Temporal.PlainDate.from(dayjs().format('YYYY-MM-DD')),
      monthGridOptions: {
        nEventsPerDay: isMobile ? 1 : 2
      }
    },
    [eventsServicePlugin]
  );

  const expandAllDayCalendarEvent = (event: CalendarEventDto) => {
    if (!event.allDay) {
      return [
        {
          id: String(event.id),
          title: event.title,
          start: toCalendarDateTime(event.start),
          end: toCalendarDateTime(event.end),
          description: event.description ?? undefined,
          location: event.location ?? undefined,
          calendarId: buildCalendarColorName(normalizeCalendarColor(event.colorCode)),
          eventType: event.eventType,
          status: event.status,
          sourceModule: event.sourceModule ?? undefined,
          sourceId: event.sourceId ?? undefined
        }
      ];
    }

    const startDate = dayjs(event.start).startOf('day');
    const inclusiveEndDate = dayjs(event.end).subtract(1, 'day').startOf('day');
    const lastDate = inclusiveEndDate.isBefore(startDate, 'day') ? startDate : inclusiveEndDate;
    const colorCode = normalizeCalendarColor(event.colorCode);
    const calendarId = buildCalendarColorName(colorCode);
    const items = [];
    let currentDate = startDate;

    while (currentDate.isSame(lastDate, 'day') || currentDate.isBefore(lastDate, 'day')) {
      const plainDate = Temporal.PlainDate.from(currentDate.format('YYYY-MM-DD'));
      const fragmentKey = currentDate.format('YYYY-MM-DD');
      items.push({
        id: `${event.id}-${fragmentKey}`,
        title: event.title,
        start: plainDate,
        end: plainDate,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        calendarId,
        eventType: event.eventType,
        status: event.status,
        sourceModule: event.sourceModule ?? undefined,
        sourceId: event.sourceId ?? undefined
      });
      currentDate = currentDate.add(1, 'day');
    }

    return items;
  };

  const scheduleXEvents = useMemo(
    () =>
      (calendarEventsData || [])
        .filter((event) => event.active !== false)
        .flatMap((event) => expandAllDayCalendarEvent(event)),
    [calendarEventsData]
  );

  const calendarCustomComponents = useMemo(
    () => ({
      monthGridEvent: (props: CalendarMonthGridEventProps) => (
        <CalendarMonthGridEvent {...props} compact={isMobile} />
      )
    }),
    [isMobile]
  );

  useEffect(() => {
    if (!calendarApp) {
      return;
    }

    const timer = window.setTimeout(() => {
      eventsServicePlugin.$app.config.calendars.value = calendarDefinitions;
      applyCalendarColors(calendarDefinitions);
      eventsServicePlugin.set(scheduleXEvents);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [calendarApp, calendarDefinitions, eventsServicePlugin, scheduleXEvents]);

  const formatCalendarDialogDateTime = (value?: CalendarDialogEvent['start']) => {
    if (!value) return '-';
    if (typeof value === 'string') {
      return dayjs(value).format('DD/MM/YYYY HH:mm');
    }

    const hasTime = typeof value.hour === 'number' && typeof value.minute === 'number';
    return dayjs(
      new Date(
        value.year,
        Math.max(value.month - 1, 0),
        value.day,
        hasTime ? value.hour || 0 : 0,
        hasTime ? value.minute || 0 : 0
      )
    ).format(hasTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY');
  };

  const handleCreateCalendarEvent = () => {
    if (!createCalendarForm.title?.trim()) {
      return;
    }

    createCalendarMutation.mutate({
      title: createCalendarForm.title.trim(),
      description: createCalendarForm.description?.trim() || null,
      start: createCalendarForm.start,
      end: createCalendarForm.end,
      allDay: Boolean(createCalendarForm.allDay),
      remark: createCalendarForm.remark?.trim() || null
    });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <UserTodoPanel
          maxItems={10}
          onViewMore={() => {
            history.push(ROUTE_PATHS.TODO_MANAGEMENT);
          }}
        />
      </Grid>
      <Grid item xs={12} md={9}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonth fontSize="small" />
            <Typography variant="h6" component="h1">
              ปฏิทิน Nutalig
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateCalendarDialogOpen(true)}>
            เพิ่มปฏิทิน
          </Button>
        </Stack>
        <Box
          sx={{
            mt: 1,
            height: isMobile ? 560 : 760,
            overflow: 'hidden',
            borderRadius: 0,
            bgcolor: isMobile ? '#f5f5f7' : 'transparent',
            border: isMobile ? '1px solid rgba(15, 23, 42, 0.08)' : 'none',
            boxShadow: isMobile ? '0 18px 40px rgba(15, 23, 42, 0.08)' : 'none',
            p: isMobile ? 1 : 0,
            '& .sx__calendar': {
              height: '100%',
              border: 'none',
              borderRadius: 0,
              backgroundColor: isMobile ? '#ffffff' : 'transparent',
              overflow: 'hidden'
            },
            '& .sx__calendar-wrapper': {
              height: isMobile ? 560 : 760,
              minHeight: isMobile ? 560 : 760
            },
            '& .sx__date-input-wrapper, & .sx__date-picker-popup': {
              display: 'none'
            },
            '& .sx__view-container': {
              backgroundColor: 'transparent'
            },
            '& .sx__calendar-header': {
              paddingInline: isMobile ? '16px' : undefined,
              paddingBlock: isMobile ? '12px 8px' : undefined,
              backgroundColor: isMobile ? '#ffffff' : undefined,
              borderBottom: isMobile ? '1px solid rgba(15, 23, 42, 0.06)' : undefined
            },
            '& .sx__calendar-header-content': {
              fontSize: isMobile ? '1rem' : undefined,
              fontWeight: isMobile ? 700 : undefined,
              letterSpacing: isMobile ? '-0.02em' : undefined,
              color: isMobile ? '#111827' : undefined
            },
            '& .sx__month-grid': {
              paddingInline: isMobile ? '6px' : 0,
              paddingBottom: isMobile ? '8px' : 0,
              backgroundColor: isMobile ? '#ffffff' : 'transparent'
            },
            '& .sx__month-grid-day-name-row': {
              paddingInline: isMobile ? '6px' : 0,
              marginBottom: isMobile ? '4px' : 0,
              color: isMobile ? '#6b7280' : undefined,
              fontSize: isMobile ? '0.7rem' : undefined,
              fontWeight: isMobile ? 700 : undefined,
              textTransform: isMobile ? 'uppercase' : undefined,
              letterSpacing: isMobile ? '0.08em' : undefined
            },
            '& .sx__month-grid-wrapper': {
              height: '100%'
            },
            '& .sx__month-grid-week': {
              minHeight: 0
            },
            '& .sx__month-grid-day': {
              position: 'relative',
              minHeight: 0,
              overflow: 'hidden',
              ...(isMobile
                ? {
                  borderRadius: 0,
                  margin: '2px',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                  backgroundColor: '#fbfbfd',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)'
                }
                : {})
            },
            '& .sx__month-grid-day:has(.sx__month-grid-day__header-date.sx__is-today)': {
              backgroundColor: isMobile ? 'rgba(59, 130, 246, 0.1)' : 'rgba(25, 118, 210, 0.08)'
            },
            '& .sx__month-grid-day:has(.sx__month-grid-day__header-date.sx__is-today)::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              border: isMobile
                ? '1.5px solid rgba(59, 130, 246, 0.35)'
                : '1px solid rgba(25, 118, 210, 0.28)',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              zIndex: 0
            },
            '& .sx__month-grid-day:has(.sx__month-grid-day__header-date.sx__is-today) > *': {
              position: 'relative',
              zIndex: 1
            },
            '& .sx__month-grid-day__header': {
              paddingInline: isMobile ? '8px' : undefined,
              paddingTop: isMobile ? '8px' : undefined
            },
            '& .sx__month-grid-day__header-date': {
              width: isMobile ? 28 : undefined,
              height: isMobile ? 28 : undefined,
              borderRadius: isMobile ? '50%' : undefined,
              display: isMobile ? 'inline-flex' : undefined,
              alignItems: isMobile ? 'center' : undefined,
              justifyContent: isMobile ? 'center' : undefined,
              fontSize: isMobile ? '0.85rem' : undefined,
              fontWeight: isMobile ? 700 : undefined
            },
            '& .sx__month-grid-day__header-date.sx__is-today': {
              backgroundColor: isMobile ? '#111827' : undefined,
              color: isMobile ? '#ffffff' : undefined
            },
            '& .sx__month-grid-day__events': {
              overflow: 'hidden',
              paddingInline: isMobile ? '6px' : undefined,
              paddingBottom: isMobile ? '6px' : undefined,
              gap: isMobile ? '4px' : undefined
            },
            '& .sx__month-grid-event': {
              minHeight: isMobile ? 24 : 28
            },
            '& .sx__month-grid-day--other-month': {
              opacity: isMobile ? 0.42 : undefined
            }
          }}>
          {calendarApp ? (
            <ScheduleXCalendar
              calendarApp={calendarApp}
              customComponents={calendarCustomComponents}
            />
          ) : null}
        </Box>
        <Dialog
          open={Boolean(selectedCalendarEvent)}
          onClose={() => setSelectedCalendarEvent(null)}
          fullWidth
          maxWidth="xs">
          <DialogTitle>{selectedCalendarEvent?.title || 'รายละเอียดกิจกรรม'}</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  วันเวลาเริ่ม
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCalendarDialogDateTime(selectedCalendarEvent?.start)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  วันเวลาสิ้นสุด
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCalendarDialogDateTime(selectedCalendarEvent?.end)}
                </Typography>
              </Box>
              {selectedCalendarEvent?.eventType ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ประเภท
                  </Typography>
                  <Typography variant="body2">{selectedCalendarEvent.eventType}</Typography>
                </Box>
              ) : null}
              {selectedCalendarEvent?.status ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    สถานะ
                  </Typography>
                  <Typography variant="body2">{selectedCalendarEvent.status}</Typography>
                </Box>
              ) : null}
              {selectedCalendarEvent?.location ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    สถานที่
                  </Typography>
                  <Typography variant="body2">{selectedCalendarEvent.location}</Typography>
                </Box>
              ) : null}
              {selectedCalendarEvent?.description ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    รายละเอียด
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedCalendarEvent.description}
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isCreateCalendarDialogOpen}
          onClose={() => {
            if (!createCalendarMutation.isLoading) {
              setIsCreateCalendarDialogOpen(false);
            }
          }}
          fullWidth
          maxWidth="sm">
          <DialogTitle>เพิ่มรายการปฏิทิน</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="หัวข้อ"
                value={createCalendarForm.title}
                onChange={(event) =>
                  setCreateCalendarForm((prev) => ({
                    ...prev,
                    title: event.target.value
                  }))
                }
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="รายละเอียด"
                value={createCalendarForm.description || ''}
                onChange={(event) =>
                  setCreateCalendarForm((prev) => ({
                    ...prev,
                    description: event.target.value
                  }))
                }
                fullWidth
                multiline
                minRows={3}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="วันเวลาเริ่ม"
                type="datetime-local"
                value={dayjs(createCalendarForm.start).format('YYYY-MM-DDTHH:mm')}
                onChange={(event) =>
                  setCreateCalendarForm((prev) => ({
                    ...prev,
                    start: dayjs(event.target.value).toISOString()
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="วันเวลาสิ้นสุด"
                type="datetime-local"
                value={dayjs(createCalendarForm.end).format('YYYY-MM-DDTHH:mm')}
                onChange={(event) =>
                  setCreateCalendarForm((prev) => ({
                    ...prev,
                    end: dayjs(event.target.value).toISOString()
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(createCalendarForm.allDay)}
                    onChange={(event) => {
                      const checked = event.target.checked;

                      setCreateCalendarForm((prev) => {
                        if (!checked) {
                          return {
                            ...prev,
                            allDay: false
                          };
                        }

                        const startDate = dayjs(prev.start);
                        const endDate = dayjs(prev.end);

                        return {
                          ...prev,
                          allDay: true,
                          start: startDate.hour(0).minute(0).second(0).millisecond(0).toISOString(),
                          end: endDate.hour(23).minute(59).second(0).millisecond(0).toISOString()
                        };
                      });
                    }}
                  />
                }
                label="ทั้งวัน"
              />
              <TextField
                label="หมายเหตุ"
                value={createCalendarForm.remark || ''}
                onChange={(event) =>
                  setCreateCalendarForm((prev) => ({
                    ...prev,
                    remark: event.target.value
                  }))
                }
                fullWidth
                multiline
                minRows={2}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              className="btn-crimson-red"
              variant="contained"
              onClick={() => setIsCreateCalendarDialogOpen(false)}
              disabled={createCalendarMutation.isLoading}>
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateCalendarEvent}
              disabled={createCalendarMutation.isLoading || !createCalendarForm.title?.trim()}
              startIcon={
                createCalendarMutation.isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Add />
                )
              }>
              บันทึกรายการ
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Grid>
  );
}
