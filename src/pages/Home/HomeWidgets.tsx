import {
  CalendarMonth,
  CheckCircle,
  Checklist,
  RadioButtonUnchecked
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Checkbox,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { viewMonthGrid } from '@schedule-x/calendar';
import { darken, getLuminance, lighten, readableColor } from 'polished';
import dayjs from 'dayjs';
import 'temporal-polyfill/global';
import '@schedule-x/theme-default';
import { getCalendarEvents } from 'services/Calendar/calendar-api';
import { CalendarEventDto } from 'services/Calendar/calendar-type';

const Temporal = (
  globalThis as typeof globalThis & {
    Temporal: typeof import('temporal-polyfill').Temporal;
  }
).Temporal;
const DASHBOARD_TIME_ZONE = 'Asia/Bangkok';
const DEFAULT_CALENDAR_COLOR = '#64748b';
const TODO_ITEMS = [
  {
    id: 1,
    title: 'ติดตามใบเสนอราคาที่รออนุมัติ',
    note: 'RFQ-2026-0042',
    status: 'High',
    colorCode: '#fee2e2',
    due: 'วันนี้ 15:30'
  },
  {
    id: 2,
    title: 'ตรวจสอบ Sales Order ที่สร้างจาก RFQ',
    note: 'SO-2026-0187',
    status: 'In progress',
    colorCode: '#fef3c7',
    due: 'พรุ่งนี้ 10:00'
  },
  {
    id: 3,
    title: 'ยืนยันนัดหมายกับ supplier',
    note: 'Supplier follow-up',
    status: 'Low',
    colorCode: '#dcfce7',
    due: 'ศุกร์นี้'
  },
  {
    id: 4,
    title: 'ปิดงานค้างในแดชบอร์ด',
    note: 'Dashboard cleanup',
    status: 'Open',
    colorCode: '#e2e8f0',
    due: 'ยังไม่กำหนด'
  },
  {
    id: 5,
    title: 'ส่งอีเมลแจ้งลูกค้าเรื่องเอกสารค้าง',
    note: 'Customer follow-up',
    status: 'Medium',
    colorCode: '#dbeafe',
    due: 'วันนี้ 16:00'
  },
  {
    id: 6,
    title: 'อัปเดตสถานะ shipment',
    note: 'Shipment tracking',
    status: 'High',
    colorCode: '#ffe4e6',
    due: 'วันนี้ 17:30'
  },
  {
    id: 7,
    title: 'ตรวจสอบยอดคงเหลือสต็อก',
    note: 'Inventory review',
    status: 'Low',
    colorCode: '#ecfccb',
    due: 'พรุ่งนี้ 09:00'
  },
  {
    id: 8,
    title: 'อนุมัติใบสั่งซื้อจากทีมขาย',
    note: 'Purchase approval',
    status: 'In progress',
    colorCode: '#fce7f3',
    due: 'พรุ่งนี้ 11:15'
  },
  {
    id: 9,
    title: 'เตรียมเอกสารสำหรับประชุม supplier',
    note: 'Meeting prep',
    status: 'Open',
    colorCode: '#e0f2fe',
    due: 'อังคารหน้า'
  },
  {
    id: 10,
    title: 'รีวิวข้อมูล dashboard ประจำสัปดาห์',
    note: 'Weekly review',
    status: 'Medium',
    colorCode: '#ede9fe',
    due: 'พุธหน้า'
  },
  {
    id: 11,
    title: 'ติดตามการตอบกลับจากฝ่ายบัญชี',
    note: 'Finance follow-up',
    status: 'High',
    colorCode: '#fef9c3',
    due: 'วันนี้ 14:00'
  },
  {
    id: 12,
    title: 'ปิดงานเอกสารที่ตรวจสอบแล้ว',
    note: 'Completed paperwork',
    status: 'Low',
    colorCode: '#dcfce7',
    due: 'ศุกร์หน้า'
  }
] as const;

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
  const { data: calendarEventsData } = useQuery<CalendarEventDto[]>(
    ['calendar-events'],
    () => getCalendarEvents(),
    {
      refetchOnWindowFocus: false
    }
  );
  const [completedTodoIds, setCompletedTodoIds] = useState<number[]>([3]);

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
            calendarId
          };
        }),
    [calendarEventsData]
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
              {TODO_ITEMS.map((item) => {
                const backgroundColor = normalizeCalendarColor(item.colorCode);
                const textColor = readableColor(backgroundColor, '#111827', '#ffffff');
                const isCompleted = completedTodoIds.includes(item.id);

                return (
                  <Box
                    key={item.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'transparent',
                      borderRadius: 1,
                      px: 1.25,
                      py: 1,
                      bgcolor: backgroundColor,
                      color: textColor
                    }}>
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <Checkbox
                        size="small"
                        checked={isCompleted}
                        onChange={() => {
                          setCompletedTodoIds((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id]
                          );
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
                            opacity: isCompleted ? 0.75 : 1
                          }}>
                          {item.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="inherit"
                          sx={{ opacity: 0.8 }}
                          display="block">
                          {item.note}
                        </Typography>
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
              minHeight: 0,
              overflow: 'hidden'
            },
            '& .sx__month-grid-day__events': {
              overflow: 'hidden'
            }
          }}>
          {calendarApp ? <ScheduleXCalendar calendarApp={calendarApp} /> : null}
        </Box>
      </Grid>
    </Grid>
  );
}
