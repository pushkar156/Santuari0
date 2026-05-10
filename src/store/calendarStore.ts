import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GoogleCalendarService, GoogleCalendar, CalendarEvent } from '../services/googleCalendar';
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
  fetchEvents: (calendarId: string) => Promise<void>;
  setActiveCalendar: (calendarId: string) => void;
  addEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
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
          if (calendars.length > 0 && get().activeCalendarId === 'primary') {
            const primary = calendars.find(c => c.primary);
            if (primary) set({ activeCalendarId: primary.id });
          }
        } catch (err) {
          set({ error: (err as Error).message, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchEvents: async (calendarId) => {
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

      addEvent: async (event) => {
        const { activeCalendarId } = get();
        set({ isLoading: true, error: null });
        try {
          await GoogleCalendarService.createEvent(activeCalendarId, event);
          await get().fetchEvents(activeCalendarId);
        } catch (err) {
          set({ error: (err as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      updateEvent: async (eventId, updates) => {
        const { activeCalendarId, eventsByCalendar } = get();
        const originalEvents = eventsByCalendar[activeCalendarId] || [];

        // Optimistic update
        set((state) => ({
          eventsByCalendar: {
            ...state.eventsByCalendar,
            [activeCalendarId]: originalEvents.map((e) =>
              e.id === eventId ? { ...e, ...updates } : e
            ),
          },
        }));

        try {
          await GoogleCalendarService.updateEvent(activeCalendarId, eventId, updates);
        } catch (err) {
          // Revert on error
          set((state) => ({
            eventsByCalendar: {
              ...state.eventsByCalendar,
              [activeCalendarId]: originalEvents,
            },
            error: (err as Error).message,
          }));
        }
      },

      removeEvent: async (eventId) => {
        const { activeCalendarId, eventsByCalendar } = get();
        const originalEvents = eventsByCalendar[activeCalendarId] || [];

        // Optimistic update
        set((state) => ({
          eventsByCalendar: {
            ...state.eventsByCalendar,
            [activeCalendarId]: originalEvents.filter((e) => e.id !== eventId),
          },
        }));

        try {
          await GoogleCalendarService.deleteEvent(activeCalendarId, eventId);
        } catch (err) {
          // Revert on error
          set((state) => ({
            eventsByCalendar: {
              ...state.eventsByCalendar,
              [activeCalendarId]: originalEvents,
            },
            error: (err as Error).message,
          }));
        }
      },

      sync: async (interactive = true) => {
        await get().fetchCalendars(interactive);
        const { activeCalendarId } = get();
        await get().fetchEvents(activeCalendarId);
      },

      logout: async () => {
        try {
          await GoogleCalendarService.signOut();
        } catch (err) {
          console.error('Sign out error:', err);
        } finally {
          set({
            calendars: [],
            eventsByCalendar: {},
            activeCalendarId: 'primary',
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'santuario-calendar-storage',
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
