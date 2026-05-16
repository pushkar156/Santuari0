import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GoogleTasksService, GoogleTask, GoogleTaskList } from '../services/googleTasks';
import { storage as extensionStorage } from '../lib/storage';

const updateTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/** Find which list a task belongs to by searching all lists */
const findTaskListId = (
  taskId: string,
  tasksByList: Record<string, GoogleTask[]>
): string | null => {
  for (const [listId, tasks] of Object.entries(tasksByList)) {
    if (tasks.some(t => t.id === taskId)) return listId;
  }
  return null;
};

interface TasksState {
  lists: GoogleTaskList[];
  tasksByList: Record<string, GoogleTask[]>;
  activeListId: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  // Persisted UI preferences
  starredTaskIds: string[];
  visibleListIds: string[];
  showTodayColumn: boolean;
  showStarredColumn: boolean;
  listOrder: string[]; // Manual order of list IDs
  focusedTaskId: string | null;

  // Actions
  setAuthenticated: (status: boolean) => void;
  fetchLists: (interactive?: boolean) => Promise<void>;
  fetchTasks: (listId: string) => Promise<void>;
  setActiveList: (listId: string) => void;
  createList: (title: string) => Promise<void>;
  updateList: (listId: string, title: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  addTask: (title: string, listId?: string, parent?: string, previous?: string, initialData?: Partial<GoogleTask>) => Promise<GoogleTask | undefined>;
  toggleTask: (taskId: string) => Promise<void>;
  updateTaskDetail: (taskId: string, updates: Partial<GoogleTask>) => Promise<void>;
  moveTask: (taskId: string, parent?: string, previous?: string) => Promise<void>;
  moveTaskToList: (taskId: string, toListId: string) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  clearCompleted: (listId: string) => Promise<void>;
  toggleStarred: (taskId: string) => void;
  setVisibleListIds: (ids: string[]) => void;
  toggleListVisibility: (listId: string) => void;
  setShowTodayColumn: (show: boolean) => void;
  setShowStarredColumn: (show: boolean) => void;
  setListOrder: (ids: string[]) => void;
  setFocusedTaskId: (id: string | null) => void;
  sync: (interactive?: boolean) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<GoogleTask>) => Promise<void>;
  logout: () => Promise<void>;
}

