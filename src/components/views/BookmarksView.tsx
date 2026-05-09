import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bookmark, 
  Folder, 
  Search, 
  Plus, 
  ChevronRight, 
  Trash2,
  Edit2,
  ExternalLink,
  Grid,
  List as ListIcon,
  FolderPlus,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { useBookmarksStore, BookmarkNode } from '../../store/bookmarksStore';
import { useWidgetStore } from '../../store/widgetStore';

export const BookmarksView: React.FC = () => {
  const { 
    tree, 
    activeFolderId, 
    isLoading, 
    fetchTree, 
    setActiveFolder, 
    removeBookmark,
    moveBookmark,
    searchBookmarks
  } = useBookmarksStore();
  
  const { isBlurred } = useWidgetStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookmarkNode[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Sync search
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery) {
        const results = await searchBookmarks(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    performSearch();
  }, [searchQuery, searchBookmarks]);

  // Helper to find a node by ID
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
    if (!activeFolderId) return null;
    return findNode(tree, activeFolderId);
  }, [tree, activeFolderId]);

  const bookmarks = useMemo(() => {
    if (searchQuery) return searchResults;
    return activeFolder?.children?.filter(n => n.url) || [];
  }, [activeFolder, searchQuery, searchResults]);

  const folders = useMemo(() => {
    return activeFolder?.children?.filter(n => !n.url) || [];
  }, [activeFolder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
    const newIndex = bookmarks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      moveBookmark(active.id as string, {
        parentId: activeFolderId!,
        index: newIndex,
      });
    }
  };

  const breadcrumbs = useMemo(() => {
    const path: BookmarkNode[] = [];
    if (!activeFolderId || tree.length === 0) return path;

    const findPath = (current: BookmarkNode, targetId: string, currentPath: BookmarkNode[]): boolean => {
      if (current.id === targetId) {
        path.push(...currentPath, current);
        return true;
      }
      if (current.children) {
        for (const child of current.children) {
          if (findPath(child, targetId, [...currentPath, current])) return true;
        }
      }
      return false;
    };

    findPath(tree[0], activeFolderId, []);
    return path;
  }, [tree, activeFolderId]);

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(urlObj.origin)}&size=32`;
    } catch {
      return '';
    }
  };

  if (isLoading && tree.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 relative z-20">
        <Loader2 size={48} className="text-white animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative z-10 bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl relative z-30">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95"
          >
            {isSidebarOpen ? <ChevronLeft size={22} /> : <Bookmark size={22} />}
          </button>
          
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-white tracking-tighter">Bookmarks</h1>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2 overflow-hidden">
              {breadcrumbs.map((node, i) => (
                <React.Fragment key={node.id}>
                  {i > 0 && <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />}
                  <button 
                    onClick={() => setActiveFolder(node.id)}
                    className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors hover:text-white ${i === breadcrumbs.length - 1 ? 'text-white' : 'text-slate-500'}`}
                  >
                    {node.title || 'Root'}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Search bookmarks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white outline-none focus:border-white/20 focus:bg-slate-900 transition-all font-medium placeholder-slate-600"
            />
          </div>
          
          <div className="flex items-center bg-slate-950/50 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
          
          <div className="h-6 w-px bg-white/10" />
          
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-white/5">
            <Plus size={16} />
            Add New
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Folder Tree */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 flex flex-col border-r border-white/5 bg-slate-900/30 backdrop-blur-md overflow-hidden relative z-20"
            >
              <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-4">Tree Explorer</h2>
                  {tree[0]?.children?.map(node => (
                    <FolderTreeItem 
                      key={node.id} 
                      node={node} 
                      level={0} 
                      activeId={activeFolderId}
                      onSelect={setActiveFolder}
                    />
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-10">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Quick Folders Section */}
            {!searchQuery && folders.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Folders</h3>
                  <button className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <FolderPlus size={14} />
                    New Folder
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {folders.map(folder => (
                    <motion.button
                      key={folder.id}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveFolder(folder.id)}
                      className="group flex flex-col items-start gap-4 p-5 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all hover:bg-slate-800/50 text-left relative overflow-hidden"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-500">
                        <Folder size={24} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-bold block truncate w-full text-white">{folder.title || 'Untitled Folder'}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{folder.children?.length || 0} items</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Bookmarks Section */}
            <section className="space-y-6 pb-24">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                  {searchQuery ? `Search Results (${bookmarks.length})` : 'Bookmarks'}
                </h3>
              </div>

              {bookmarks.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={bookmarks.map(b => b.id)}
                    strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
                  >
                    <div className={viewMode === 'grid' 
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                      : "flex flex-col gap-3"
                    }>
                      <AnimatePresence mode="popLayout">
                        {bookmarks.map((bookmark) => (
                          <BookmarkCard 
                            key={bookmark.id} 
                            bookmark={bookmark} 
                            viewMode={viewMode}
                            isBlurred={isBlurred}
                            onRemove={() => removeBookmark(bookmark.id)}
                            faviconUrl={getFaviconUrl(bookmark.url!)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5">
                    <Bookmark size={48} className="text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-[0.2em]">No bookmarks found</p>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">This folder is empty or no search results</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

const FolderTreeItem = ({ node, level, activeId, onSelect }: { 
  node: BookmarkNode, 
  level: number, 
  activeId: string | null,
  onSelect: (id: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = !node.url;
  const isActive = activeId === node.id;

  if (!isFolder) return null;

  return (
    <div className="space-y-1">
      <div 
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        className={`group flex items-center gap-3 py-2 pr-4 rounded-xl transition-all cursor-pointer ${
          isActive ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
        onClick={() => {
          onSelect(node.id);
          setIsOpen(!isOpen);
        }}
      >
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
          <ChevronRight size={14} className={isActive ? 'text-slate-950/50' : 'text-slate-600'} />
        </div>
        <Folder size={16} className={isActive ? 'text-slate-950' : 'text-amber-500/60 group-hover:text-amber-500 transition-colors'} />
        <span className="text-[11px] font-bold uppercase tracking-wider truncate flex-1">{node.title || 'Untitled'}</span>
      </div>
      
      {isOpen && node.children && (
        <div className="space-y-1">
          {node.children.map(child => (
            <FolderTreeItem 
              key={child.id} 
              node={child} 
              level={level + 1} 
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BookmarkCard = ({ bookmark, viewMode, isBlurred, onRemove, faviconUrl }: { 
  bookmark: BookmarkNode, 
  viewMode: 'grid' | 'list',
  isBlurred: boolean,
  onRemove: () => void,
  faviconUrl: string
}) => {
  const handleClick = () => {
    if (bookmark.url) window.location.href = bookmark.url;
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        onClick={handleClick}
        className="group flex items-center gap-5 p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 hover:bg-slate-800/80 transition-all cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          {faviconUrl ? (
            <img src={faviconUrl} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <Bookmark size={18} className="text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold text-white truncate ${isBlurred ? 'privacy-blur' : ''}`}>{bookmark.title}</h4>
          <p className="text-[10px] text-slate-500 truncate font-medium">{bookmark.url}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-2">
          <button className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors">
            <Edit2 size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={handleClick}
      className="group relative flex flex-col p-6 rounded-[2rem] bg-slate-900/50 border border-white/5 hover:border-white/10 hover:bg-slate-800/50 transition-all cursor-pointer h-full overflow-hidden shadow-2xl"
    >
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-2 bg-slate-950/80 backdrop-blur-md rounded-xl text-slate-400 hover:text-red-400 border border-white/5"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-6 h-full flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
          {faviconUrl ? (
            <img src={faviconUrl} alt="" className="w-7 h-7 object-contain" />
          ) : (
            <Bookmark size={24} className="text-slate-500" />
          )}
        </div>
        
        <div className="space-y-2 flex-1">
          <h4 className={`text-lg font-black text-white leading-tight line-clamp-2 ${isBlurred ? 'privacy-blur' : ''}`}>
            {bookmark.title || 'Untitled Bookmark'}
          </h4>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
            {new URL(bookmark.url || 'http://unknown').hostname}
          </p>
        </div>

        <div className="pt-4 mt-auto flex items-center justify-between border-t border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Open Bookmark</span>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-white" />
        </div>
      </div>
    </motion.div>
  );
};
