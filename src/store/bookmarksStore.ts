import { create } from 'zustand';

export interface BookmarkNode extends chrome.bookmarks.BookmarkTreeNode {
  children?: BookmarkNode[];
}

interface BookmarksState {
  tree: BookmarkNode[];
  isLoading: boolean;
  error: string | null;
  activeFolderId: string | null;

  // Actions
  fetchTree: () => Promise<void>;
  setActiveFolder: (id: string | null) => void;
  moveBookmark: (id: string, destination: chrome.bookmarks.BookmarkDestinationArg) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  createBookmark: (bookmark: chrome.bookmarks.BookmarkCreateArg) => Promise<void>;
  updateBookmark: (id: string, changes: chrome.bookmarks.BookmarkChangesArg) => Promise<void>;
  searchBookmarks: (query: string) => Promise<BookmarkNode[]>;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  tree: [],
  isLoading: false,
  error: null,
  activeFolderId: '1', // Default to '1' (usually Bookmarks Bar)

  fetchTree: async () => {
    set({ isLoading: true, error: null });
    try {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        const tree = await chrome.bookmarks.getTree();
        set({ tree: tree as BookmarkNode[] });
      } else {
        throw new Error('Chrome Bookmarks API not available');
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveFolder: (id) => set({ activeFolderId: id }),

  moveBookmark: async (id, destination) => {
    try {
      await chrome.bookmarks.move(id, destination);
      await get().fetchTree(); // Refresh tree
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeBookmark: async (id) => {
    try {
      await chrome.bookmarks.removeTree(id);
      await get().fetchTree();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  createBookmark: async (bookmark) => {
    try {
      await chrome.bookmarks.create(bookmark);
      await get().fetchTree();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  updateBookmark: async (id, changes) => {
    try {
      await chrome.bookmarks.update(id, changes);
      await get().fetchTree();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  searchBookmarks: async (query) => {
    if (!query.trim()) return [];
    try {
      const results = await chrome.bookmarks.search(query);
      return results as BookmarkNode[];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  },
}));
