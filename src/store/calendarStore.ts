import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GoogleCalendarService, CalendarEvent, GoogleCalendar } from '../services/googleCalendar';
import { storage as extensionStorage } from '../lib/storage';

interface CalendarState {
  calendars: GoogleCalendar[];
  eventsByCalendar: Record<string, CalendarEvent[]>;
  activeCalendarId: string;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuthenticated: (status: boolean) => void;
  fetchCalendars: (interactive?: boolean) => Promise<void>;
  fetchEvents: (calendarId?: string) => Promise<void>;
  setActiveCalendar: (calendarId: string) => void;
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

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      calendars: [],
      eventsByCalendar: {},
      activeCalendarId: 'primary',
      isLoading: false,
      error: null,
      isAuthenticated: false,

      setAuthenticated: (status) => set({ isAuthenticated: status }),

      fetchCalendars: async (interactive = false) => {
        set({ isLoading: true, error: null });
        try {
          const calendars = await GoogleCalendarService.listCalendars(interactive);
          set({ calendars, isAuthenticated: true });
        } catch (err) {
          set({ error: (err as Error).message, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchEvents: async (calendarId = 'primary') => {
        set({ isLoading: true, error: null });
        try {
          const events = await GoogleCalendarService.listEvents(calendarId);
          set((state) => ({
            eventsByCalendar: { ...state.eventsByCalendar, [calendarId]: events },
            isAuthenticated: true,
          }));
        } catch (err) {
          set({ error: (err as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      setActiveCalendar: (calendarId) => {
        set({ activeCalendarId: calendarId });
        if (!get().eventsByCalendar[calendarId]) {
          get().fetchEvents(calendarId);
        }
      },

      sync: async (interactive = true) => {
        await get().fetchCalendars(interactive);
        const { activeCalendarId } = get();
        await get().fetchEvents(activeCalendarId);
      },

      logout: async () => {
        // Since both Task and Calendar use the same chrome.identity token,
        // logging out of one effectively logs out of both.
        // We'll just clear the local state here.
        set({
          calendars: [],
          eventsByCalendar: {},
          activeCalendarId: 'primary',
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'santuario-calendar-storage',
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
