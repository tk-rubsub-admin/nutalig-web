export interface CalendarEventDto {
  id: number;
  title: string;
  description?: string | null;
  eventType: string;
  status: string;
  start: string;
  end: string;
  allDay?: boolean | null;
  colorCode?: string | null;
  sourceModule?: string | null;
  sourceId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  assignedToEmployeeId?: string | null;
  location?: string | null;
  remark?: string | null;
  active?: boolean | null;
}

export interface CreateMyCalendarEventRequest {
  title: string;
  description?: string | null;
  start: string;
  end: string;
  allDay?: boolean | null;
  remark?: string | null;
}
