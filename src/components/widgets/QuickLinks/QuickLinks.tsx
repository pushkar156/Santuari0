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
              className={`flex flex-col items-center justify-center w-24 h-24 ${themeClass} hover:bg-white/20 hover:shadow-xl hover:-translate-y-1`}
            >
              <div className="w-10 h-10 mb-2 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://s2.googleusercontent.com/s2/favicons?domain=${getHostname(link.url)}&sz=64`} 
                  alt={link.title}
                  className="w-6 h-6"
                  onError={(e) => {
                    // Fallback to text if favicon fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-lg font-bold">${link.title.charAt(0).toUpperCase()}</span>`;
                  }}
                />
              </div>
              <span className="text-white/80 text-xs font-medium truncate w-full text-center px-2">
                {link.title}
              </span>
            </a>
            <button
              onClick={() => removeQuickLink(link.id)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
            >
              <X size={14} />
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
                className="bg-black/20 text-white text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-white/50 w-full"
                autoFocus
              />
              <input
                type="text"
                placeholder="URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="bg-black/20 text-white text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-white/50 w-full"
              />
              <div className="flex justify-between mt-1">
                <button type="button" onClick={() => setIsAdding(false)} className="text-white/60 hover:text-white text-xs">
                  Cancel
                </button>
                <button type="submit" className="text-white font-medium text-xs">
                  Save
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 border-dashed hover:bg-white/10 hover:border-solid transition-all duration-300"
          >
            <Plus size={24} className="text-white/50 mb-1" />
            <span className="text-white/50 text-xs font-medium">Add Link</span>
          </button>
        )}
      </div>
    </div>
  );
};
