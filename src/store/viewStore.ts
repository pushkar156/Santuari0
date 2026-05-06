import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType = 'home' | 'tasks' | 'calendar' | 'bookmarks' | 'drive' | 'settings';

interface ViewState {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      activeView: 'home',
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'santuario-view-storage',
    }
  )
);
