import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { storage as extensionStorage } from '../lib/storage';

export interface QuickLink {
  id: string;
  title: string;
  url: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface WidgetState {
  activeWidgets: string[];
  settings: {
    search: {
      defaultEngine: string;
    };
    weather: {
      apiKey: string;
      city: string;
    };
  };
  quickLinks: QuickLink[];
  todos: Todo[];
  notes: string;
  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
  updateSearchEngine: (engine: string) => void;
  addQuickLink: (link: Omit<QuickLink, 'id'>) => void;
  removeQuickLink: (id: string) => void;
  updateWeatherSettings: (settings: { apiKey?: string; city?: string }) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateNotes: (text: string) => void;
}

// Create an adapter for Zustand's persist middleware to use our custom storage wrapper
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

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      // By default, let's have Clock and Greeting active
      activeWidgets: ['clock', 'greeting'],
      settings: {
        search: {
          defaultEngine: 'google',
        },
        weather: {
          apiKey: '',
          city: 'London',
        },
      },
      quickLinks: [],
      todos: [],
      notes: '',
      
      addWidget: (widgetId) =>
        set((state) => ({
          activeWidgets: state.activeWidgets.includes(widgetId)
            ? state.activeWidgets
            : [...state.activeWidgets, widgetId],
        })),
        
      removeWidget: (widgetId) =>
        set((state) => ({
          activeWidgets: state.activeWidgets.filter((id) => id !== widgetId),
        })),
        
      updateSearchEngine: (engine) =>
        set((state) => ({
          settings: {
            ...state.settings,
            search: {
              ...state.settings.search,
              defaultEngine: engine,
            },
          },
        })),
        
      addQuickLink: (link) =>
        set((state) => ({
          quickLinks: [...state.quickLinks, { ...link, id: crypto.randomUUID() }],
        })),
        
      removeQuickLink: (id) =>
        set((state) => ({
          quickLinks: state.quickLinks.filter((link) => link.id !== id),
        })),
        
      updateWeatherSettings: (settings: { apiKey?: string; city?: string }) =>
        set((state) => ({
          settings: {
            ...state.settings,
            weather: {
              ...state.settings.weather,
              ...settings,
            },
          },
        })),
        
      addTodo: (text) =>
        set((state) => ({
          todos: [
            ...state.todos,
            { id: crypto.randomUUID(), text, completed: false },
          ],
        })),
        
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),
        
      removeTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
        
      updateNotes: (text) =>
        set({ notes: text }),
    }),
    {
      name: 'santuario-widget-storage',
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
