import { create } from 'zustand';

export interface DriveFile {
  id: string;
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  type?: string;
  size?: number;
  lastModified?: number;
  url?: string;
}

interface DriveState {
  rootHandle: FileSystemDirectoryHandle | null;
  files: DriveFile[];
  isIndexing: boolean;
  error: string | null;
  
  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  indexFolder: () => Promise<void>;
  clearDrive: () => void;
  init: () => Promise<void>;
}

export const useDriveStore = create<DriveState>((set, get) => ({
  rootHandle: null,
  files: [],
  isIndexing: false,
  error: null,

  setRootHandle: (handle) => {
    set({ rootHandle: handle, files: [], error: null });
    if (handle) {
      // Store in IndexedDB for persistence
      saveHandleToDB(handle);
      get().indexFolder();
    }
  },

  indexFolder: async () => {
    const { rootHandle } = get();
    if (!rootHandle) return;

    try {
      const permission = await rootHandle.queryPermission({ mode: 'read' });
      if (permission !== 'granted') {
        const request = await rootHandle.requestPermission({ mode: 'read' });
        if (request !== 'granted') {
          set({ error: 'Permission denied to access folder.', isIndexing: false });
          return;
        }
      }
    } catch (e) {
      console.warn('Permission check failed', e);
    }

    set({ isIndexing: true, error: null });
    
    try {
      const indexedFiles: DriveFile[] = [];
      
      const scan = async (handle: FileSystemDirectoryHandle) => {
        for await (const entry of (handle as any).values()) {
          if (entry.kind === 'file') {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            
            const isMedia = file.type.startsWith('image/') || 
                           file.type.startsWith('video/') ||
                           /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i.test(entry.name);

            if (isMedia) {
              indexedFiles.push({
                id: crypto.randomUUID(),
                name: entry.name,
                kind: 'file',
                handle: fileHandle,
                type: file.type || (entry.name.endsWith('mp4') ? 'video/mp4' : 'image/jpeg'),
                size: file.size,
                lastModified: file.lastModified,
              });
            }
          } else if (entry.kind === 'directory') {
            await scan(entry as FileSystemDirectoryHandle);
          }
        }
      };

      await scan(rootHandle);
      
      // Default sort by last modified
      indexedFiles.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
      
      set({ files: indexedFiles, isIndexing: false });
    } catch (err) {
      console.error('Failed to index folder:', err);
      set({ error: 'Failed to access folder. Please try again.', isIndexing: false });
    }
  },

  clearDrive: () => {
    set({ rootHandle: null, files: [], error: null });
    deleteHandleFromDB();
  },

  init: async () => {
    const handle = await loadHandleFromDB();
    if (handle) {
      set({ rootHandle: handle });
      // We don't automatically index because we might need to re-request permission
    }
  },
}));

// IndexedDB Helpers
const DB_NAME = 'santuario-drive';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'root-folder';

async function saveHandleToDB(handle: FileSystemDirectoryHandle) {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(handle, HANDLE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save handle to DB:', err);
  }
}

async function loadHandleFromDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load handle from DB:', err);
    return null;
  }
}

async function deleteHandleFromDB() {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete handle from DB:', err);
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

