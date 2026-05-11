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
  ChevronLeft,
  LayoutGrid
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
      <div className="h-screen w-full flex items-center justify-center relative z-20">
        <Loader2 size={48} className="text-theme-text animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative z-10 select-none">
      {/* Premium Header */}
      <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 border-b border-theme-border/20 backdrop-blur-3xl bg-theme-glass/80 shadow-2xl relative z-30">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 hover:bg-theme-bg-accent/10 rounded-2xl text-theme-text transition-all active:scale-95 group"
          >
            {isSidebarOpen ? <ChevronLeft size={22} /> : <LayoutGrid size={22} className="group-hover:rotate-90 transition-transform duration-500" />}
          </button>
          
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-theme-text tracking-tighter">Bookmarks</h1>
            <div className="h-6 w-px bg-theme-border/20" />
            <div className="flex items-center gap-2 overflow-hidden">
              {breadcrumbs.map((node, i) => (
                <React.Fragment key={node.id}>
                  {i > 0 && <ChevronRight size={14} className="text-theme-muted/40 flex-shrink-0" />}
                  <button 
                    onClick={() => setActiveFolder(node.id)}
                    className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all hover:scale-105 ${i === breadcrumbs.length - 1 ? 'text-theme-bg-accent' : 'text-theme-muted hover:text-theme-text'}`}
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
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-theme-bg-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search bookmarks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-theme-bg-accent/5 border border-theme-border/30 rounded-2xl py-3 pl-12 pr-6 text-sm text-theme-text outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all font-bold placeholder-theme-muted/50"
            />
          </div>
          
          <div className="flex items-center bg-theme-bg-accent/5 p-1 rounded-xl border border-theme-border/30">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-theme-bg-accent text-theme-contrast shadow-lg shadow-theme-bg-accent/20' : 'text-theme-muted hover:text-theme-text'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-theme-bg-accent text-theme-contrast shadow-lg shadow-theme-bg-accent/20' : 'text-theme-muted hover:text-theme-text'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
          
          <div className="h-6 w-px bg-theme-border/20 mx-2" />
          
          <button className="flex items-center gap-3 px-6 py-2.5 bg-theme-bg-accent text-theme-contrast hover:scale-[1.02] active:scale-95 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-theme-bg-accent/30">
            <Plus size={18} />
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
              className="flex-shrink-0 flex flex-col border-r border-theme-border/20 bg-theme-glass/40 backdrop-blur-3xl overflow-hidden relative z-20 shadow-2xl"
            >
              <div className="p-6 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <h2 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] px-2">Tree Explorer</h2>
                  <div className="space-y-1">
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
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-12 bg-theme-bg/10">
          <div className="max-w-7xl mx-auto space-y-16">
            
            {/* Folder Grid Section */}
            {!searchQuery && folders.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] flex items-center gap-2">
                    <Folder size={14} className="text-theme-bg-accent" /> Folders
                  </h3>
                  <button className="text-[9px] font-black text-theme-bg-accent hover:scale-105 uppercase tracking-[0.2em] flex items-center gap-2 transition-all">
                    <FolderPlus size={14} />
                    New Folder
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {folders.map(folder => (
                    <motion.button
                      key={folder.id}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveFolder(folder.id)}
                      className="group flex flex-col items-start gap-6 p-6 rounded-[32px] theme-glass border border-theme-border/20 hover:border-theme-bg-accent/30 transition-all hover:bg-theme-bg-accent/5 text-left relative overflow-hidden shadow-xl"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-theme-bg-accent/10 flex items-center justify-center text-theme-bg-accent group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                        <Folder size={28} />
                      </div>
                      <div className="space-y-1.5 w-full">
                        <span className="text-sm font-black block truncate text-theme-text uppercase tracking-tight">{folder.title || 'Untitled'}</span>
                        <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] opacity-60">{folder.children?.length || 0} items</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Bookmarks Grid Section */}
            <section className="space-y-8 pb-32">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] flex items-center gap-2">
                  <Bookmark size={14} className="text-theme-bg-accent" />
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
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
                      : "flex flex-col gap-4"
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
                <div className="py-40 flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                  <div className="p-12 theme-glass rounded-[4rem] border border-theme-border/10">
                    <Bookmark size={64} className="text-theme-muted" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-black uppercase tracking-[0.3em] text-theme-text">Void</p>
                    <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">No results found in this sector</p>
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
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        className={`group flex items-center gap-4 py-3 pr-4 rounded-2xl transition-all cursor-pointer ${
          isActive ? 'bg-theme-bg-accent text-theme-contrast shadow-xl shadow-theme-bg-accent/20' : 'text-theme-muted hover:bg-theme-bg-accent/10 hover:text-theme-text'
        }`}
        onClick={() => {
          onSelect(node.id);
          setIsOpen(!isOpen);
        }}
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
          <ChevronRight size={14} className={isActive ? 'text-theme-contrast/50' : 'text-theme-muted/40'} />
        </div>
        <Folder size={18} className={isActive ? 'text-theme-contrast' : 'text-theme-bg-accent/60 group-hover:text-theme-bg-accent transition-colors'} />
        <span className="text-xs font-black uppercase tracking-tight truncate flex-1">{node.title || 'Untitled'}</span>
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
        className="group flex items-center gap-6 p-5 rounded-3xl theme-glass border border-theme-border/20 hover:border-theme-bg-accent/30 hover:bg-theme-bg-accent/5 transition-all cursor-pointer shadow-lg"
      >
        <div className="w-12 h-12 rounded-2xl bg-theme-bg-accent/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
          {faviconUrl ? (
            <img src={faviconUrl} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <Bookmark size={20} className="text-theme-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-black text-theme-text truncate uppercase tracking-tight ${isBlurred ? 'privacy-blur' : ''}`}>{bookmark.title}</h4>
          <p className="text-[10px] text-theme-muted truncate font-black uppercase tracking-widest opacity-40">{bookmark.url}</p>
        </div>
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity px-4">
          <button className="p-2.5 hover:bg-theme-bg-accent/10 rounded-xl text-theme-muted hover:text-theme-text transition-colors">
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-2.5 hover:bg-red-500/10 rounded-xl text-theme-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
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
      className="group relative flex flex-col p-8 rounded-[40px] theme-glass border border-theme-border/20 hover:border-theme-bg-accent/30 hover:bg-theme-bg-accent/5 transition-all cursor-pointer h-full overflow-hidden shadow-2xl"
    >
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-3 bg-theme-glass backdrop-blur-xl rounded-2xl text-theme-muted hover:text-red-400 border border-theme-border/20 shadow-xl"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-8 h-full flex flex-col">
        <div className="w-16 h-16 rounded-3xl bg-theme-bg-accent/10 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
          {faviconUrl ? (
            <img src={faviconUrl} alt="" className="w-8 h-8 object-contain" />
          ) : (
            <Bookmark size={28} className="text-theme-bg-accent" />
          )}
        </div>
        
        <div className="space-y-3 flex-1">
          <h4 className={`text-xl font-black text-theme-text leading-tight line-clamp-2 uppercase tracking-tighter ${isBlurred ? 'privacy-blur' : ''}`}>
            {bookmark.title || 'Untitled Bookmark'}
          </h4>
          <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] truncate opacity-40">
            {new URL(bookmark.url || 'http://unknown').hostname}
          </p>
        </div>

        <div className="pt-6 mt-auto flex items-center justify-between border-t border-theme-border/10 opacity-30 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">Explore Node</span>
          <ExternalLink size={16} className="text-theme-muted group-hover:text-theme-bg-accent transition-colors" />
        </div>
      </div>
    </motion.div>
  );
};
