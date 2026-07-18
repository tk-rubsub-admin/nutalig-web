import { Add, CheckCircle, Checklist, RadioButtonUnchecked } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { KeyboardEvent, MouseEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { readableColor } from 'polished';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { createUserTodo, getUserTodos, markUserTodoAsDone } from 'services/UserTodo/user-todo-api';
import {
  CreateUserTodoRequest,
  UserTodo,
  UserTodoPriority
} from 'services/UserTodo/user-todo-type';
import { buildUserTodoTargetPath } from 'utils/userTodoTarget';

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

const normalizeTodoColor = (value?: string | null) => {
  const color = (value || '#dbeafe').trim();
  if (color.startsWith('#')) {
    return color;
  }

  if (/^[0-9a-f]{3,8}$/i.test(color)) {
    return `#${color}`;
  }

  return '#dbeafe';
};

interface UserTodoPanelProps {
  maxItems?: number;
  onViewMore?: () => void;
}

const getDefaultTodoDueDate = () =>
  dayjs().add(1, 'day').hour(12).minute(0).second(0).millisecond(0).toISOString();

export default function UserTodoPanel({ maxItems, onViewMore }: UserTodoPanelProps): JSX.Element {
  const history = useHistory();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [pendingTodoId, setPendingTodoId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserTodoRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: getDefaultTodoDueDate()
  });
  const { data: todoItems = [], isLoading: isTodoLoading } = useQuery<UserTodo[]>(
    ['me-to-dos'],
    () => getUserTodos(),
    {
      refetchOnWindowFocus: false
    }
  );
  const displayTodoItems = useMemo(
    () => todoItems.filter((item) => item.status !== 'DONE'),
    [todoItems]
  );
  const visibleTodoItems = useMemo(
    () => (typeof maxItems === 'number' ? displayTodoItems.slice(0, maxItems) : displayTodoItems),
    [displayTodoItems, maxItems]
  );
  const hasMoreItems =
    typeof maxItems === 'number' && displayTodoItems.length > maxItems && Boolean(onViewMore);
  const markTodoDoneMutation = useMutation((todoId: number) => markUserTodoAsDone(todoId), {
    onMutate: (todoId) => {
      setPendingTodoId(todoId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['me-to-dos']);
      await queryClient.refetchQueries(['me-to-dos'], { active: true });
      setPendingTodoId(null);
    },
    onError: () => {
      setPendingTodoId(null);
    }
  });
  const createTodoMutation = useMutation(
    (payload: CreateUserTodoRequest) => createUserTodo(payload),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['me-to-dos']);
        await queryClient.refetchQueries(['me-to-dos'], { active: true });
        setIsCreateDialogOpen(false);
        setCreateForm({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: getDefaultTodoDueDate()
        });
      }
    }
  );

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

  const handleCreateTodo = () => {
    if (!createForm.title?.trim()) {
      return;
    }

    createTodoMutation.mutate({
      todoType: 'GENERAL',
      title: createForm.title.trim(),
      description: createForm.description?.trim() || null,
      priority: createForm.priority || 'LOW',
      dueDate: createForm.dueDate || null
    });
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <Checklist fontSize="small" />
          <Typography variant="h6" component="h1">
            {t('home.todo.title')}
          </Typography>
        </Stack>
        <Button
          size="small"
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsCreateDialogOpen(true)}>
          {t('home.todo.add')}
        </Button>
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
              {t('home.todo.loading')}
            </Typography>
          ) : null}
          {!isTodoLoading && displayTodoItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('home.todo.empty')}
            </Typography>
          ) : null}
          {visibleTodoItems.map((item) => {
            const backgroundColor = normalizeTodoColor(getTodoColor(item.priority));
            const textColor = readableColor(backgroundColor, '#111827', '#ffffff');
            const targetPath = buildUserTodoTargetPath(item);
            const isMarkingDone = markTodoDoneMutation.isLoading && pendingTodoId === item.id;

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
                  {isMarkingDone ? (
                    <Box
                      sx={{
                        mt: '2px',
                        width: 32,
                        display: 'flex',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                      <CircularProgress size={18} thickness={5} sx={{ color: textColor }} />
                    </Box>
                  ) : (
                    <Checkbox
                      size="small"
                      checked={false}
                      disabled={markTodoDoneMutation.isLoading}
                      onClick={(event) => {
                        handleMarkTodoDone(event, item.id);
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
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      sx={{
                        opacity: isMarkingDone ? 0.75 : 1
                      }}>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="inherit"
                      sx={{ opacity: 0.8 }}
                      display="block">
                      {getTodoNote(item)}
                    </Typography>
                    {getTodoDueText(item) ? (
                      <Typography
                        variant="caption"
                        color="inherit"
                        sx={{ opacity: 0.72 }}
                        display="block">
                        {getTodoDueText(item)}
                      </Typography>
                    ) : null}
                  </Box>
                </Stack>
              </Box>
            );
          })}
          {hasMoreItems ? (
            <Box sx={{ pt: 0.5 }}>
              <Button fullWidth variant="contained" onClick={onViewMore}>
                {t('home.todo.viewMore')}
              </Button>
            </Box>
          ) : null}
        </Stack>
      </Box>
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => {
          if (!createTodoMutation.isLoading) {
            setIsCreateDialogOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm">
        <DialogTitle>{t('home.todo.createTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('home.todo.fields.title')}
              value={createForm.title || ''}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  title: event.target.value
                }))
              }
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('home.todo.fields.description')}
              value={createForm.description || ''}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  description: event.target.value
                }))
              }
              multiline
              minRows={3}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('home.todo.fields.priority')}
              select
              value={createForm.priority || 'MEDIUM'}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  priority: event.target.value as UserTodoPriority
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}>
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as UserTodoPriority[]).map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {t(`home.todo.priority.${priority.toLowerCase()}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('home.todo.fields.dueDate')}
              type="datetime-local"
              value={createForm.dueDate ? dayjs(createForm.dueDate).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  dueDate: event.target.value ? dayjs(event.target.value).toISOString() : null
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            className="btn-crimson-red"
            variant="contained"
            onClick={() => setIsCreateDialogOpen(false)}
            disabled={createTodoMutation.isLoading}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTodo}
            disabled={createTodoMutation.isLoading || !createForm.title?.trim()}
            startIcon={
              createTodoMutation.isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Add />
              )
            }>
            เพิ่มใหม่
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
