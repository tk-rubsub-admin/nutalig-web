import {
  Business,
  CalendarMonth,
  CheckCircle,
  Checklist,
  FlightTakeoff,
  LocalShipping,
  EventAvailable,
  RadioButtonUnchecked,
  Groups
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Checkbox,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { KeyboardEvent, MouseEvent, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { viewMonthGrid } from '@schedule-x/calendar';
import { darken, getLuminance, lighten, readableColor } from 'polished';
import dayjs from 'dayjs';
import 'temporal-polyfill/global';
import '@schedule-x/theme-default';
import { getCalendarEvents } from 'services/Calendar/calendar-api';
import { CalendarEventDto } from 'services/Calendar/calendar-type';
import { getUserTodos, markUserTodoAsDone } from 'services/UserTodo/user-todo-api';
import { UserTodo, UserTodoPriority } from 'services/UserTodo/user-todo-type';
import { buildUserTodoTargetPath } from 'utils/userTodoTarget';

const Temporal = (
  globalThis as typeof globalThis & {
    Temporal: typeof import('temporal-polyfill').Temporal;
  }
).Temporal;
const DASHBOARD_TIME_ZONE = 'Asia/Bangkok';
const DEFAULT_CALENDAR_COLOR = '#64748b';

const getTodoColor = (priority?: UserTodoPriority | null): string => {
  if (priority === 'URGENT') return '#ffe4e6';
  if (priority === 'HIGH') return '#fee2e2';
  if (priority === 'LOW') return '#dcfce7';
  return '#dbeafe';
};

const getTodoNote = (todo: UserTodo): string => {
  if (todo.description) return todo.description;
  if (todo.targetId) return todo.targetId;
  return todo.todoType;
};

const getTodoDueText = (todo: UserTodo): string | null => {
  if (!todo.dueDate) return null;
  return `กำหนด ${dayjs(todo.dueDate).format('DD/MM/YYYY HH:mm')}`;
};

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
}

function getCalendarEventIcon(calendarEvent: CalendarMonthGridEventProps['calendarEvent']) {
  const eventType = calendarEvent.eventType?.trim().toUpperCase();

  if (eventType === 'AIR_SHIPPING') {
    return FlightTakeoff;
  }

  if (eventType === 'SEA_SHIPPING' || eventType === 'LAND_SHIPPING') {
    return LocalShipping;
  }

  if (eventType === 'INTERNAL') {
    return Groups;
  }

  if (eventType === 'HOLIDAY') {
    return EventAvailable;
  }

  return CalendarMonth;
}

function getCalendarEventTime(start?: unknown): string | null {
  if (!start || typeof start !== 'object' || !('hour' in start) || !('minute' in start)) {
    return null;
  }

  const calendarDateTime = start as { hour: number; minute: number };
  return `${String(calendarDateTime.hour).padStart(2, '0')}:${String(calendarDateTime.minute).padStart(2, '0')}`;
}

function CalendarMonthGridEvent({ calendarEvent }: CalendarMonthGridEventProps): JSX.Element {
  const Icon = getCalendarEventIcon(calendarEvent);
  const colorName = calendarEvent.calendarId || buildCalendarColorName(DEFAULT_CALENDAR_COLOR);
  const startTime = getCalendarEventTime(calendarEvent.start);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        width: '100%',
        height: '100%',
        minHeight: 28,
        minWidth: 0,
        px: 0.75,
        py: 0.5,
        borderRadius: 'var(--sx-rounding-extra-small)',
        color: `var(--sx-color-on-${colorName}-container)`,
        backgroundColor: `var(--sx-color-${colorName}-container)`,
        borderInlineStart: `4px solid var(--sx-color-${colorName})`,
        overflow: 'hidden'
      }}>
      <Icon sx={{ fontSize: 14, flexShrink: 0 }} />
      {startTime ? (
        <Typography
          component="span"
          sx={{
            flexShrink: 0,
            fontSize: 12,
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
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.2
        }}>
        {calendarEvent.title || '-'}
      </Typography>
    </Box>
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

export default function HomeWidgets(): JSX.Element {
  const history = useHistory();
  const queryClient = useQueryClient();
  const { data: calendarEventsData } = useQuery<CalendarEventDto[]>(
    ['calendar-events'],
    () => getCalendarEvents(),
    {
      refetchOnWindowFocus: false
    }
  );
  const { data: todoItems = [], isLoading: isTodoLoading } = useQuery<UserTodo[]>(
    ['me-to-dos'],
    () => getUserTodos(),
    {
      refetchOnWindowFocus: false
    }
  );
  const displayTodoItems = useMemo(
    () =>
      [...todoItems].sort((a, b) => {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        return 0;
      }),
    [todoItems]
  );
  const markTodoDoneMutation = useMutation((todoId: number) => markUserTodoAsDone(todoId), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(['me-to-dos']);
      await queryClient.refetchQueries(['me-to-dos'], { active: true });
    }
  });

  const handleOpenTodo = (todo: UserTodo) => {
    const targetPath = buildUserTodoTargetPath(todo);
    if (targetPath) {
      history.push(targetPath);
    }
  };

  const handleTodoKeyDown = (event: KeyboardEvent<HTMLDivElement>, todo: UserTodo) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenTodo(todo);
    }
  };

  const handleMarkTodoDone = (event: MouseEvent<HTMLButtonElement>, todoId: number) => {
    event.stopPropagation();
    markTodoDoneMutation.mutate(todoId);
  };

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

  const toCalendarDate = (value: string) =>
    Temporal.PlainDate.from(dayjs(value).format('YYYY-MM-DD'));

  const eventsServicePlugin = useMemo(() => createEventsServicePlugin(), []);

  const calendarApp = useCalendarApp(
    {
      datePicker: {
        disabled: true
      },
      views: [viewMonthGrid],
      selectedDate: Temporal.PlainDate.from(dayjs().format('YYYY-MM-DD')),
      monthGridOptions: {
        nEventsPerDay: 2
      }
    },
    [eventsServicePlugin]
  );

  const scheduleXEvents = useMemo(
    () =>
      (calendarEventsData || [])
        .filter((event) => event.active !== false)
        .map((event) => {
          const isAllDay = Boolean(event.allDay);
          const colorCode = normalizeCalendarColor(event.colorCode);
          const calendarId = buildCalendarColorName(colorCode);
          const start = isAllDay ? toCalendarDate(event.start) : toCalendarDateTime(event.start);
          const end = isAllDay ? toCalendarDate(event.end) : toCalendarDateTime(event.end);

          return {
            id: String(event.id),
            title: event.title,
            start,
            end,
            description: event.description ?? undefined,
            location: event.location ?? undefined,
            calendarId,
            eventType: event.eventType,
            status: event.status,
            sourceModule: event.sourceModule ?? undefined
          };
        }),
    [calendarEventsData]
  );

  const calendarCustomComponents = useMemo(
    () => ({
      monthGridEvent: CalendarMonthGridEvent
    }),
    []
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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Checklist fontSize="small" />
            <Typography variant="h6" component="h1">
              To-Do List
            </Typography>
          </Stack>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              p: 1.5
            }}>
            <Stack spacing={1}>
              {isTodoLoading ? (
                <Typography variant="body2" color="text.secondary">
                  กำลังโหลดรายการที่ต้องทำ...
                </Typography>
              ) : null}
              {!isTodoLoading && displayTodoItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  ไม่มีรายการที่ต้องทำ
                </Typography>
              ) : null}
              {displayTodoItems.map((item) => {
                const backgroundColor = normalizeCalendarColor(getTodoColor(item.priority));
                const textColor = readableColor(backgroundColor, '#111827', '#ffffff');
                const targetPath = buildUserTodoTargetPath(item);
                const isMarkingDone = markTodoDoneMutation.isLoading;
                const dueText = getTodoDueText(item);
                const isCompleted = item.status === 'DONE';

                return (
                  <Box
                    key={item.id}
                    role={targetPath ? 'button' : undefined}
                    tabIndex={targetPath ? 0 : undefined}
                    onClick={targetPath ? () => handleOpenTodo(item) : undefined}
                    onKeyDown={targetPath ? (event) => handleTodoKeyDown(event, item) : undefined}
                    sx={{
                      display: 'block',
                      width: '100%',
                      border: '1px solid',
                      borderColor: 'transparent',
                      borderRadius: 1,
                      px: 1.25,
                      py: 1,
                      bgcolor: backgroundColor,
                      color: textColor,
                      textAlign: 'left',
                      font: 'inherit',
                      cursor: targetPath ? 'pointer' : 'default',
                      '&:hover': targetPath
                        ? {
                          filter: 'brightness(0.98)'
                        }
                        : undefined
                    }}>
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <Checkbox
                        size="small"
                        checked={isCompleted}
                        disabled={isMarkingDone || isCompleted}
                        onClick={(event) => {
                          if (!isCompleted) {
                            handleMarkTodoDone(event, item.id);
                          }
                        }}
                        icon={<RadioButtonUnchecked fontSize="small" />}
                        checkedIcon={<CheckCircle fontSize="small" />}
                        sx={{
                          mt: '-2px',
                          color: textColor,
                          '&.Mui-checked': {
                            color: textColor
                          }
                        }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          sx={{
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            opacity: isMarkingDone ? 0.75 : 1
                          }}>
                          {item.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="inherit"
                          sx={{
                            opacity: 0.8,
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}
                          display="block">
                          {getTodoNote(item)}
                        </Typography>
                        {dueText ? (
                          <Typography
                            variant="caption"
                            color="inherit"
                            sx={{
                              opacity: 0.72,
                              textDecoration: isCompleted ? 'line-through' : 'none'
                            }}
                            display="block">
                            {dueText}
                          </Typography>
                        ) : null}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </Grid>
      <Grid item xs={12} md={9}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarMonth fontSize="small" />
          <Typography variant="h6" component="h1">
            ปฏิทิน Nutalig
          </Typography>
        </Stack>
        <Box
          sx={{
            height: 760,
            overflow: 'hidden',
            '& .sx__calendar-wrapper': {
              height: 760,
              minHeight: 760
            },
            '& .sx__date-input-wrapper, & .sx__date-picker-popup': {
              display: 'none'
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
              overflow: 'hidden'
            },
            '& .sx__month-grid-day:has(.sx__month-grid-day__header-date.sx__is-today)': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)'
            },
            '& .sx__month-grid-day:has(.sx__month-grid-day__header-date.sx__is-today)::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(25, 118, 210, 0.28)',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              zIndex: 0
            },
            '& .sx__month-grid-day:has(.sx__month-grid-day__header-date.sx__is-today) > *': {
              position: 'relative',
              zIndex: 1
            },
            '& .sx__month-grid-day__events': {
              overflow: 'hidden'
            },
            '& .sx__month-grid-event': {
              minHeight: 28
            }
          }}>
          {calendarApp ? (
            <ScheduleXCalendar
              calendarApp={calendarApp}
              customComponents={calendarCustomComponents}
            />
          ) : null}
        </Box>
      </Grid>
    </Grid>
  );
}
