import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { storage as extensionStorage } from '../lib/storage';

interface WidgetState {
  activeWidgets: string[];
  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
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
    }),
    {
      name: 'santuario-widget-storage',
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
