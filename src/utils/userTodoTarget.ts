import { ROUTE_PATHS } from 'routes';
import { UserTodo } from 'services/UserTodo/user-todo-type';

function normalizeTargetModule(todo: Pick<UserTodo, 'todoType' | 'targetModule'>): string {
  return (todo.targetModule || todo.todoType || 'GENERAL').trim().toUpperCase();
}

function replaceRouteId(routePath: string, targetId: string): string {
  return routePath.replace(':id', encodeURIComponent(targetId));
}

export function buildUserTodoTargetPath(
  todo: Pick<UserTodo, 'todoType' | 'targetModule' | 'targetId' | 'targetPath'>
): string | null {
  if (todo.targetPath) {
    return todo.targetPath;
  }

  if (!todo.targetId) {
    return null;
  }

  const targetId = todo.targetId;

  switch (normalizeTargetModule(todo)) {
    case 'RFQ':
      return replaceRouteId(ROUTE_PATHS.RFQ_DETAIL, targetId);
    case 'PRICE_INQUIRY':
      return replaceRouteId(ROUTE_PATHS.PRICE_INQUIRY, targetId);
    case 'SALE_ORDER':
      return replaceRouteId(ROUTE_PATHS.SALE_ORDER_DETAIL, targetId);
    case 'QUOTATION':
      return `${ROUTE_PATHS.QUOTATION_DETAIL}?id=${encodeURIComponent(targetId)}`;
    case 'CUSTOMER':
      return replaceRouteId(ROUTE_PATHS.CUSTOMER_DETAIL, targetId);
    case 'SUPPLIER':
      return replaceRouteId(ROUTE_PATHS.SUPPLIER_DETAIL, targetId);
    default:
      return null;
  }
}
