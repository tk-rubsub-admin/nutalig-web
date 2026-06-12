import { api } from 'api/api';
import { CalendarEventDto } from './calendar-type';

interface GeneralResponse<T> {
  status: string;
  data: T;
  message?: string;
}

interface GetCalendarEventsParams {
  start?: string;
  end?: string;
}

export const getCalendarEvents = async (
  params?: GetCalendarEventsParams
): Promise<CalendarEventDto[]> => {
  const response = await api
    .get<GeneralResponse<CalendarEventDto[]>>('/v1/calendar-events', {
      params
    })
    .then((res) => res.data.data);

  return response || [];
};
