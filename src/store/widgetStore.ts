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
  mode: 'dark' | 'light';
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
  spotifyRefreshToken: string | null;
  spotifyClientId: string;
  spotifyTrack: {
    name: string;
    artist: string;
    albumArt: string;
    isPlaying: boolean;
    progress_ms: number;
    duration_ms: number;
    uri?: string;
  } | null;
  habits: Array<{ id: string; name: string; completedDates: string[] }>;
  countdowns: Array<{ id: string; name: string; targetDate: string }>;
  customCSS: string;
  customBackground: string | null;
  recentBackgrounds: string[];
  weatherConnected: boolean;
  setWeatherConnected: (connected: boolean) => void;
  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
  setTheme: (theme: 'glass' | 'zen') => void;
  setMode: (mode: 'dark' | 'light') => void;
  setUserName: (name: string) => void;
  toggleBlur: () => void;
  setSpotifyToken: (token: string | null) => void;
  setSpotifyRefreshToken: (token: string | null) => void;
  setSpotifyClientId: (id: string) => void;
  updateSpotifyTrack: (track: WidgetState['spotifyTrack']) => void;
  updateSearchEngine: (engine: string) => void;
  
  // Habits
  addHabit: (name: string) => void;
  removeHabit: (id: string) => void;
  toggleHabit: (id: string, date: string) => void;
  
  // Countdowns
  addCountdown: (name: string, targetDate: string) => void;
  removeCountdown: (id: string) => void;
  setCustomCSS: (css: string) => void;

  addQuickLink: (link: Omit<QuickLink, 'id'>) => void;
  removeQuickLink: (id: string) => void;
  updateWeatherSettings: (settings: { apiKey?: string; city?: string }) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateNotes: (text: string) => void;
  setCustomBackground: (background: string | null) => void;
  removeRecentBackground: (background: string) => void;
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
      activeWidgets: ['clock', 'greeting', 'weather', 'todo', 'sticky-notes'],
      theme: 'glass',
      mode: 'dark',
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
      spotifyRefreshToken: null,
      spotifyClientId: '',
      spotifyTrack: null,
      habits: [],
      countdowns: [],
      customCSS: '',
      customBackground: null,
      recentBackgrounds: [],
      weatherConnected: false,

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

      setMode: (mode) => set({ mode }),

      setUserName: (name) => set({ userName: name }),

      toggleBlur: () => set((state) => ({ isBlurred: !state.isBlurred })),

      setSpotifyToken: (token) => set({ spotifyToken: token }),

      setSpotifyRefreshToken: (token) => set({ spotifyRefreshToken: token }),

      setSpotifyClientId: (id) => set({ spotifyClientId: id }),

      updateSpotifyTrack: (track) => set({ spotifyTrack: track }),

      // Habits
      addHabit: (name) => set((state) => ({
        habits: [...state.habits, { id: crypto.randomUUID(), name, completedDates: [] }]
      })),
      removeHabit: (id) => set((state) => ({
        habits: state.habits.filter(h => h.id !== id)
      })),
      toggleHabit: (id, date) => set((state) => ({
        habits: state.habits.map(h => {
          if (h.id !== id) return h;
          const exists = h.completedDates.includes(date);
          return {
            ...h,
            completedDates: exists 
              ? h.completedDates.filter(d => d !== date)
              : [...h.completedDates, date]
          };
        })
      })),

      // Countdowns
      addCountdown: (name, targetDate) => set((state) => ({
        countdowns: [...state.countdowns, { id: crypto.randomUUID(), name, targetDate }]
      })),
      removeCountdown: (id) => set((state) => ({
        countdowns: state.countdowns.filter(c => c.id !== id)
      })),

      setCustomCSS: (css) => set({ customCSS: css }),
      setCustomBackground: (background) => 
        set((state) => {
          if (!background) return { customBackground: null };
          
          // Add to recent if not already there, or move to front if it is
          const filtered = state.recentBackgrounds.filter(bg => bg !== background);
          const updatedRecent = [background, ...filtered].slice(0, 10);
          
          return { 
            customBackground: background,
            recentBackgrounds: updatedRecent
          };
        }),
      
      removeRecentBackground: (background) =>
        set((state) => ({
          recentBackgrounds: state.recentBackgrounds.filter(bg => bg !== background)
        })),

      setWeatherConnected: (connected) => set({ weatherConnected: connected }),

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