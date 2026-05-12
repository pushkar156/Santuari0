import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWidgetStore, QuickLink } from '../../../store/widgetStore';
import { X, Plus } from 'lucide-react';

export const QuickLinks: React.FC = () => {
  const { quickLinks, addQuickLink, removeQuickLink } = useWidgetStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    
    let finalUrl = newUrl;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    addQuickLink({ title: newTitle, url: finalUrl });
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-wrap justify-center items-center gap-8 max-w-4xl py-6">
        {quickLinks.map((link: QuickLink) => (
          <motion.div 
            key={link.id} 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative group"
          >
            <a
              href={link.url}
              className="flex flex-col items-center justify-center w-28 h-28 rounded-[2.5rem] theme-glass border border-theme-border/10 hover:border-theme-border/30 hover:bg-theme-hover/20 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-lg hover:shadow-2xl"
            >
              <div className="w-14 h-14 mb-3 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                <img 
                  src={`https://s2.googleusercontent.com/s2/favicons?domain=${getHostname(link.url)}&sz=128`} 
                  alt={link.title}
                  className="w-8 h-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-700"
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-theme-text text-xl font-bold opacity-80">${link.title.charAt(0).toUpperCase()}</span>`;
                    }
                  }}
                />
              </div>
              <span className="text-theme-text text-[9px] font-black uppercase tracking-[0.2em] truncate w-full text-center px-3 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                {link.title}
              </span>
            </a>
            
            <button
              onClick={() => removeQuickLink(link.id)}
              className="absolute -top-1 -right-1 bg-black text-white dark:bg-white dark:text-black rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:scale-110 z-20"
              title="Remove link"
            >
              <X size={12} strokeWidth={3} />
            </button>
          </motion.div>
        ))}

        <button
          onClick={() => setIsAdding(true)}
          className="flex flex-col items-center justify-center w-28 h-28 bg-white/5 backdrop-blur-md rounded-[2.5rem] border-2 border-theme-border/10 border-dashed hover:bg-white/10 hover:border-theme-border/40 transition-all duration-500 group active:scale-95"
        >
          <div className="p-3 bg-white/5 rounded-xl mb-2 group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
            <Plus size={20} className="text-theme-text opacity-60" />
          </div>
          <span className="text-theme-text text-[9px] font-black uppercase tracking-[0.2em] opacity-30 group-hover:opacity-80 transition-opacity">Add</span>
        </button>
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm theme-glass backdrop-blur-3xl p-8 rounded-[2.5rem] border border-theme-border shadow-2xl"
            >
              <h3 className="text-xl font-bold text-theme-text mb-6 tracking-tight">New Shortcut</h3>

              <form onSubmit={handleAdd} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-theme-muted ml-1">Label</label>
                  <input
                    type="text"
                    placeholder="e.g. GitHub"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-theme-text/5 border border-theme-border/50 rounded-2xl px-5 py-4 text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-text transition-all"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-theme-muted ml-1">URL</label>
                  <input
                    type="text"
                    placeholder="github.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-theme-text/5 border border-theme-border/50 rounded-2xl px-5 py-4 text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-text transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-theme-muted hover:text-theme-text transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-theme-text text-theme-contrast py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
