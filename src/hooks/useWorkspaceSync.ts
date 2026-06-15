import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export const useWorkspaceSync = () => {
  const { 
    workspaces, 
    updateWorkspaceTabs, 
    setWorkspaceActiveSession, 
    clearAllActiveSessions 
  } = useWorkspaceStore();

  const workspacesRef = useRef(workspaces);
  
  useEffect(() => {
    workspacesRef.current = workspaces;
  }, [workspaces]);

  // Validate active sessions on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.windows) {
      workspaces.forEach(async (w) => {
        if (w.activeWindowId) {
          try {
            await chrome.windows.get(w.activeWindowId);
          } catch {
            // Window no longer exists
            setWorkspaceActiveSession(w.id, null);
          }
        }
      });
    } else {
      // Clear active sessions in development/mock mode on mount
      clearAllActiveSessions();
    }
  }, []);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    const syncWindowTabs = async (windowId: number) => {
      const activeWorkspace = workspacesRef.current.find(w => w.activeWindowId === windowId);
      if (!activeWorkspace) return;

      try {
        const tabs = await chrome.tabs.query({ windowId });
        
        let groups: chrome.tabGroups.TabGroup[] = [];
        if (chrome.tabGroups) {
          groups = await chrome.tabGroups.query({ windowId });
        }
        
        const groupsMap = new Map<number, chrome.tabGroups.TabGroup>();
        groups.forEach(g => {
          groupsMap.set(g.id, g);
        });

        // Filter out Santuario instances and blank new tabs
        const filteredTabs = tabs.filter(tab => {
          if (!tab.url) return false;
          const isSantuario = tab.url.includes(chrome.runtime.id) || tab.url.includes('localhost:5173');
          const isNewTab = tab.url === 'chrome://newtab/';
          return !isSantuario && !isNewTab;
        });

        const workspaceTabs = filteredTabs.map(tab => {
          const group = tab.groupId !== undefined && tab.groupId !== -1 ? groupsMap.get(tab.groupId) : undefined;
          return {
            url: tab.url || '',
            title: tab.title || '',
            favIconUrl: tab.favIconUrl || '',
            groupTitle: group?.title || '',
            groupColor: group?.color || '',
            tabId: tab.id,
            groupId: group?.id,
          };
        });

        updateWorkspaceTabs(activeWorkspace.id, workspaceTabs);
      } catch (err) {
        console.error('Failed to sync workspace tabs:', err);
      }
    };

    const handleTabChange = (_tabId: number, changeInfo: any, tab: chrome.tabs.Tab) => {
      if (tab.windowId && (changeInfo.url || changeInfo.title)) {
        syncWindowTabs(tab.windowId);
      }
    };

    const handleTabCreated = (tab: chrome.tabs.Tab) => {
      if (tab.windowId) {
        syncWindowTabs(tab.windowId);
      }
    };

    const handleTabRemoved = (_tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
      if (removeInfo.windowId && !removeInfo.isWindowClosing) {
        syncWindowTabs(removeInfo.windowId);
      }
    };

    const handleTabMoved = (_tabId: number, moveInfo: chrome.tabs.TabMoveInfo) => {
      if (moveInfo.windowId) {
        syncWindowTabs(moveInfo.windowId);
      }
    };

    const handleTabAttached = (_tabId: number, attachInfo: chrome.tabs.TabAttachInfo) => {
      if (attachInfo.newWindowId) {
        syncWindowTabs(attachInfo.newWindowId);
      }
    };

    const handleTabDetached = (_tabId: number, detachInfo: chrome.tabs.TabDetachInfo) => {
      if (detachInfo.oldWindowId) {
        syncWindowTabs(detachInfo.oldWindowId);
      }
    };

    const handleGroupUpdated = (group: chrome.tabGroups.TabGroup) => {
      if (group.windowId) {
        syncWindowTabs(group.windowId);
      }
    };

    const handleWindowRemoved = (windowId: number) => {
      const workspace = workspacesRef.current.find(w => w.activeWindowId === windowId);
      if (workspace) {
        setWorkspaceActiveSession(workspace.id, null);
      }
    };

    // Add Chrome listeners
    chrome.tabs.onCreated.addListener(handleTabCreated);
    chrome.tabs.onUpdated.addListener(handleTabChange);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onMoved.addListener(handleTabMoved);
    chrome.tabs.onAttached.addListener(handleTabAttached);
    chrome.tabs.onDetached.addListener(handleTabDetached);
    
    if (chrome.tabGroups) {
      chrome.tabGroups.onUpdated.addListener(handleGroupUpdated);
    }

    if (chrome.windows) {
      chrome.windows.onRemoved.addListener(handleWindowRemoved);
    }

    return () => {
      chrome.tabs.onCreated.removeListener(handleTabCreated);
      chrome.tabs.onUpdated.removeListener(handleTabChange);
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
      chrome.tabs.onMoved.removeListener(handleTabMoved);
      chrome.tabs.onAttached.removeListener(handleTabAttached);
      chrome.tabs.onDetached.removeListener(handleTabDetached);
      
      if (chrome.tabGroups) {
        chrome.tabGroups.onUpdated.removeListener(handleGroupUpdated);
      }
      if (chrome.windows) {
        chrome.windows.onRemoved.removeListener(handleWindowRemoved);
      }
    };
  }, [updateWorkspaceTabs, setWorkspaceActiveSession]);
};
