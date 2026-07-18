export type UserTodoType =
  | 'GENERAL'
  | 'RFQ'
  | 'PRICE_INQUIRY'
  | 'SALE_ORDER'
  | 'QUOTATION'
  | 'CUSTOMER'
  | 'SUPPLIER';

export type UserTodoStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export type UserTodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserTodo {
  id: number;
  ownerUserId: string;
  todoType: UserTodoType;
  title: string;
  description?: string | null;
  status: UserTodoStatus;
  priority: UserTodoPriority;
  targetModule?: string | null;
  targetId?: string | null;
  targetPath?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;
  sortOrder?: number | null;
  active: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface CreateUserTodoRequest {
  todoType?: UserTodoType;
  title: string;
  description?: string | null;
  priority?: UserTodoPriority;
  targetModule?: string | null;
  targetId?: string | null;
  targetPath?: string | null;
  dueDate?: string | null;
  sortOrder?: number | null;
}
