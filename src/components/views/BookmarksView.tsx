import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Folder, Search, Download, LayoutGrid, Trash2, Eye, Settings, ChevronRight, ChevronLeft, Edit2, Link, FolderPlus, BookmarkPlus, X, List, Plus, Layers, Play, Save } from 'lucide-react';
import { useBookmarksStore, BookmarkNode } from '../../store/bookmarksStore';
import { useWidgetStore } from '../../store/widgetStore';
import { useViewStore } from '../../store/viewStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

const getFaviconUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(urlObj.origin)}&size=32`;
    }
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return '';
  }
};

export const BookmarksView: React.FC = () => {
  const { 
    tree, 
    activeFolderId, 
    setActiveFolder, 
    fetchTree, 
    createBookmark, 
    updateBookmark, 
    removeBookmark 
  } = useBookmarksStore();
  const { 
    isBlurred, 
    toggleBlur, 
    bookmarksViewMode, 
    setBookmarksViewMode,
    bookmarkTabs,
    addBookmarkTab,
    renameBookmarkTab,
    removeBookmarkTab
  } = useWidgetStore();
  const { setActiveView } = useViewStore();
  const { workspaces, addWorkspace, renameWorkspace, deleteWorkspace, setWorkspaceActiveSession } = useWorkspaceStore();


  const [activeTabId, setActiveTabId] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const hasSyncedRef = useRef(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'bookmark' | 'folder' | 'tab' | 'renameTab' | 'workspace' | 'renameWorkspace' | 'renameGroup' | 'groupColor' | 'newGroup'>('bookmark');
  const [editingNode, setEditingNode] = useState<BookmarkNode | null>(null);
  const [editingTab, setEditingTab] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', groupColor: 'grey' });

  // Workspace Specific States
  const [capturedTabs, setCapturedTabs] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: BookmarkNode } | null>(null);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, tab: { id: string; name: string } } | null>(null);
  const [workspaceContextMenu, setWorkspaceContextMenu] = useState<{ x: number, y: number, workspace: any } | null>(null);
  
  const [workspaceGroupContextMenu, setWorkspaceGroupContextMenu] = useState<{ x: number, y: number, workspace: any, groupTitle: string, groupColor: string } | null>(null);
  const [workspaceTabContextMenu, setWorkspaceTabContextMenu] = useState<{ x: number, y: number, workspace: any, tab: any, tIdx: number } | null>(null);
  
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [selectedTabIndex, setSelectedTabIndex] = useState<number | null>(null);
  const [liveChromeGroups, setLiveChromeGroups] = useState<chrome.tabGroups.TabGroup[]>([]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Fetch live chrome groups for context menus
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabGroups) {
      const fetchGroups = async () => {
        try {
          const currentWindow = await chrome.windows.getCurrent();
          if (currentWindow.id) {
            const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });
            setLiveChromeGroups(groups);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchGroups();
      
      const listener = () => fetchGroups();
      chrome.tabGroups.onUpdated.addListener(listener);
      chrome.tabGroups.onCreated.addListener(listener);
      chrome.tabGroups.onRemoved.addListener(listener);
      return () => {
        chrome.tabGroups.onUpdated.removeListener(listener);
        chrome.tabGroups.onCreated.removeListener(listener);
        chrome.tabGroups.onRemoved.removeListener(listener);
      };
    }
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setTabContextMenu(null);
      setWorkspaceContextMenu(null);
      setWorkspaceGroupContextMenu(null);
      setWorkspaceTabContextMenu(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const findNode = (nodes: BookmarkNode[], id: string): BookmarkNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeFolder = useMemo(() => {
    if (!activeFolderId) return tree.length > 0 ? tree[0] : null;
    return findNode(tree, activeFolderId);
  }, [tree, activeFolderId]);

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    setActiveFolder(tabId);
  };

  const handleBack = () => {
    if (activeFolder) {
      const parentId = activeFolder.parentId || activeTabId;
      setActiveFolder(parentId);
      if (bookmarkTabs.some(t => t.id === parentId)) {
        setActiveTabId(parentId);
      }
    }
  };

  // Auto-sync & heal custom tabs with Chrome bookmarks tree (runs once on first load)
  useEffect(() => {
    if (tree.length > 0 && !hasSyncedRef.current) {
      bookmarkTabs.forEach(tab => {
        if (tab.id === '1') return;
        const chromeNode = findNode(tree, tab.id);
        if (!chromeNode) {
          removeBookmarkTab(tab.id);
        } else if (chromeNode.title !== tab.name) {
          renameBookmarkTab(tab.id, chromeNode.title);
        }
      });
      hasSyncedRef.current = true;
    }
  }, [tree, bookmarkTabs, removeBookmarkTab, renameBookmarkTab]);

  // Clean up selection if active tab gets deleted
  useEffect(() => {
    if (activeTabId !== 'workspaces' && !bookmarkTabs.some(tab => tab.id === activeTabId)) {
      setActiveTabId('1');
      setActiveFolder('1');
    }
  }, [bookmarkTabs, activeTabId, setActiveFolder]);

  const displayFolders = useMemo(() => {
    if (!activeFolder) return [];
    
    let childFolders = activeFolder.children?.filter(n => !n.url) || [];
    let directBookmarks = activeFolder.children?.filter(n => n.url) || [];
    
    // Filter by search query if present
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      childFolders = childFolders.filter(f => f.title.toLowerCase().includes(q));
      directBookmarks = directBookmarks.filter(b => b.title.toLowerCase().includes(q));
    }
    
    const cards = [];
    
    if (directBookmarks.length > 0 && activeFolder.title) {
      cards.push({ ...activeFolder, children: directBookmarks, isMain: true });
    }
    
    cards.push(...childFolders);
    return cards;
  }, [activeFolder, searchQuery]);

  const openAddModal = (type: 'bookmark' | 'folder') => {
    setModalType(type);
    setEditingNode(null);
    setFormData({ title: '', url: '', groupColor: 'grey' });
    setIsModalOpen(true);
  };

  const openEditModal = (node: BookmarkNode) => {
    setModalType(node.url ? 'bookmark' : 'folder');
    setEditingNode(node);
    setFormData({ title: node.title, url: node.url || '', groupColor: 'grey' });
    setIsModalOpen(true);
  };

  const openAddTabModal = () => {
    setModalType('tab');
    setEditingTab(null);
    setFormData({ title: '', url: '', groupColor: 'grey' });
    setIsModalOpen(true);
  };

  const openRenameTabModal = (tab: { id: string; name: string }) => {
    setModalType('renameTab');
    setEditingTab(tab);
    setFormData({ title: tab.name, url: '', groupColor: 'grey' });
    setIsModalOpen(true);
  };

  const handleDeleteTab = async (tabId: string) => {
    if (confirm('Are you sure you want to delete this tab and all its bookmarks?')) {
      try {
        await removeBookmark(tabId);
        removeBookmarkTab(tabId);
        if (activeTabId === tabId) {
          setActiveTabId('1');
          setActiveFolder('1');
        }
      } catch (err) {
        console.error('Failed to delete tab:', err);
      }
    }
  };

  const captureActiveSession = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        
        let groups: chrome.tabGroups.TabGroup[] = [];
        if (chrome.tabGroups) {
          groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
        }
        
        const groupsMap = new Map<number, chrome.tabGroups.TabGroup>();
        groups.forEach(g => {
          groupsMap.set(g.id, g);
        });

        const filteredTabs = tabs.filter(tab => {
          if (!tab.url) return false;
          const isSantuario = tab.url.includes(chrome.runtime.id) || tab.url.includes('localhost:5173');
          const isNewTab = tab.url === 'chrome://newtab/';
          return !isSantuario && !isNewTab;
        });

        if (filteredTabs.length === 0) {
          alert("No other open tabs to save in this workspace. Please open some tabs first!");
          return;
        }

        const workspaceTabs = filteredTabs.map(tab => {
          const group = tab.groupId !== undefined && tab.groupId !== -1 ? groupsMap.get(tab.groupId) : undefined;
          return {
            url: tab.url || '',
            title: tab.title || '',
            favIconUrl: tab.favIconUrl || '',
            groupTitle: group?.title || '',
            groupColor: group?.color || '',
          };
        });

        setCapturedTabs(workspaceTabs);
        setModalType('workspace');
        setFormData({ title: `Workspace ${workspaces.length + 1}`, url: '', groupColor: 'grey' });
        setIsModalOpen(true);
      } catch (err) {
        console.error('Failed to capture session:', err);
      }
    } else {
      // Mock for development mode
      const mockTabs = [
        { url: 'https://github.com', title: 'GitHub', favIconUrl: '', groupTitle: 'Development', groupColor: 'blue' },
        { url: 'https://stackoverflow.com', title: 'Stack Overflow', favIconUrl: '', groupTitle: 'Development', groupColor: 'blue' },
        { url: 'https://figma.com', title: 'Figma', favIconUrl: '', groupTitle: 'Design', groupColor: 'purple' },
        { url: 'https://unsplash.com', title: 'Unsplash', favIconUrl: '', groupTitle: 'Design', groupColor: 'purple' },
        { url: 'https://news.ycombinator.com', title: 'Hacker News', favIconUrl: '' },
      ];
      setCapturedTabs(mockTabs);
      setModalType('workspace');
      setFormData({ title: `Workspace ${workspaces.length + 1}`, url: '', groupColor: 'grey' });
      setIsModalOpen(true);
    }
  };

  const restoreWorkspaceSession = async (workspace: any) => {
    if (typeof chrome !== 'undefined' && chrome.windows && chrome.tabs) {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        const currentWindowId = currentWindow.id;
        if (!currentWindowId) return;

        if (workspace.activeWindowId) {
          if (workspace.activeWindowId === currentWindowId) {
            // Already active in this window, just close modal
            setIsModalOpen(false);
            return;
          }
          try {
            await chrome.windows.update(workspace.activeWindowId, { focused: true });
            return;
          } catch {
            // Window might have been closed, clear the session and proceed to launch in current window
            setWorkspaceActiveSession(workspace.id, null);
          }
        }

        const firstTab = workspace.tabs[0];
        if (!firstTab) return;

        // Only close blank new tabs to avoid destroying user's current work
        // Removed querying and closing tabs to prevent accidental data loss.

        // Set this workspace as the active session for the current window
        setWorkspaceActiveSession(workspace.id, currentWindowId);

        // Open the workspace tabs in the current window.
        // We'll create the new workspace tabs first, then close the non-Santuario tabs to ensure window stays open.
        const allNewTabsInfo: { id: number; info: any }[] = [];

        // Create the first tab
        const firstCreatedTab = await chrome.tabs.create({
          windowId: currentWindowId,
          url: firstTab.url,
          active: true
        });
        if (firstCreatedTab.id) {
          allNewTabsInfo.push({ id: firstCreatedTab.id, info: firstTab });
        }

        // Create the remaining workspace tabs
        const tabsToCreate = workspace.tabs.slice(1);
        const tabPromises = tabsToCreate.map(async (wTab: any) => {
          const tab = await chrome.tabs.create({
            windowId: currentWindowId,
            url: wTab.url,
            active: false
          });
          return { tab, wTab };
        });

        const results = await Promise.all(tabPromises);
        results.forEach(r => {
          if (r.tab.id) {
            allNewTabsInfo.push({ id: r.tab.id, info: r.wTab });
          }
        });

        // We no longer close any tabs to prevent accidental data loss of user's active work or groups.

        // Handle tab groups if supported
        if (chrome.tabGroups) {
          const groupsToCreate = new Map<string, { color?: string, tabIds: number[] }>();
          allNewTabsInfo.forEach(t => {
            if (t.id && t.info.groupTitle) {
              const groupName = t.info.groupTitle;
              if (!groupsToCreate.has(groupName)) {
                groupsToCreate.set(groupName, { color: t.info.groupColor, tabIds: [] });
              }
              groupsToCreate.get(groupName)!.tabIds.push(t.id);
            }
          });

          for (const [groupName, groupData] of groupsToCreate.entries()) {
            const groupId = await chrome.tabs.group({
              tabIds: groupData.tabIds,
              createProperties: { windowId: currentWindowId }
            });
            await chrome.tabGroups.update(groupId, {
              title: groupName,
              color: (groupData.color || 'grey') as chrome.tabGroups.ColorEnum
            });
          }
        }
      } catch (err) {
        console.error('Failed to restore workspace:', err);
      }
    } else {
      // Mock alert and open tabs
      if (workspace.activeWindowId) {
        alert(`Focused existing mock workspace window for: ${workspace.name}`);
        return;
      }
      setWorkspaceActiveSession(workspace.id, 9999); // Mock active session ID for dev mode
      workspace.tabs.forEach((t: any) => {
        window.open(t.url, '_blank');
      });
    }
  };

  const openRenameWorkspaceModal = (workspace: any) => {
    setModalType('renameWorkspace');
    setSelectedWorkspaceId(workspace.id);
    setFormData({ title: workspace.name, url: '', groupColor: 'grey' });
    setIsModalOpen(true);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (confirm('Are you sure you want to delete this workspace?')) {
      deleteWorkspace(id);
    }
  };

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    const q = searchQuery.toLowerCase();
    return workspaces.filter(w => w.name.toLowerCase().includes(q));
  }, [workspaces, searchQuery]);

  const pushTabGroupUpdateToChrome = async (workspace: any, tabIndex: number, groupTitle?: string, groupColor?: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabGroups && workspace.activeWindowId) {
      const tab = workspace.tabs[tabIndex];
      if (tab && tab.tabId) {
        try {
          if (!groupTitle) {
            await chrome.tabs.ungroup(tab.tabId);
          } else {
            const currentWindowId = workspace.activeWindowId;
            const liveGroups = await chrome.tabGroups.query({ windowId: currentWindowId });
            let targetGroup = liveGroups.find(g => g.title === groupTitle);
            let groupId;
            if (targetGroup) {
              groupId = targetGroup.id;
              await chrome.tabs.group({ tabIds: [tab.tabId], groupId });
              if (groupColor && groupColor !== targetGroup.color) {
                 await chrome.tabGroups.update(groupId, { color: groupColor as chrome.tabGroups.ColorEnum });
              }
            } else {
              groupId = await chrome.tabs.group({ tabIds: [tab.tabId], createProperties: { windowId: currentWindowId } });
              await chrome.tabGroups.update(groupId, { title: groupTitle, color: (groupColor || 'grey') as chrome.tabGroups.ColorEnum });
            }
          }
        } catch (err) {
          console.error("Failed to push tab group to Chrome:", err);
        }
      }
    }
  };

  const pushGroupRenameToChrome = async (workspace: any, oldTitle: string, newTitle: string, newColor: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabGroups && workspace.activeWindowId) {
      try {
        const liveGroups = await chrome.tabGroups.query({ windowId: workspace.activeWindowId });
        const targetGroup = liveGroups.find(g => g.title === oldTitle);
        if (targetGroup) {
          await chrome.tabGroups.update(targetGroup.id, { title: newTitle, color: newColor as chrome.tabGroups.ColorEnum });
        }
      } catch (err) {
        console.error("Failed to push group rename to Chrome:", err);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title) return;
    
    if (modalType === 'workspace') {
      addWorkspace({
        name: formData.title,
        tabs: capturedTabs
      });
      setCapturedTabs([]);
    } else if (modalType === 'renameWorkspace' && selectedWorkspaceId) {
      renameWorkspace(selectedWorkspaceId, formData.title);
      setSelectedWorkspaceId(null);
    } else if (modalType === 'tab') {
      try {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
          const newFolder = await chrome.bookmarks.create({
            parentId: '1',
            title: formData.title
          });
          // Refresh tree to sync new folder before adding tab to store
          await fetchTree();
          addBookmarkTab({ id: newFolder.id, name: newFolder.title });
          setActiveTabId(newFolder.id);
          setActiveFolder(newFolder.id);
        }
      } catch (err) {
        console.error('Failed to create tab folder:', err);
      }
    } else if (modalType === 'renameTab' && editingTab) {
      try {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
          await chrome.bookmarks.update(editingTab.id, {
            title: formData.title
          });
          // Refresh tree to sync new name before updating tab in store
          await fetchTree();
          renameBookmarkTab(editingTab.id, formData.title);
        }
      } catch (err) {
        console.error('Failed to rename tab:', err);
      }
    } else if (modalType === 'newGroup' && selectedWorkspaceId && selectedTabIndex !== null) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId);
      if (workspace) {
        const newTabs = [...workspace.tabs];
        newTabs[selectedTabIndex] = {
          ...newTabs[selectedTabIndex],
          groupTitle: formData.title,
          groupColor: formData.groupColor
        };
        useWorkspaceStore.getState().updateWorkspaceTabs(selectedWorkspaceId, newTabs);
        pushTabGroupUpdateToChrome(workspace, selectedTabIndex, formData.title, formData.groupColor);
      }
    } else if (modalType === 'renameGroup' && selectedWorkspaceId && selectedGroupName) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId);
      if (workspace) {
        const newTabs = workspace.tabs.map((t) => {
          if (t.groupTitle === selectedGroupName) {
            return { ...t, groupTitle: formData.title };
          }
          return t;
        });
        useWorkspaceStore.getState().updateWorkspaceTabs(selectedWorkspaceId, newTabs);
        pushGroupRenameToChrome(workspace, selectedGroupName, formData.title, formData.groupColor);
      }
    } else if (modalType === 'groupColor' && selectedWorkspaceId && selectedGroupName) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId);
      if (workspace) {
        const newTabs = workspace.tabs.map((t) => {
          if (t.groupTitle === selectedGroupName) {
            return { ...t, groupColor: formData.groupColor };
          }
          return t;
        });
        useWorkspaceStore.getState().updateWorkspaceTabs(selectedWorkspaceId, newTabs);
        pushGroupRenameToChrome(workspace, selectedGroupName, selectedGroupName, formData.groupColor);
      }
    } else {
      const parentId = activeFolderId || '1';
      
      if (editingNode) {
        await updateBookmark(editingNode.id, {
          title: formData.title,
          url: modalType === 'bookmark' ? formData.url : undefined
        });
      } else {
        await createBookmark({
          parentId,
          title: formData.title,
          url: modalType === 'bookmark' ? formData.url : undefined
        });
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await removeBookmark(id);
    setContextMenu(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden relative z-10 select-none px-8 lg:px-14 pt-12 pb-6">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-8 pl-2 pr-24 relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex bg-black/20 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-lg relative gap-1">
            {bookmarkTabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  onContextMenu={(e) => {
                    if (tab.id !== '1') {
                      e.preventDefault();
                      setTabContextMenu({ x: e.clientX, y: e.clientY, tab });
                    }
                  }}
                  className={`relative px-5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-2 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-white/50 hover:text-white/90 hover:bg-white/5'
                  }`}
                >
                  {/* Shared Layout Active Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-white/15 rounded-xl shadow-sm z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <span className="relative z-10">{tab.name}</span>
                </button>
              );
            })}
            
            {/* Permanent Workspaces Tab */}
            <button
              onClick={() => {
                setActiveTabId('workspaces');
                setActiveFolder('workspaces');
              }}
              className={`relative px-5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTabId === 'workspaces'
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              {activeTabId === 'workspaces' && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white/15 rounded-xl shadow-sm z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Workspaces</span>
            </button>
            
            <button
              onClick={openAddTabModal}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 ml-1 relative z-10"
            >
              <Plus size={14} />
            </button>
          </div>

          {activeFolderId && activeFolderId !== activeTabId && activeTabId !== 'workspaces' && (
            <button 
              onClick={handleBack}
              className="ml-2 flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl text-[13px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-lg"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within:text-white/80 transition-colors">
              <Search size={16} />
            </div>
            <input
              id="bookmark-search-input"
              type="text"
              placeholder={activeTabId === 'workspaces' ? "Search workspaces..." : "Search bookmarks..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all w-64 shadow-lg"
            />
          </div>
          
          {activeTabId === 'workspaces' ? (
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-lg">
              <button 
                onClick={captureActiveSession}
                className="h-9 px-4 rounded-xl hover:bg-white/10 flex items-center gap-2 text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95 group relative font-semibold text-[13px]"
              >
                <Save size={14} />
                Capture Session
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-lg">
              <button 
                onClick={() => openAddModal('bookmark')}
                className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95 group relative"
              >
                <BookmarkPlus size={16} />
                <div className="absolute top-full mt-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">Add Bookmark</div>
              </button>
              <button 
                onClick={() => openAddModal('folder')}
                className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95 group relative"
              >
                <FolderPlus size={16} />
                <div className="absolute top-full mt-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">Add Folder</div>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Grid / List */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-8 relative z-10">
        {activeTabId === 'workspaces' ? (
          <div className="max-w-6xl mx-auto w-full">
            {/* Title Banner */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <Layers className="text-white/70" size={24} />
                Workspaces Sanctum
              </h1>
              <p className="text-white/40 text-sm mt-1">
                Save your active browser windows as high-fidelity sessions. Reopen them instantly with preserved tab groups and window context.
              </p>
            </div>

            {filteredWorkspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[32px] text-white/30 text-center min-h-[300px] shadow-2xl">
                <Layers size={48} className="mb-4 text-white/20 animate-pulse" />
                <p className="text-lg font-medium text-white/70">No workspaces saved yet</p>
                <p className="text-sm text-white/40 mt-1 max-w-md">
                  Click the "Capture Session" button in the top right to save all open tabs in your current window as a workspace!
                </p>
                <button 
                  onClick={captureActiveSession}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-white/90 text-black text-[13px] font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Save size={14} /> Capture Your First Workspace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkspaces.map((workspace, idx) => {
                  const dateString = new Date(workspace.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const isActive = !!workspace.activeWindowId;
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: idx * 0.03 }}
                      key={workspace.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setWorkspaceContextMenu({ x: e.clientX, y: e.clientY, workspace });
                      }}
                      className={`group relative overflow-hidden bg-black/20 hover:bg-black/40 backdrop-blur-2xl border rounded-[24px] p-5 transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] flex flex-col justify-between min-h-[220px] ${
                        isActive 
                          ? 'border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)] hover:border-emerald-400/50 hover:shadow-[0_0_35px_rgba(16,185,129,0.2)]' 
                          : 'border-white/5 hover:border-white/15'
                      }`}
                    >
                      {/* Decorative gradient blob inside card */}
                      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-all duration-500 pointer-events-none ${
                        isActive 
                          ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' 
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`} />
                      
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white/95 tracking-wide group-hover:text-white transition-colors">
                                {workspace.name}
                              </h3>
                              {isActive && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              )}
                            </div>
                            {isActive ? (
                              <p className="text-emerald-400/80 text-[11px] font-semibold mt-0.5 flex items-center gap-1">
                                Active & Syncing Live
                              </p>
                            ) : (
                              <p className="text-white/40 text-[11px] font-medium mt-0.5">
                                Created on {dateString}
                              </p>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${
                            isActive 
                              ? 'text-emerald-300 bg-emerald-500/10' 
                              : 'text-white/40 bg-white/5'
                          }`}>
                            {workspace.tabs.length} {workspace.tabs.length === 1 ? 'Tab' : 'Tabs'}
                          </span>
                        </div>

                        {/* Scrollable list of captured tabs with group highlights */}
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1.5 relative z-10 mb-4">
                          {workspace.tabs.map((tab: any, tIdx: number) => {
                            const faviconUrl = getFaviconUrl(tab.url);
                            const hasGroup = !!tab.groupTitle;
                            
                            // Color helper for groups matching chrome group colors
                            const getGroupColorStyle = (color: string) => {
                              const colorsMap: Record<string, string> = {
                                blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                red: 'bg-red-500/20 text-red-300 border-red-500/30',
                                yellow: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                                green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                                pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
                                purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                                cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                                orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                                grey: 'bg-white/10 text-white/60 border-white/10',
                              };
                              return colorsMap[color] || 'bg-white/10 text-white/60 border-white/10';
                            };

                            return (
                              <div 
                                key={tIdx}
                                className="flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors group/item cursor-context-menu"
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  setWorkspaceTabContextMenu({ x: e.clientX, y: e.clientY, workspace, tab, tIdx });
                                }}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
                                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-white/5 rounded shadow-sm border border-white/5">
                                    {tab.url ? (
                                      <img 
                                        src={faviconUrl} 
                                        alt="" 
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                        className="w-3 h-3 object-contain opacity-70 group-hover/item:opacity-100" 
                                      />
                                    ) : (
                                      <Bookmark size={10} className="text-white/40" />
                                    )}
                                  </div>
                                  <span className="text-[12px] font-medium text-white/60 group-hover/item:text-white/90 truncate">
                                    {tab.title || tab.url}
                                  </span>
                                </div>
                                
                                {hasGroup && (
                                  <span 
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setWorkspaceGroupContextMenu({ x: e.clientX, y: e.clientY, workspace, groupTitle: tab.groupTitle, groupColor: tab.groupColor });
                                    }}
                                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border cursor-context-menu ${getGroupColorStyle(tab.groupColor)}`}
                                  >
                                    {tab.groupTitle}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Restore Session Launcher Button */}
                      <div className="flex justify-end pt-2 border-t border-white/5 relative z-10">
                        <button
                          onClick={() => restoreWorkspaceSession(workspace)}
                          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-md ${
                            isActive 
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30' 
                              : 'bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border-white/10'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Workspace
                            </>
                          ) : (
                            <>
                              <Play size={12} fill="currentColor" />
                              Launch Workspace
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={bookmarksViewMode === 'grid' 
              ? "columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6" 
              : "flex flex-col gap-4 max-w-4xl mx-auto"
            }>
              <AnimatePresence>
                {displayFolders.map((folder, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: idx * 0.03 }}
                    key={folder.id}
                    className="break-inside-avoid mb-6"
                  >
                    <FolderCard 
                      folder={folder} 
                      isBlurred={isBlurred} 
                      viewMode={bookmarksViewMode}
                      onNavigate={(id) => {
                        const targetId = id || folder.id;
                        setActiveFolder(targetId);
                        if (bookmarkTabs.some(t => t.id === targetId)) {
                          setActiveTabId(targetId);
                        }
                      }}
                      onContextMenu={(e, node) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, node });
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {displayFolders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-white/30 pt-20">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No bookmarks found</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[200px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.node.url && (
              <>
                <button 
                  onClick={() => {
                    window.open(contextMenu.node.url, '_blank');
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Link size={14} /> Open in New Tab
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(contextMenu.node.url!);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Link size={14} /> Copy URL
                </button>
                <div className="h-px bg-white/10 my-1 mx-2" />
              </>
            )}
            
            <button 
              onClick={() => {
                openEditModal(contextMenu.node);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Edit2 size={14} /> Edit {contextMenu.node.url ? 'Bookmark' : 'Folder'}
            </button>
            <button 
              onClick={() => handleDelete(contextMenu.node.id)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Context Menu */}
      <AnimatePresence>
        {tabContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[160px]"
            style={{ top: tabContextMenu.y, left: tabContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                openRenameTabModal(tabContextMenu.tab);
                setTabContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Edit2 size={14} /> Rename Tab
            </button>
            <button 
              onClick={() => {
                handleDeleteTab(tabContextMenu.tab.id);
                setTabContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <Trash2 size={14} /> Delete Tab
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Context Menu */}
      <AnimatePresence>
        {workspaceContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[180px]"
            style={{ top: workspaceContextMenu.y, left: workspaceContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                openRenameWorkspaceModal(workspaceContextMenu.workspace);
                setWorkspaceContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Edit2 size={14} /> Rename Workspace
            </button>
            <button 
              onClick={() => {
                handleDeleteWorkspace(workspaceContextMenu.workspace.id);
                setWorkspaceContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <Trash2 size={14} /> Delete Workspace
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Tab Context Menu */}
      <AnimatePresence>
        {workspaceTabContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[180px]"
            style={{ top: workspaceTabContextMenu.y, left: workspaceTabContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setModalType('newGroup');
                setSelectedWorkspaceId(workspaceTabContextMenu.workspace.id);
                setSelectedTabIndex(workspaceTabContextMenu.tIdx);
                setFormData({ title: '', url: '', groupColor: 'grey' } as any);
                setIsModalOpen(true);
                setWorkspaceTabContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <FolderPlus size={14} /> Add to New Group
            </button>
            {Array.from(new Set([
              ...workspaceTabContextMenu.workspace.tabs.filter((t: any) => t.groupTitle).map((t: any) => t.groupTitle),
              ...liveChromeGroups.filter(g => g.title).map(g => g.title)
            ])).map((groupName) => (
              <button 
                key={groupName as string}
                onClick={() => {
                  const w = workspaceTabContextMenu.workspace;
                  const newTabs = [...w.tabs];
                  
                  // Prioritize live group color if available, otherwise find in workspace tabs
                  const liveGroup = liveChromeGroups.find(g => g.title === groupName);
                  let groupColor = liveGroup?.color;
                  if (!groupColor) {
                    groupColor = w.tabs.find((t: any) => t.groupTitle === groupName)?.groupColor || 'grey';
                  }
                  
                  newTabs[workspaceTabContextMenu.tIdx] = {
                    ...newTabs[workspaceTabContextMenu.tIdx],
                    groupTitle: groupName,
                    groupColor: groupColor
                  };
                  useWorkspaceStore.getState().updateWorkspaceTabs(w.id, newTabs);
                  pushTabGroupUpdateToChrome(w, workspaceTabContextMenu.tIdx, groupName as string, groupColor);
                  setWorkspaceTabContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Layers size={14} /> Add to "{groupName as string}"
              </button>
            ))}
            {workspaceTabContextMenu.tab.groupTitle && (
              <button 
                onClick={() => {
                  const w = workspaceTabContextMenu.workspace;
                  const newTabs = [...w.tabs];
                  newTabs[workspaceTabContextMenu.tIdx] = {
                    ...newTabs[workspaceTabContextMenu.tIdx],
                    groupTitle: undefined,
                    groupColor: undefined
                  };
                  useWorkspaceStore.getState().updateWorkspaceTabs(w.id, newTabs);
                  pushTabGroupUpdateToChrome(w, workspaceTabContextMenu.tIdx, undefined, undefined);
                  setWorkspaceTabContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={14} /> Remove from Group
              </button>
            )}
            <button 
              onClick={() => {
                const w = workspaceTabContextMenu.workspace;
                const newTabs = w.tabs.filter((_: any, i: number) => i !== workspaceTabContextMenu.tIdx);
                useWorkspaceStore.getState().updateWorkspaceTabs(w.id, newTabs);
                if (typeof chrome !== 'undefined' && chrome.tabs && w.activeWindowId) {
                  const tabToClose = w.tabs[workspaceTabContextMenu.tIdx];
                  if (tabToClose?.tabId) {
                    chrome.tabs.remove(tabToClose.tabId).catch(console.error);
                  }
                }
                setWorkspaceTabContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <Trash2 size={14} /> Delete Tab
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Group Context Menu */}
      <AnimatePresence>
        {workspaceGroupContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[180px]"
            style={{ top: workspaceGroupContextMenu.y, left: workspaceGroupContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setModalType('renameGroup');
                setSelectedWorkspaceId(workspaceGroupContextMenu.workspace.id);
                setSelectedGroupName(workspaceGroupContextMenu.groupTitle);
                setFormData({ title: workspaceGroupContextMenu.groupTitle, url: '', groupColor: workspaceGroupContextMenu.groupColor } as any);
                setIsModalOpen(true);
                setWorkspaceGroupContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Edit2 size={14} /> Rename Group
            </button>
            <button 
              onClick={() => {
                setModalType('groupColor');
                setSelectedWorkspaceId(workspaceGroupContextMenu.workspace.id);
                setSelectedGroupName(workspaceGroupContextMenu.groupTitle);
                setFormData({ title: workspaceGroupContextMenu.groupTitle, url: '', groupColor: workspaceGroupContextMenu.groupColor } as any);
                setIsModalOpen(true);
                setWorkspaceGroupContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Bookmark size={14} /> Change Color
            </button>
            <div className="h-px bg-white/10 my-1 mx-2" />
            <button 
              onClick={() => {
                const w = workspaceGroupContextMenu.workspace;
                const newTabs = w.tabs.map((t: any) => {
                  if (t.groupTitle === workspaceGroupContextMenu.groupTitle) {
                    return { ...t, groupTitle: undefined, groupColor: undefined };
                  }
                  return t;
                });
                useWorkspaceStore.getState().updateWorkspaceTabs(w.id, newTabs);
                
                // Push ungroup to Chrome for all tabs in this group
                if (typeof chrome !== 'undefined' && chrome.tabs && w.activeWindowId) {
                  const tabsToUngroup = w.tabs.filter((t: any) => t.groupTitle === workspaceGroupContextMenu.groupTitle);
                  tabsToUngroup.forEach((t: any) => {
                    if (t.tabId) chrome.tabs.ungroup(t.tabId).catch(console.error);
                  });
                }
                
                setWorkspaceGroupContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-xl transition-colors"
            >
              <Layers size={14} /> Ungroup Tabs
            </button>
            <button 
              onClick={() => {
                if (confirm('Delete all tabs in this group?')) {
                  const w = workspaceGroupContextMenu.workspace;
                  const tabsToClose = w.tabs.filter((t: any) => t.groupTitle === workspaceGroupContextMenu.groupTitle);
                  const newTabs = w.tabs.filter((t: any) => t.groupTitle !== workspaceGroupContextMenu.groupTitle);
                  useWorkspaceStore.getState().updateWorkspaceTabs(w.id, newTabs);
                  
                  // Close the tabs in Chrome
                  if (typeof chrome !== 'undefined' && chrome.tabs && w.activeWindowId) {
                    const tabIdsToClose = tabsToClose.map((t: any) => t.tabId).filter(Boolean);
                    if (tabIdsToClose.length > 0) {
                      chrome.tabs.remove(tabIdsToClose).catch(console.error);
                    }
                  }
                  
                  setWorkspaceGroupContextMenu(null);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <Trash2 size={14} /> Close Group
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#1a1a1a]/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6">
                {modalType === 'tab' ? 'Create New Tab' : 
                 modalType === 'renameTab' ? 'Rename Tab' : 
                 modalType === 'workspace' ? 'Save Workspace' :
                 modalType === 'renameWorkspace' ? 'Rename Workspace' :
                 modalType === 'renameGroup' ? 'Rename Group' :
                 modalType === 'newGroup' ? 'Create New Group' :
                 modalType === 'groupColor' ? 'Change Group Color' :
                 `${editingNode ? 'Edit' : 'Add'} ${modalType === 'bookmark' ? 'Bookmark' : 'Folder'}`}
              </h2>
              
              <div className="space-y-4">
                {modalType !== 'groupColor' && (
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      {modalType === 'tab' || modalType === 'renameTab' ? 'Tab Name' : 
                       modalType === 'workspace' || modalType === 'renameWorkspace' ? 'Workspace Name' : 
                       modalType === 'renameGroup' || modalType === 'newGroup' ? 'Group Name' :
                       'Title'}
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder={
                        modalType === 'tab' || modalType === 'renameTab' ? 'E.g., Work' : 
                        modalType === 'workspace' || modalType === 'renameWorkspace' ? 'E.g., My Coding Setup' : 
                        modalType === 'renameGroup' || modalType === 'newGroup' ? 'E.g., Research' :
                        'E.g., Design Inspiration'
                      }
                      autoFocus
                    />
                  </div>
                )}
                
                {(modalType === 'newGroup' || modalType === 'groupColor') && (
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 mt-4">
                      Group Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, groupColor: color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.groupColor === color ? 'scale-110 border-white' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: color === 'grey' ? '#5f6368' :
                                             color === 'blue' ? '#8ab4f8' :
                                             color === 'red' ? '#f28b82' :
                                             color === 'yellow' ? '#fde293' :
                                             color === 'green' ? '#81c995' :
                                             color === 'pink' ? '#ff8bcb' :
                                             color === 'purple' ? '#c58af9' :
                                             color === 'cyan' ? '#78d9ec' :
                                             color === 'orange' ? '#fcad70' : '#5f6368'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {modalType === 'bookmark' && (
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">URL</label>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                )}
                
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={
                      (modalType !== 'groupColor' && !formData.title) || 
                      (modalType === 'bookmark' && !formData.url)
                    }
                    className="flex-1 px-4 py-3 rounded-xl bg-white hover:bg-white/90 text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Right Action Menu */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
        <ActionButton 
          icon={Search} 
          tooltip="Search" 
          onClick={() => document.getElementById('bookmark-search-input')?.focus()} 
        />
        <ActionButton 
          icon={bookmarksViewMode === 'grid' ? List : LayoutGrid} 
          tooltip={bookmarksViewMode === 'grid' ? 'List View' : 'Grid View'} 
          onClick={() => setBookmarksViewMode(bookmarksViewMode === 'grid' ? 'list' : 'grid')} 
        />
        <ActionButton 
          icon={Download} 
          tooltip="Import/Export (Coming soon)" 
          onClick={() => alert('Import/Export feature is not yet available.')} 
        />
        <div className="w-8 h-[1px] bg-white/10 mx-auto my-1" />
        <ActionButton 
          icon={Eye} 
          tooltip="Privacy Toggle" 
          onClick={toggleBlur} 
        />
        <ActionButton 
          icon={Trash2} 
          tooltip="Trash (Coming soon)" 
          onClick={() => alert('Trash feature is not yet available.')} 
        />
        <div className="mt-2">
          <ActionButton 
            icon={Settings} 
            highlight 
            tooltip="Settings" 
            onClick={() => setActiveView('settings')} 
          />
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon: Icon, highlight = false, tooltip, onClick }: any) => (
  <div className="relative group">
    <button 
      onClick={onClick}
      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-2xl ${
        highlight 
          ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20 hover:scale-105 shadow-[0_8px_32px_rgba(255,255,255,0.1)]' 
          : 'bg-black/30 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 hover:scale-105 shadow-xl'
      }`}
    >
      <Icon size={18} strokeWidth={highlight ? 2.5 : 2} />
    </button>
    <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-white/10 shadow-xl">
      {tooltip}
    </div>
  </div>
);

const FolderCard = ({ 
  folder, 
  isBlurred,
  viewMode = 'grid',
  onNavigate,
  onContextMenu
}: { 
  folder: BookmarkNode, 
  isBlurred: boolean,
  viewMode?: 'grid' | 'list',
  onNavigate: (id?: string) => void,
  onContextMenu: (e: React.MouseEvent, node: BookmarkNode) => void
}) => {
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(urlObj.origin)}&size=32`;
    } catch {
      return '';
    }
  };

  const bookmarks = folder.children?.filter(n => n.url) || [];
  const subfolders = folder.children?.filter(n => !n.url) || [];
  
  if (bookmarks.length === 0 && subfolders.length === 0) return null;

  return (
    <div 
      className={`group relative overflow-hidden bg-black/20 hover:bg-black/40 backdrop-blur-2xl border border-white/5 hover:border-white/15 rounded-[24px] p-5 transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-6' : ''}`}
      onContextMenu={(e) => {
        if ((folder as any).isMain) {
          e.preventDefault();
          onContextMenu(e, folder);
        }
      }}
    >
      {/* Decorative gradient blob inside card */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-500 pointer-events-none" />
      
      <div 
        className="flex items-center justify-between mb-4 px-1 relative z-10 cursor-pointer"
        onClick={() => {
          if (!(folder as any).isMain) {
            onNavigate(folder.id);
          }
        }}
        onContextMenu={(e) => {
          if (!(folder as any).isMain) {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e, folder);
          }
        }}
      >
        <h3 className="text-[15px] font-semibold text-white/90 tracking-wide hover:text-white transition-colors">{folder.title}</h3>
        {!(folder as any).isMain && (
          <button className="text-white/30 hover:text-white/80 transition-colors" onClick={(e) => {
            e.stopPropagation();
            onNavigate(folder.id);
          }}>
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className={`flex flex-col space-y-0.5 relative z-10 ${viewMode === 'list' ? 'flex-1 grid grid-cols-2 lg:grid-cols-3 gap-2 space-y-0' : ''}`}>
        {bookmarks.slice(0, viewMode === 'list' ? 99 : 12).map(bm => (
          <a 
            key={bm.id} 
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-white/10 transition-colors group/item"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(e, bm);
            }}
          >
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-white/5 group-hover/item:bg-white/10 rounded-lg shadow-sm border border-white/5 group-hover/item:border-white/10 transition-colors">
              {bm.url ? (
                <img src={getFaviconUrl(bm.url)} alt="" className="w-3.5 h-3.5 object-contain opacity-70 group-hover/item:opacity-100 transition-opacity drop-shadow-sm" />
              ) : (
                <Bookmark size={12} className="text-white/40 group-hover/item:text-white/80" />
              )}
            </div>
            <span className={`text-[13px] font-medium text-white/60 group-hover/item:text-white/95 truncate transition-colors ${isBlurred ? 'blur-[4px] select-none' : ''}`}>
              {bm.title}
            </span>
          </a>
        ))}
        
        {viewMode === 'grid' && bookmarks.length > 12 && (
          <div className="px-4 py-2 mt-1 text-[11px] font-bold tracking-wider text-white/30 uppercase">
            + {bookmarks.length - 12} more bookmarks
          </div>
        )}
        
        {viewMode === 'list' && bookmarks.length > 99 && (
          <div className="px-4 py-2 mt-1 text-[11px] font-bold tracking-wider text-white/30 uppercase">
            + {bookmarks.length - 99} more bookmarks
          </div>
        )}
        
        {subfolders.length > 0 && bookmarks.length > 0 && viewMode === 'grid' && (
          <div className="h-px bg-white/5 my-3 mx-2" />
        )}
        
        {subfolders.map(sub => (
          <div 
            key={sub.id} 
            className="relative"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(e, sub);
            }}
          >
            <div 
              className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-white/10 transition-colors cursor-pointer text-white/60 hover:text-white group/folder"
              onClick={() => onNavigate(sub.id)}
            >
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-white/5 group-hover/folder:bg-white/10 rounded-lg shadow-sm border border-white/5 transition-colors">
                <Folder size={12} className="opacity-70 group-hover/folder:opacity-100" />
              </div>
              <span className="text-[13px] font-medium truncate">{sub.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

