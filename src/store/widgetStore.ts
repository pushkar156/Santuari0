import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { storage as extensionStorage } from '../lib/storage';

export interface QuickLink {
  id: string;
  title: string;
  url: string;
}

interface WidgetState {
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
  customCSS: string;
  customBackground: string | null;
  recentBackgrounds: string[];
  weatherConnected: boolean;
  setWeatherConnected: (connected: boolean) => void;
  setTheme: (theme: 'glass' | 'zen') => void;
  setMode: (mode: 'dark' | 'light') => void;
  toggleBlur: () => void;
  setSpotifyToken: (token: string | null) => void;
  setSpotifyRefreshToken: (token: string | null) => void;
  setSpotifyClientId: (id: string) => void;
  updateSpotifyTrack: (track: WidgetState['spotifyTrack']) => void;
  updateSearchEngine: (engine: string) => void;
  setCustomCSS: (css: string) => void;
  addQuickLink: (link: Omit<QuickLink, 'id'>) => void;
  removeQuickLink: (id: string) => void;
  updateWeatherSettings: (settings: { apiKey?: string; city?: string }) => void;
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
      isBlurred: false,
      spotifyToken: null,
      spotifyRefreshToken: null,
      spotifyClientId: '',
      spotifyTrack: null,
      customCSS: '',
      customBackground: null,
      recentBackgrounds: [],
      weatherConnected: false,

      setTheme: (theme) => set({ theme }),

      setMode: (mode) => set({ mode }),

      toggleBlur: () => set((state) => ({ isBlurred: !state.isBlurred })),

      setSpotifyToken: (token) => set({ spotifyToken: token }),

      setSpotifyRefreshToken: (token) => set({ spotifyRefreshToken: token }),

      setSpotifyClientId: (id) => set({ spotifyClientId: id }),

      updateSpotifyTrack: (track) => set({ spotifyTrack: track }),

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
    }),
    {
      name: 'santuario-widget-storage',
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);