import React, { useState } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { Plus, X } from 'lucide-react';

export const QuickLinks: React.FC = () => {
  const { quickLinks, addQuickLink, removeQuickLink, theme } = useWidgetStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const themeClass = theme === 'glass' ? 'theme-glass' : 'theme-zen';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    
    // Add https:// if missing
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
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="flex flex-wrap justify-center gap-4">
        {quickLinks.map((link) => (
          <div key={link.id} className="relative group">
            <a
              href={link.url}
              className={`flex flex-col items-center justify-center w-24 h-24 ${themeClass} hover:bg-theme-hover hover:shadow-xl hover:-translate-y-1`}
            >
              <div className="w-10 h-10 mb-2 rounded-full bg-theme-glass flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://s2.googleusercontent.com/s2/favicons?domain=${getHostname(link.url)}&sz=64`} 
                  alt={link.title}
                  className="w-6 h-6"
                  onError={(e) => {
                    // Fallback to text if favicon fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-theme-text text-sm font-bold">${link.title.charAt(0).toUpperCase()}</span>`;
                  }}
                />
              </div>
              <span className="text-theme-text text-[10px] font-medium truncate w-full text-center px-2 opacity-80">
                {link.title}
              </span>
            </a>
            <button
              onClick={() => removeQuickLink(link.id)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:scale-110"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {isAdding ? (
          <div className={`flex flex-col items-center justify-center w-48 h-24 ${themeClass} p-3 shadow-lg`}>
            <form onSubmit={handleAdd} className="flex flex-col gap-2 w-full">
              <input
                type="text"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-theme-glass text-theme-text text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-theme-border w-full"
                autoFocus
              />
              <input
                type="text"
                placeholder="URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="bg-theme-glass text-theme-text text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-theme-border w-full"
              />
              <div className="flex justify-between mt-1">
                <button type="button" onClick={() => setIsAdding(false)} className="text-theme-muted hover:text-theme-text text-xs">
                  Cancel
                </button>
                <button type="submit" className="text-theme-text font-medium text-xs">
                  Save
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center w-24 h-24 bg-theme-glass backdrop-blur-sm rounded-2xl border border-theme-border border-dashed hover:bg-theme-hover hover:border-solid transition-all duration-300"
          >
            <Plus size={24} className="text-theme-muted mb-1" />
            <span className="text-theme-muted text-xs font-medium">Add Link</span>
          </button>
        )}
      </div>
    </div>
  );
};
