import React, { useState } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { Search } from 'lucide-react';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const { settings, updateSearchEngine, theme } = useWidgetStore();
  const defaultEngine = settings.search.defaultEngine;

  const themeClass = theme === 'glass' 
    ? 'bg-white/10 backdrop-blur-md border border-white/20' 
    : 'bg-white/5 border border-transparent focus:bg-white/10';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    let url = '';
    switch (defaultEngine) {
      case 'perplexity':
        url = `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`;
        break;
      case 'google':
      default:
        url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        break;
    }
    
    // Open in current tab (or window.open for new tab)
    window.location.href = url;
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <form onSubmit={handleSearch} className="w-full relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white/80 transition-colors">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${defaultEngine.charAt(0).toUpperCase() + defaultEngine.slice(1)}...`}
          className={`w-full ${themeClass} rounded-full py-4 pl-12 pr-4 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 shadow-lg text-lg`}
        />
      </form>
      
      {/* Engine Selector - Toggle */}
      <div className="mt-4 flex bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10 opacity-40 hover:opacity-100 transition-opacity duration-300">
        <button 
          type="button"
          onClick={() => updateSearchEngine('google')}
          className={`px-4 py-1.5 rounded-full text-xs transition-all duration-300 ${defaultEngine !== 'perplexity' ? 'bg-white/20 text-white font-bold shadow-md' : 'text-white/50 hover:text-white/80'}`}
        >
          Google
        </button>
        <button 
          type="button"
          onClick={() => updateSearchEngine('perplexity')}
          className={`px-4 py-1.5 rounded-full text-xs transition-all duration-300 ${defaultEngine === 'perplexity' ? 'bg-white/20 text-white font-bold shadow-md' : 'text-white/50 hover:text-white/80'}`}
        >
          Perplexity
        </button>
      </div>
    </div>
  );
};
