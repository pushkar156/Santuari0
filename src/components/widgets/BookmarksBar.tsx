import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, MoreHorizontal } from 'lucide-react';
import { useBookmarksStore, BookmarkNode } from '../../store/bookmarksStore';
import { useWidgetStore } from '../../store/widgetStore';

export const BookmarksBar: React.FC = () => {
  const { tree, fetchTree, setActiveFolder } = useBookmarksStore();
  const { isBlurred } = useWidgetStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Use the "Bookmarks Bar" folder (usually the second child of root in Chrome)
  const barItems = useMemo(() => {
    const root = tree[0];
    if (!root || !root.children) return [];
    
    // Look for "Bookmarks Bar" or "Other Bookmarks"
    const bar = root.children.find((c: BookmarkNode) => c.title.toLowerCase().includes('bar')) || root.children[0];
    return bar?.children || [];
  }, [tree]);

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(urlObj.origin)}&size=32`;
    } catch {
      return '';
    }
  };

  if (barItems.length === 0) return null;

  return (
    <div className="w-full flex justify-center mb-8">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="theme-glass flex items-center gap-1 p-1.5 rounded-2xl border border-theme-border/20 shadow-2xl overflow-x-auto no-scrollbar max-w-5xl"
      >
        {barItems.slice(0, 10).map((item: BookmarkNode) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative"
          >
            {item.url ? (
              <a
                href={item.url}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-theme-bg-accent/10 transition-all duration-300 group"
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={getFaviconUrl(item.url)} 
                    className={`w-4 h-4 object-contain group-hover:scale-110 transition-transform ${isBlurred ? 'privacy-blur' : ''}`} 
                    alt="" 
                  />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest text-theme-muted group-hover:text-theme-text transition-colors whitespace-nowrap ${isBlurred ? 'privacy-blur' : ''}`}>
                  {item.title}
                </span>
              </a>
            ) : (
              <button
                onClick={() => setActiveFolder(item.id)}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-theme-bg-accent/10 transition-all duration-300 group"
              >
                <Folder size={14} className="text-theme-bg-accent opacity-60 group-hover:opacity-100" />
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted group-hover:text-theme-text transition-colors whitespace-nowrap">
                  {item.title}
                </span>
              </button>
            )}

            <AnimatePresence>
              {hoveredId === item.id && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-theme-bg-accent/5 rounded-xl -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
          </div>
        ))}
        
        <div className="h-4 w-px bg-theme-border/20 mx-2" />
        
        <button className="p-2 hover:bg-theme-bg-accent/10 rounded-xl text-theme-muted hover:text-theme-text transition-all">
          <MoreHorizontal size={14} />
        </button>
      </motion.div>
    </div>
  );
};