const storageAdapter: StateStorage = {
  getItem: async (name) => {
    const value = await extensionStorage.get<string | null>(name, null);
    return value ?? null;
  },
  setItem: async (name, value) => { await extensionStorage.set(name, value); },
  removeItem: async (name) => { await extensionStorage.remove(name); },
};

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      lists: [],
      tasksByList: {},
      activeListId: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      starredTaskIds: [],
      visibleListIds: [],
      showTodayColumn: true,
      showStarredColumn: false,
      listOrder: [],
      focusedTaskId: null,

      setAuthenticated: (status) => set({ isAuthenticated: status }),

      fetchLists: async (interactive = false) => {
        set({ isLoading: true, error: null });
        try {
          const lists = await GoogleTasksService.listTaskLists(interactive);
          set(state => {
            const validListIds = lists.map(l => l.id);
            const newIds = validListIds.filter(id => !state.listOrder.includes(id));
            const newListOrder = state.listOrder.length > 0 
                ? [...state.listOrder.filter(id => validListIds.includes(id)), ...newIds]
                : validListIds;

            return {
              lists,
              isAuthenticated: true,
              visibleListIds: Array.from(new Set([...state.visibleListIds, ...newIds])).filter(id => validListIds.includes(id)),
              listOrder: newListOrder,
              activeListId: state.activeListId && validListIds.includes(state.activeListId) 
                ? state.activeListId 
                : (validListIds.length > 0 ? validListIds[0] : null),
            };
          });
        } catch (err) {
          set({ error: (err as Error).message, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchTasks: async (listId) => {
        // Only set isLoading if it's the active list to avoid UI flicker
        if (get().activeListId === listId) {
          set({ isLoading: true, error: null });
        }
        
        try {
          const tasks = await GoogleTasksService.listTasks(listId);
          const { starredTaskIds } = get();
          // Re-merge local starred state — Google API doesn't store this field
          // AND sort by position (Google Tasks uses lexicographical order of the position string)
          const merged = tasks
            .map(t => ({ ...t, starred: starredTaskIds.includes(t.id) }))
            .sort((a, b) => a.position.localeCompare(b.position));

          set(state => ({
            tasksByList: { ...state.tasksByList, [listId]: merged },
            isAuthenticated: true,
          }));
        } catch (err) {
          set({ error: (err as Error).message });
        } finally {
          if (get().activeListId === listId) {
            set({ isLoading: false });
          }
        }
      },

      setActiveList: (listId) => {
        set({ activeListId: listId });
        if (!get().tasksByList[listId]) get().fetchTasks(listId);
      },

      createList: async (title) => {
        try {
          await GoogleTasksService.createTaskList(title);
          await get().fetchLists();
        } catch (err) { set({ error: (err as Error).message }); }
      },

      updateList: async (listId, title) => {
        try {
          await GoogleTasksService.updateTaskList(listId, title);
          await get().fetchLists();
        } catch (err) { set({ error: (err as Error).message }); }
      },

      deleteList: async (listId) => {
        try {
          await GoogleTasksService.deleteTaskList(listId);
          set(state => ({
            activeListId: state.activeListId === listId ? null : state.activeListId,
            visibleListIds: state.visibleListIds.filter(id => id !== listId),
          }));
          await get().fetchLists();
        } catch (err) { set({ error: (err as Error).message }); }
      },

      addTask: async (title, listId, parent, previous, initialData) => {
        // Fallback chain for list selection
        const targetListId = listId || 
                           get().activeListId || 
                           (get().lists.length > 0 ? get().lists[0].id : null);
        
        if (!targetListId) {
          console.error('[addTask]: No valid listId found', { listId, activeListId: get().activeListId, lists: get().lists });
          set({ error: 'Please select or create a task list first' });
          return;
        }

        const { starred, ...apiData } = initialData || {};
        
        // Create a temporary ID for optimistic update
        const tempId = `temp-${Date.now()}`;
        
        // Format due date if present (must be RFC 3339)
        let formattedDue = apiData.due;
        if (formattedDue && !formattedDue.includes('T')) {
          formattedDue = new Date(formattedDue).toISOString();
        }

        const tempTask: GoogleTask = {
          id: tempId,
          title,
          status: 'needsAction',
          updated: new Date().toISOString(),
          position: '99999999999999999999', // Put it at the end
          starred: !!starred,
          ...apiData,
          due: formattedDue
        } as GoogleTask;

        // Optimistic update
        set(state => {
          const currentTasks = state.tasksByList[targetListId] || [];
          let updatedTasks;
          
          if (previous) {
            const prevIndex = currentTasks.findIndex(t => t.id === previous);
            if (prevIndex !== -1) {
              updatedTasks = [...currentTasks];
              updatedTasks.splice(prevIndex + 1, 0, tempTask);
            } else {
              updatedTasks = [...currentTasks, tempTask];
            }
          } else {
            // Google default: Insert at the top
            updatedTasks = [tempTask, ...currentTasks];
          }

          return {
            tasksByList: {
              ...state.tasksByList,
              [targetListId]: updatedTasks
            },
            starredTaskIds: starred ? [...state.starredTaskIds, tempId] : state.starredTaskIds,
            focusedTaskId: tempId
          };
        });

        try {
          // If parent or previous are temporary IDs, we strip them to avoid API errors
          const safeParent = parent?.startsWith('temp-') ? undefined : parent;
          const safePrevious = previous?.startsWith('temp-') ? undefined : previous;

          // Sanitize task data for Google API
          const taskToCreate = {
            title,
            notes: apiData.notes,
            due: formattedDue,
            status: apiData.status || 'needsAction',
          };

          const newTask = await GoogleTasksService.createTask(targetListId, taskToCreate, safeParent, safePrevious);
          
          set(state => {
            const currentTasks = state.tasksByList[targetListId] || [];
            const tempTask = currentTasks.find(t => t.id === tempId);
            const alreadyInList = currentTasks.some(t => t.id === newTask.id);

            if (alreadyInList) {
              return {
                tasksByList: {
                  ...state.tasksByList,
                  [targetListId]: currentTasks.filter(t => t.id !== tempId)
                },
                starredTaskIds: state.starredTaskIds.filter(id => id !== tempId),
                focusedTaskId: state.focusedTaskId === tempId ? newTask.id : state.focusedTaskId
              };
            }

            return {
              tasksByList: {
                ...state.tasksByList,
                [targetListId]: tempTask
                  ? currentTasks.map(t => t.id === tempId ? { ...tempTask, ...newTask, starred: !!starred } : t)
                  : [...currentTasks, { ...newTask, starred: !!starred }]
              },
              starredTaskIds: starred 
                ? state.starredTaskIds.map(id => id === tempId ? newTask.id : id) 
                : state.starredTaskIds,
              focusedTaskId: state.focusedTaskId === tempId ? newTask.id : state.focusedTaskId
            };
          });

          // Still fetch eventually to ensure everything is in sync with Google's order/state
          // but do it after a delay to allow UI to settle
          setTimeout(() => get().fetchTasks(targetListId), 1000);
          
          return newTask;
        } catch (err) {
          console.error('[addTask Error]:', err);
          // Revert optimistic update
          set(state => ({
            tasksByList: {
              ...state.tasksByList,
              [targetListId]: (state.tasksByList[targetListId] || []).filter(t => t.id !== tempId)
            },
            starredTaskIds: state.starredTaskIds.filter(id => id !== tempId),
            error: (err as Error).message
          }));
          return undefined;
        }
      },

      updateTask: async (taskId, updates) => {
        const { tasksByList } = get();
        const listId = findTaskListId(taskId, tasksByList);
        if (!listId) return;

        const tasks = tasksByList[listId] || [];
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Optimistic update
        set((state) => ({
          tasksByList: {
            ...state.tasksByList,
            [listId]: state.tasksByList[listId].map((t) =>
              t.id === taskId ? { ...t, ...updates } : t
            ),
          },
        }));

        try {
          if (!taskId.startsWith('temp-')) {
            await GoogleTasksService.updateTask(listId, taskId, updates);
          }
        } catch (err) {
          // Revert on error
          set((state) => ({
            tasksByList: {
              ...state.tasksByList,
              [listId]: state.tasksByList[listId].map((t) =>
                t.id === taskId ? task : t
              ),
            },
            error: (err as Error).message,
          }));
        }
      },

      toggleTask: async (taskId) => {
        const { tasksByList } = get();
        const listId = findTaskListId(taskId, tasksByList);
        if (!listId) return;

        const task = tasksByList[listId].find(t => t.id === taskId);
        if (!task) return;

        const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
        set(state => ({
          tasksByList: {
            ...state.tasksByList,
            [listId]: state.tasksByList[listId].map(t =>
              t.id === taskId ? { ...t, status: newStatus } : t
            ),
          },
        }));
        try {
          if (!taskId.startsWith('temp-')) {
            await GoogleTasksService.updateTask(listId, taskId, { status: newStatus });
          }
        } catch (err) {
          set(state => ({
            tasksByList: {
              ...state.tasksByList,
              [listId]: state.tasksByList[listId].map(t =>
                t.id === taskId ? { ...t, status: task.status } : t
              ),
            },
            error: (err as Error).message,
          }));
        }
      },

      // FIXED: looks up actual listId; strips local-only `starred` before API call
      updateTaskDetail: async (taskId, updates) => {
        const { tasksByList } = get();
        const listId = findTaskListId(taskId, tasksByList);
        if (!listId) return;

        const originalTasks = tasksByList[listId] || [];
        set(state => {
          const newState: any = {
            tasksByList: {
              ...state.tasksByList,
              [listId]: (state.tasksByList[listId] || []).map(t =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            }
          };
          if (updates.hasOwnProperty('starred')) {
            newState.starredTaskIds = updates.starred
              ? [...new Set([...state.starredTaskIds, taskId])]
              : state.starredTaskIds.filter(id => id !== taskId);
          }
          return newState;
        });

        if (taskId.startsWith('temp-')) return; // Can't sync updates for temp tasks yet

        if (updateTimers[taskId]) clearTimeout(updateTimers[taskId]);
        updateTimers[taskId] = setTimeout(async () => {
          try {
            // Strip local-only fields before sending to API
            const { starred, ...apiUpdates } = updates as any;
            if (Object.keys(apiUpdates).length > 0) {
              await GoogleTasksService.updateTask(listId, taskId, apiUpdates);
            }
            delete updateTimers[taskId];
          } catch (err) {
            set(state => ({
              tasksByList: { ...state.tasksByList, [listId]: originalTasks },
              error: (err as Error).message,
            }));
            delete updateTimers[taskId];
          }
        }, 1000);
      },

      // FIXED: looks up actual listId
      moveTask: async (taskId, parent, previous) => {
        const { tasksByList } = get();
        const listId = findTaskListId(taskId, tasksByList);
        const originalTasksByList = tasksByList;
        if (!listId) return;
        try {
          if (!taskId.startsWith('temp-')) {
            await GoogleTasksService.moveTask(listId, taskId, parent, previous);
          }
          await get().fetchTasks(listId);
        } catch (err) { 
          set({ error: (err as Error).message, tasksByList: originalTasksByList }); 
        }
      },

      // NEW: Move a task to a different list
      moveTaskToList: async (taskId, toListId) => {
        const { tasksByList } = get();
        const fromListId = findTaskListId(taskId, tasksByList);
        if (!fromListId || fromListId === toListId) return;

        const task = (tasksByList[fromListId] || []).find(t => t.id === taskId);
        if (!task) return;

        // Optimistic remove from source
        set(state => ({
          tasksByList: {
            ...state.tasksByList,
            [fromListId]: state.tasksByList[fromListId].filter(t => t.id !== taskId),
          },
        }));

        try {
          await GoogleTasksService.createTask(toListId, {
            title: task.title,
            notes: task.notes,
            due: task.due,
            status: task.status,
          });
          await GoogleTasksService.deleteTask(fromListId, taskId);
          await get().fetchTasks(fromListId);
          await get().fetchTasks(toListId);
        } catch (err) {
          await get().fetchTasks(fromListId);
          set({ error: (err as Error).message });
        }
      },

      // FIXED: looks up actual listId; also cleans up starred
      removeTask: async (taskId) => {
        const { tasksByList } = get();
        const listId = findTaskListId(taskId, tasksByList);
        if (!listId) return;

        const originalTasks = tasksByList[listId];
        set(state => ({
          tasksByList: {
            ...state.tasksByList,
            [listId]: state.tasksByList[listId].filter(t => t.id !== taskId),
          },
          starredTaskIds: state.starredTaskIds.filter(id => id !== taskId),
        }));
        try {
          await GoogleTasksService.deleteTask(listId, taskId);
        } catch (err) {
          set(state => ({
            tasksByList: { ...state.tasksByList, [listId]: originalTasks },
            error: (err as Error).message,
          }));
        }
      },

      // NEW: Delete all completed tasks in a list
      clearCompleted: async (listId) => {
        const { tasksByList } = get();
        const done = (tasksByList[listId] || []).filter(t => t.status === 'completed');
        if (done.length === 0) return;

        set(state => ({
          tasksByList: {
            ...state.tasksByList,
            [listId]: state.tasksByList[listId].filter(t => t.status !== 'completed'),
          },
          starredTaskIds: state.starredTaskIds.filter(id => !done.some(t => t.id === id)),
        }));
        try {
          await Promise.all(done.map(t => GoogleTasksService.deleteTask(listId, t.id)));
        } catch (err) {
          await get().fetchTasks(listId);
          set({ error: (err as Error).message });
        }
      },

      // NEW: Toggle star (local-only, persisted in starredTaskIds)
      toggleStarred: (taskId) => {
        set(state => {
          const isStarred = state.starredTaskIds.includes(taskId);
          const starredTaskIds = isStarred
            ? state.starredTaskIds.filter(id => id !== taskId)
            : [...state.starredTaskIds, taskId];
          // Mirror into tasksByList for immediate UI update
          const tasksByList = { ...state.tasksByList };
          for (const listId of Object.keys(tasksByList)) {
            if (tasksByList[listId].some(t => t.id === taskId)) {
              tasksByList[listId] = tasksByList[listId].map(t =>
                t.id === taskId ? { ...t, starred: !isStarred } : t
              );
            }
          }
          return { starredTaskIds, tasksByList };
        });
      },

      setVisibleListIds: (ids) => set({ visibleListIds: ids }),

      toggleListVisibility: (listId) => set(state => ({
        visibleListIds: state.visibleListIds.includes(listId)
          ? state.visibleListIds.filter(id => id !== listId)
          : [...state.visibleListIds, listId],
      })),

      setShowTodayColumn: (show) => set({ showTodayColumn: show }),
      setShowStarredColumn: (show) => set({ showStarredColumn: show }),
      setListOrder: (ids) => set({ listOrder: ids }),
      setFocusedTaskId: (id) => set({ focusedTaskId: id }),

      sync: async (interactive = true) => {
        await get().fetchLists(interactive);
        const { lists } = get();
        await Promise.all(lists.map(l => get().fetchTasks(l.id)));
      },

      logout: async () => {
        try { await GoogleTasksService.signOut(); } catch { /* ignore */ }
        set({
          lists: [],
          tasksByList: {},
          activeListId: null,
          isAuthenticated: false,
          visibleListIds: [],
          starredTaskIds: [],
        });
      },
    }),
    {
      name: 'santuario-tasks-storage',
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
