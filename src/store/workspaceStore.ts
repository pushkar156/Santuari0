import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { storage as extensionStorage } from '../lib/storage';

export interface WorkspaceTab {
  url: string;
  title: string;
  favIconUrl?: string;
  groupTitle?: string;
  groupColor?: string;
  tabId?: number;
  groupId?: number;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  tabs: WorkspaceTab[];
  activeWindowId?: number | null;
}

interface WorkspaceState {
  workspaces: Workspace[];
  restoringWorkspaceId: string | null;
  setRestoringWorkspaceId: (id: string | null) => void;
  addWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt' | 'activeWindowId'>) => void;
  renameWorkspace: (id: string, name: string) => void;
  deleteWorkspace: (id: string) => void;
  updateWorkspaceTabs: (id: string, tabs: WorkspaceTab[]) => void;
  setWorkspaceActiveSession: (id: string, windowId: number | null) => void;
  clearAllActiveSessions: () => void;
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

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      restoringWorkspaceId: null,
      setRestoringWorkspaceId: (id) => set({ restoringWorkspaceId: id }),
      addWorkspace: (workspace) => set((state) => ({
        workspaces: [
          ...state.workspaces,
          {
            ...workspace,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            activeWindowId: null,
          }
        ]
      })),
      renameWorkspace: (id, name) => set((state) => ({
        workspaces: state.workspaces.map(w => w.id === id ? { ...w, name } : w)
      })),
      deleteWorkspace: (id) => set((state) => ({
        workspaces: state.workspaces.filter(w => w.id !== id)
      })),
      updateWorkspaceTabs: (id, tabs) => set((state) => ({
        workspaces: state.workspaces.map(w => w.id === id ? { ...w, tabs } : w)
      })),
      setWorkspaceActiveSession: (id, windowId) => set((state) => ({
        workspaces: state.workspaces.map(w => {
          if (windowId && w.activeWindowId === windowId && w.id !== id) {
            return { ...w, activeWindowId: null };
          }
          return w.id === id ? { ...w, activeWindowId: windowId } : w;
        })
      })),
      clearAllActiveSessions: () => set((state) => ({
        workspaces: state.workspaces.map(w => ({ ...w, activeWindowId: null }))
      })),
    }),
    {
      name: 'santuario-workspace-storage',
      storage: createJSONStorage(() => storageAdapter),
      partialize: (state) => ({ workspaces: state.workspaces }),
    }
  )
);
