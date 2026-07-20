import { api } from 'api/api';
import {
  CalendarEventDto,
  CreateMyCalendarEventRequest,
  UpdateMyCalendarEventRequest
} from './calendar-type';

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

export const getMyCalendarEvents = async (
  params?: GetCalendarEventsParams
): Promise<CalendarEventDto[]> => {
  const response = await api
    .get<GeneralResponse<CalendarEventDto[]>>('/v1/me/calendar-event', {
      params
    })
    .then((res) => res.data.data);

  return response || [];
};

export const createMyCalendarEvent = async (
  payload: CreateMyCalendarEventRequest
): Promise<CalendarEventDto> => {
  const response = await api
    .post<GeneralResponse<CalendarEventDto>>('/v1/me/calendar-events', {
      ...payload,
      eventType: 'PRIVATE'
    })
    .then((res) => res.data.data);

  return response;
};

export const updateMyCalendarEvent = async (
  eventId: number,
  payload: UpdateMyCalendarEventRequest
): Promise<CalendarEventDto> => {
  const response = await api
    .patch<GeneralResponse<CalendarEventDto>>(`/v1/me/calendar-event/${eventId}`, payload)
    .then((res) => res.data.data);

  return response;
};

export const deleteMyCalendarEvent = async (eventId: number): Promise<boolean> => {
  const response = await api
    .delete<GeneralResponse<boolean>>(`/v1/me/calendar-event/${eventId}`)
    .then((res) => res.data.data);

  return Boolean(response);
};
