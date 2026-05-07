import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType = 'home' | 'tasks' | 'calendar' | 'bookmarks' | 'drive' | 'settings' | 'ovi' | 'background';

interface ViewState {
  activeView: ViewType;
  lastMainView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      activeView: 'home',
      lastMainView: 'home',
      setActiveView: (view) => set(() => {
        const nextState: Partial<ViewState> = { activeView: view };
        if (view !== 'settings' && view !== 'background') {
          nextState.lastMainView = view;
        }
        return nextState;
      }),
    }),
    {
      name: 'santuario-view-storage',
    }
  )
);
