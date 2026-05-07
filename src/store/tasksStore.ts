import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GoogleTasksService, GoogleTask, GoogleTaskList } from '../services/googleTasks';
import { storage as extensionStorage } from '../lib/storage';

interface TasksState {
  lists: GoogleTaskList[];
  tasksByList: Record<string, GoogleTask[]>;
  activeListId: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuthenticated: (status: boolean) => void;
  fetchLists: (interactive?: boolean) => Promise<void>;
  fetchTasks: (listId: string) => Promise<void>;
  setActiveList: (listId: string) => void;
  addTask: (title: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  sync: (interactive?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const storageAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await extensionStorage.get<string | null>(name, null);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await extensionStorage.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await extensionStorage.remove(name);
  },
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

      setAuthenticated: (status) => set({ isAuthenticated: status }),

      fetchLists: async (interactive = false) => {
        set({ isLoading: true, error: null });
        try {
          const lists = await GoogleTasksService.listTaskLists(interactive);
          set({ lists, isAuthenticated: true });
          if (lists.length > 0 && !get().activeListId) {
            set({ activeListId: lists[0].id });
          }
        } catch (err) {
          set({ error: (err as Error).message, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchTasks: async (listId) => {
        set({ isLoading: true, error: null });
        try {
          const tasks = await GoogleTasksService.listTasks(listId);
          set((state) => ({
            tasksByList: { ...state.tasksByList, [listId]: tasks },
            isAuthenticated: true,
          }));
        } catch (err) {
          set({ error: (err as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      setActiveList: (listId) => {
        set({ activeListId: listId });
        if (!get().tasksByList[listId]) {
          get().fetchTasks(listId);
        }
      },

      addTask: async (title) => {
        const { activeListId } = get();
        if (!activeListId) return;

        try {
          const newTask = await GoogleTasksService.createTask(activeListId, title);
          set((state) => ({
            tasksByList: {
              ...state.tasksByList,
              [activeListId]: [newTask, ...(state.tasksByList[activeListId] || [])],
            },
          }));
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      toggleTask: async (taskId) => {
        const { activeListId, tasksByList } = get();
        if (!activeListId) return;

        const tasks = tasksByList[activeListId] || [];
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';

        // Optimistic update
        set((state) => ({
          tasksByList: {
            ...state.tasksByList,
            [activeListId]: state.tasksByList[activeListId].map((t) =>
              t.id === taskId ? { ...t, status: newStatus } : t
            ),
          },
        }));

        try {
          await GoogleTasksService.updateTask(activeListId, taskId, { status: newStatus });
        } catch (err) {
          // Revert on error
          set((state) => ({
            tasksByList: {
              ...state.tasksByList,
              [activeListId]: state.tasksByList[activeListId].map((t) =>
                t.id === taskId ? { ...t, status: task.status } : t
              ),
            },
            error: (err as Error).message,
          }));
        }
      },

      removeTask: async (taskId) => {
        const { activeListId } = get();
        if (!activeListId) return;

        const originalTasks = get().tasksByList[activeListId];

        // Optimistic update
        set((state) => ({
          tasksByList: {
            ...state.tasksByList,
            [activeListId]: state.tasksByList[activeListId].filter((t) => t.id !== taskId),
          },
        }));

        try {
          await GoogleTasksService.deleteTask(activeListId, taskId);
        } catch (err) {
          // Revert on error
          set((state) => ({
            tasksByList: {
              ...state.tasksByList,
              [activeListId]: originalTasks,
            },
            error: (err as Error).message,
          }));
        }
      },

      sync: async (interactive = true) => {
        await get().fetchLists(interactive);
        const { activeListId } = get();
        if (activeListId) {
          await get().fetchTasks(activeListId);
        }
      },

      logout: async () => {
        try {
          await GoogleTasksService.signOut();
        } catch (err) {
          console.error('Sign out error:', err);
        } finally {
          set({
            lists: [],
            tasksByList: {},
            activeListId: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'santuario-tasks-storage',
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
