import { api } from 'api/api';
import { CreateUserTodoRequest, UserTodo, UserTodoStatus, UserTodoType } from './user-todo-type';

interface GeneralResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface GetUserTodosParams {
  statuses?: UserTodoStatus[];
  todoType?: UserTodoType;
}

export const getUserTodos = async (params?: GetUserTodosParams): Promise<UserTodo[]> => {
  const queryParams = new URLSearchParams();

  params?.statuses?.forEach((status) => {
    queryParams.append('statuses', status);
  });

  if (params?.todoType) {
    queryParams.append('todoType', params.todoType);
  }

  const response = await api
    .get<GeneralResponse<UserTodo[]>>('/v1/me/to-dos', { params: queryParams })
    .then((res) => res.data.data);

  return response || [];
};

export const markUserTodoAsDone = async (id: number): Promise<UserTodo> => {
  const response = await api
    .patch<GeneralResponse<UserTodo>>(`/v1/me/to-dos/${id}/done`)
    .then((res) => res.data.data);

  return response;
};

export const createUserTodo = async (payload: CreateUserTodoRequest): Promise<UserTodo> => {
  const response = await api
    .post<GeneralResponse<UserTodo>>('/v1/me/to-dos', payload)
    .then((res) => res.data.data);

  return response;
};
