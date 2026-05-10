import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GoogleCalendarService, GoogleCalendar, CalendarEvent } from '../services/googleCalendar';
import { storage as extensionStorage } from '../lib/storage';

interface CalendarState {
  calendars: GoogleCalendar[];
  eventsByCalendar: Record<string, CalendarEvent[]>;
  visibleCalendarIds: string[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuthenticated: (status: boolean) => void;
  fetchCalendars: (interactive?: boolean) => Promise<void>;
  fetchEvents: (calendarId: string) => Promise<void>;
  setActiveCalendar: (calendarId: string) => void;
  toggleCalendarVisibility: (calendarId: string) => void;
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
      visibleCalendarIds: ['primary'],
      isLoading: false,
      error: null,
      isAuthenticated: false,

      setAuthenticated: (status) => set({ isAuthenticated: status }),

      fetchCalendars: async (interactive = false) => {
        set({ isLoading: true, error: null });
        try {
          const calendars = await GoogleCalendarService.listCalendars(interactive);
          set({ calendars, isAuthenticated: true });
          
          // Initialize visible calendars if empty
          const { visibleCalendarIds } = get();
          if (visibleCalendarIds.length === 0 || (visibleCalendarIds.length === 1 && visibleCalendarIds[0] === 'primary')) {
            const primary = calendars.find(c => c.primary);
            if (primary) set({ visibleCalendarIds: [primary.id] });
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
        // In this multi-view mode, "Active" means it's the target for new events
        // and it's definitely visible.
        const { visibleCalendarIds } = get();
        if (!visibleCalendarIds.includes(calendarId)) {
          set({ visibleCalendarIds: [...visibleCalendarIds, calendarId] });
        }
        
        if (!get().eventsByCalendar[calendarId]) {
          get().fetchEvents(calendarId);
        }
      },

      toggleCalendarVisibility: (calendarId) => {
        const { visibleCalendarIds } = get();
        const isVisible = visibleCalendarIds.includes(calendarId);
        
        if (isVisible) {
          set({ visibleCalendarIds: visibleCalendarIds.filter(id => id !== calendarId) });
        } else {
          set({ visibleCalendarIds: [...visibleCalendarIds, calendarId] });
          if (!get().eventsByCalendar[calendarId]) {
            get().fetchEvents(calendarId);
          }
        }
      },

      addEvent: async (event) => {
        // We use the first visible calendar as the default for new events if none specified
        const targetCalendarId = get().visibleCalendarIds[0] || 'primary';
        set({ isLoading: true, error: null });
        try {
          await GoogleCalendarService.createEvent(targetCalendarId, event);
          await get().fetchEvents(targetCalendarId);
        } catch (err) {
          set({ error: (err as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      updateEvent: async (eventId, updates) => {
        // Find which calendar this event belongs to
        const { eventsByCalendar } = get();
        let targetCalendarId = '';
        for (const [calId, events] of Object.entries(eventsByCalendar)) {
          if (events.find(e => e.id === eventId)) {
            targetCalendarId = calId;
            break;
          }
        }

        if (!targetCalendarId) return;

        const originalEvents = eventsByCalendar[targetCalendarId] || [];

        // Optimistic update
        set((state) => ({
          eventsByCalendar: {
            ...state.eventsByCalendar,
            [targetCalendarId]: originalEvents.map((e) =>
              e.id === eventId ? { ...e, ...updates } : e
            ),
          },
        }));

        try {
          await GoogleCalendarService.updateEvent(targetCalendarId, eventId, updates);
        } catch (err) {
          // Revert on error
          set((state) => ({
            eventsByCalendar: {
              ...state.eventsByCalendar,
              [targetCalendarId]: originalEvents,
            },
            error: (err as Error).message,
          }));
        }
      },

      removeEvent: async (eventId) => {
        const { eventsByCalendar } = get();
        let targetCalendarId = '';
        for (const [calId, events] of Object.entries(eventsByCalendar)) {
          if (events.find(e => e.id === eventId)) {
            targetCalendarId = calId;
            break;
          }
        }

        if (!targetCalendarId) return;

        const originalEvents = eventsByCalendar[targetCalendarId] || [];

        // Optimistic update
        set((state) => ({
          eventsByCalendar: {
            ...state.eventsByCalendar,
            [targetCalendarId]: originalEvents.filter((e) => e.id !== eventId),
          },
        }));

        try {
          await GoogleCalendarService.deleteEvent(targetCalendarId, eventId);
        } catch (err) {
          // Revert on error
          set((state) => ({
            eventsByCalendar: {
              ...state.eventsByCalendar,
              [targetCalendarId]: originalEvents,
            },
            error: (err as Error).message,
          }));
        }
      },

      sync: async (interactive = true) => {
        await get().fetchCalendars(interactive);
        const { calendars } = get();
        // Fetch events for ALL calendars so toggling is instant and all data is ready
        await Promise.all(calendars.map(c => get().fetchEvents(c.id)));
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
            visibleCalendarIds: ['primary'],
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
