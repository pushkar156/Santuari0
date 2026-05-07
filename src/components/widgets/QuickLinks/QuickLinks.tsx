import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWidgetStore, QuickLink } from '../../../store/widgetStore';
import { X, Plus } from 'lucide-react';

export const QuickLinks: React.FC = () => {
  const { quickLinks, addQuickLink, removeQuickLink, theme } = useWidgetStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const themeClass = theme === 'glass' ? 'theme-glass' : 'theme-zen';

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
    <div className="w-full mt-4">
      <div className="flex flex-nowrap justify-center items-center gap-6 overflow-x-auto pb-6 pt-2 no-scrollbar scroll-smooth">
        {quickLinks.map((link: QuickLink) => (
          <div key={link.id} className="relative group perspective-1000 flex-shrink-0">
            <a
              href={link.url}
              className={`flex flex-col items-center justify-center w-28 h-28 rounded-3xl ${themeClass} backdrop-blur-xl border border-theme-border/30 hover:border-theme-border hover:bg-theme-hover hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-500 ease-out`}
            >
              <div className="w-14 h-14 mb-3 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform duration-500">
                <img 
                  src={`https://s2.googleusercontent.com/s2/favicons?domain=${getHostname(link.url)}&sz=128`} 
                  alt={link.title}
                  className="w-8 h-8 object-contain drop-shadow-md"
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-theme-text text-xl font-bold">${link.title.charAt(0).toUpperCase()}</span>`;
                    }
                  }}
                />
              </div>
              <span className="text-theme-text text-[11px] font-semibold truncate w-full text-center px-3 opacity-70 group-hover:opacity-100 transition-opacity duration-300 tracking-tight">
                {link.title}
              </span>
            </a>
            
            <button
              onClick={() => removeQuickLink(link.id)}
              className="absolute -top-2 -right-2 bg-red-500/90 text-white rounded-xl p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-red-600 hover:scale-125 z-20"
              title="Remove link"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        ))}

        <button
          onClick={() => setIsAdding(true)}
          className="flex flex-col items-center justify-center w-28 h-28 bg-white/5 backdrop-blur-sm rounded-3xl border-2 border-theme-border/20 border-dashed hover:bg-white/10 hover:border-theme-border/50 hover:border-solid transition-all duration-500 group flex-shrink-0"
        >
          <div className="p-3 bg-theme-glass rounded-2xl mb-2 group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
            <Plus size={20} className="text-theme-muted group-hover:text-theme-text" />
          </div>
          <span className="text-theme-muted text-[9px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Add Link</span>
        </button>
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md ${themeClass} backdrop-blur-2xl p-8 rounded-[2.5rem] border border-theme-border shadow-[0_32px_64px_rgba(0,0,0,0.5)]`}
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-6 right-6 text-theme-muted hover:text-theme-text transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-theme-text mb-2">New Quick Link</h3>
              <p className="text-theme-muted text-sm mb-8">Add a shortcut to your favorite website.</p>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-theme-muted ml-1">Site Title</label>
                  <input
                    type="text"
                    placeholder="e.g. GitHub"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/5 border border-theme-border/50 rounded-2xl px-5 py-4 text-theme-text placeholder:text-theme-muted/30 focus:outline-none focus:ring-2 focus:ring-theme-border focus:bg-white/10 transition-all"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-theme-muted ml-1">Link URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-white/5 border border-theme-border/50 rounded-2xl px-5 py-4 text-theme-text placeholder:text-theme-muted/30 focus:outline-none focus:ring-2 focus:ring-theme-border focus:bg-white/10 transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-theme-muted hover:text-theme-text hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-theme-text text-theme-contrast py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Save Link
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
