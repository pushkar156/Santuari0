import { useWidgetStore } from '../../store/widgetStore';
import { useViewStore } from '../../store/viewStore';
import { 
  X, 
  Image as ImageIcon, 
  Trash2,
  Upload,
  Edit2,
  Palette
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import defaultBg from '../../assets/default.jpg';
import ImageEditor from '../ui/ImageEditor';

import { motion, AnimatePresence } from 'framer-motion';

export const BackgroundSettings = ({ onClose }: { onClose: () => void }) => {
  const { 
    customBackground, setCustomBackground,
    recentBackgrounds, removeRecentBackground
  } = useWidgetStore();

  const { setActiveView } = useViewStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const mode = useWidgetStore(state => state.mode);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveView('home');
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const estimatedSize = (dataUrl.length * 3) / 4;
        if (estimatedSize > 4 * 1024 * 1024) {
          setCustomBackground(canvas.toDataURL('image/jpeg', 0.6));
        } else {
          setCustomBackground(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 md:p-12">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <motion.div 
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-4xl bg-theme-glass/40 backdrop-blur-3xl border border-theme-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-theme-border shrink-0">
          <h2 className="text-3xl font-bold flex items-center gap-4 text-theme-text">
            <Palette size={32} className="text-theme-muted" /> Backgrounds
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-theme-hover text-theme-muted hover:text-theme-text transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Main Preview Card */}
            <div 
              className="w-full aspect-video bg-theme-glass border border-theme-border rounded-[2rem] overflow-hidden relative shadow-2xl group mx-auto max-w-xl"
            >
              {customBackground ? (
                <img src={customBackground} alt="Current background" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full relative flex flex-col items-center justify-center">
                  <img src={defaultBg} alt="Default background" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  <div className="relative z-10 flex flex-col items-center">
                    <ImageIcon size={48} className="text-theme-muted/40 mb-4" />
                    <span className="text-theme-muted font-bold text-lg drop-shadow-lg text-center">Using Default Background</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none" />
              
              {/* Edit Controls Overlay */}
              <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingImage(customBackground || defaultBg)}
                  className="p-3 bg-white/90 hover:bg-white text-black rounded-full shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center gap-2 font-bold px-5"
                >
                  <Edit2 size={18} /> Edit & Crop
                </button>
              </div>
            </div>

            {/* Recent Wallpapers Row */}
            <div className="w-full space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-muted/50">Recent Wallpapers</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {/* New Upload Button */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video bg-theme-glass border border-theme-border rounded-2xl flex flex-col items-center justify-center hover:bg-theme-hover transition-all group overflow-hidden"
                  title="Upload new background"
                >
                  <div className="p-3 rounded-full bg-theme-text/10 group-hover:bg-theme-text/20 transition-colors">
                    <Upload size={20} className="text-theme-text" />
                  </div>
                </button>

                {/* Default Wallpaper Tile */}
                <div className="relative group aspect-video">
                  <button 
                    onClick={() => setCustomBackground(null)}
                    className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all ${customBackground === null ? 'border-theme-text scale-95 shadow-inner' : 'border-transparent hover:border-theme-border shadow-sm'}`}
                  >
                    <img src={defaultBg} alt="Default background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Default</span>
                    </div>
                  </button>
                </div>

                {/* Recent Items */}
                {recentBackgrounds.map((bg, index) => (
                  <div key={index} className="relative group aspect-video">
                    <button 
                      onClick={() => setCustomBackground(bg)}
                      className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all ${customBackground === bg ? 'border-theme-text scale-95 shadow-inner' : 'border-transparent hover:border-theme-border shadow-sm'}`}
                    >
                      <img src={bg} alt={`Recent ${index}`} className="w-full h-full object-cover" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentBackground(bg);
                        if (customBackground === bg) setCustomBackground(null);
                      }}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
            
            {customBackground && (
              <div className="flex justify-center">
                <button 
                  onClick={() => setCustomBackground(null)}
                  className="flex items-center gap-2 text-red-500/70 hover:text-red-500 transition-colors text-sm font-bold"
                >
                  <Trash2 size={16} /> Reset to Default
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-theme-border flex justify-end shrink-0">
          <button 
            onClick={handleClose}
            className={`px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 hover:opacity-90 ${
              mode === 'light' 
                ? 'bg-black text-white hover:shadow-black/20' 
                : 'bg-white text-black hover:shadow-white/20'
            }`}
          >
            Done
          </button>
        </div>
      </motion.div>

      {/* Image Editor Modal */}
      <AnimatePresence>
        {editingImage && (
          <ImageEditor 
            key="image-editor"
            imageSrc={editingImage}
            onSave={(edited) => {
              setCustomBackground(edited);
              setEditingImage(null);
            }}
            onCancel={() => setEditingImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
