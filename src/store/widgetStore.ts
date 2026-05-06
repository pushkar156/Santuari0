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
  theme: 'glass' | 'zen';
  positions: Record<string, { x: number; y: number }>;
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
  userName: string;
  isBlurred: boolean;
  spotifyToken: string | null;
  spotifyClientId: string;
  spotifyTrack: {
    name: string;
    artist: string;
    albumArt: string;
    isPlaying: boolean;
    progress_ms: number;
    duration_ms: number;
  } | null;
  customCSS: string;
  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
  setTheme: (theme: 'glass' | 'zen') => void;
  updatePosition: (id: string, x: number, y: number) => void;
  resetLayout: () => void;
  setUserName: (name: string) => void;
  toggleBlur: () => void;
  setSpotifyToken: (token: string | null) => void;
  setSpotifyClientId: (id: string) => void;
  updateSpotifyTrack: (track: WidgetState['spotifyTrack']) => void;
  updateSearchEngine: (engine: string) => void;
  addQuickLink: (link: Omit<QuickLink, 'id'>) => void;
  removeQuickLink: (id: string) => void;
  updateWeatherSettings: (settings: { apiKey?: string; city?: string }) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateNotes: (text: string) => void;
  setCustomCSS: (css: string) => void;
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

export const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  'weather': { x: 40, y: 40 },
  'sticky-notes': { x: 40, y: 450 },
  'todo': { x: 1000, y: 40 },
};

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      activeWidgets: ['clock', 'greeting', 'weather', 'todo', 'sticky-notes'],
      theme: 'glass',
      positions: DEFAULT_POSITIONS,
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
      userName: 'User',
      isBlurred: false,
      spotifyToken: null,
      spotifyClientId: '',
      spotifyTrack: null,
      customCSS: '',
      
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

      setTheme: (theme) => set({ theme }),

      updatePosition: (id, x, y) =>
        set((state) => ({
          positions: {
            ...state.positions,
            [id]: { x, y },
          },
        })),

      resetLayout: () =>
        set({ positions: DEFAULT_POSITIONS }),

      setUserName: (name) => set({ userName: name }),

      toggleBlur: () => set((state) => ({ isBlurred: !state.isBlurred })),

      setSpotifyToken: (token) => set({ spotifyToken: token }),

      setSpotifyClientId: (id) => set({ spotifyClientId: id }),

      updateSpotifyTrack: (track) => set({ spotifyTrack: track }),
      
      setCustomCSS: (css) => set({ customCSS: css }),
        
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
