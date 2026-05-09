import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardDrive, 
  Image as ImageIcon, 
  Video, 
  Search, 
  Grid, 
  List as ListIcon, 
  FolderPlus,
  RefreshCw,
  ExternalLink,
  MoreVertical,
  X,
  Play,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useDriveStore, DriveFile } from '../../store/driveStore';

export const DriveView: React.FC = () => {
  const { 
    rootHandle, 
    files, 
    isIndexing, 
    error, 
    setRootHandle, 
    indexFolder, 
    clearDrive,
    init
  } = useDriveStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    init();
  }, [init]);

  // Handle folder picking
  const handleConnectFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setRootHandle(handle);
    } catch (err) {
      console.error('User cancelled folder picker', err);
    }
  };

  // Generate previews for visible items
  useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews: Record<string, string> = { ...previews };
      let changed = false;

      for (const file of files) {
        if (!newPreviews[file.id]) {
          try {
            if (file.handle.kind === 'file') {
              const fileData = await (file.handle as FileSystemFileHandle).getFile();
              // Only create object URLs for images for now to avoid memory pressure
              if (fileData.type.startsWith('image/')) {
                newPreviews[file.id] = URL.createObjectURL(fileData);
                changed = true;
              }
            }
          } catch (err) {
            console.error(`Failed to create preview for ${file.name}`, err);
          }
        }
      }

      if (changed) {
        setPreviews(newPreviews);
      }
    };

    if (files.length > 0) {
      generatePreviews();
    }
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'image' && file.type?.startsWith('image/')) ||
                           (filterType === 'video' && file.type?.startsWith('video/'));
      return matchesSearch && matchesFilter;
    });
  }, [files, searchQuery, filterType]);

  const handleOpenFile = async (file: DriveFile) => {
    try {
      if (file.handle.kind === 'file') {
        const fileData = await (file.handle as FileSystemFileHandle).getFile();
        const url = URL.createObjectURL(fileData);
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Failed to open file', err);
    }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (!rootHandle) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full p-12 bg-theme-glass rounded-[2rem] backdrop-blur-xl border border-theme-border flex flex-col items-center gap-8 text-center shadow-2xl"
        >
          <div className="w-24 h-24 bg-theme-hover rounded-full flex items-center justify-center text-theme-text shadow-inner">
            <HardDrive size={48} className="opacity-80" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-theme-text tracking-tight">Local Drive</h2>
            <p className="text-theme-muted leading-relaxed">
              Connect a local folder to index your personal photos and videos. Your files stay private and never leave your machine.
            </p>
          </div>
          <button 
            onClick={handleConnectFolder}
            className="group flex items-center gap-3 px-8 py-4 bg-theme-text text-theme-bg rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <FolderPlus size={20} />
            Connect Folder
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6 lg:p-10 gap-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-theme-muted text-sm mb-2">
            <HardDrive size={14} />
            <span className="opacity-80">Drive</span>
            <ChevronRight size={14} />
            <span className="text-theme-text font-medium">{rootHandle.name}</span>
          </div>
          <h1 className="text-4xl font-bold text-theme-text tracking-tight">Gallery</h1>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-2 font-medium"
            >
              {error}
            </motion.p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-theme-text transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-12 pr-4 py-3 bg-theme-glass border border-theme-border rounded-2xl focus:outline-none focus:border-theme-text/30 text-theme-text placeholder:text-theme-muted transition-all"
            />
          </div>
          <div className="flex p-1 bg-theme-glass border border-theme-border rounded-2xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-theme-hover text-theme-text shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-theme-hover text-theme-text shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
          <button 
            onClick={indexFolder}
            className="p-3 bg-theme-glass border border-theme-border rounded-2xl text-theme-muted hover:text-theme-text transition-all hover:rotate-180 duration-500"
            title="Refresh items"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={clearDrive}
            className="p-3 bg-theme-glass border border-theme-border rounded-2xl text-theme-muted hover:text-red-400 transition-all"
            title="Disconnect Drive"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'image', 'video'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-6 py-2 rounded-full text-sm font-medium border transition-all ${
              filterType === type 
                ? 'bg-theme-text text-theme-bg border-theme-text' 
                : 'bg-theme-glass text-theme-muted border-theme-border hover:border-theme-text/30'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isIndexing ? (
          <div className="w-full h-64 flex flex-col items-center justify-center gap-4 text-theme-muted">
            <Loader2 size={40} className="animate-spin" />
            <p className="font-medium">Indexing folder contents...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="w-full h-64 flex flex-col items-center justify-center gap-4 text-theme-muted border-2 border-dashed border-theme-border rounded-[2rem]">
            <Search size={40} className="opacity-20" />
            <p className="font-medium opacity-60">No matching items found</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              : "flex flex-col gap-3"
            }
          >
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                variants={itemVariants}
                layout
                onClick={() => setSelectedFile(file)}
                className={`group relative overflow-hidden transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? "aspect-square rounded-[1.5rem] bg-theme-glass border border-theme-border hover:scale-[1.02] hover:shadow-xl active:scale-95"
                    : "flex items-center gap-4 p-4 rounded-2xl bg-theme-glass border border-theme-border hover:bg-theme-hover transition-colors"
                }`}
              >
                {/* Thumbnail */}
                <div className={viewMode === 'grid' ? "w-full h-full" : "w-16 h-16 rounded-xl overflow-hidden shrink-0"}>
                  {previews[file.id] ? (
                    <img 
                      src={previews[file.id]} 
                      alt={file.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-theme-hover text-theme-muted">
                      {file.type?.startsWith('video/') ? <Video size={viewMode === 'grid' ? 32 : 24} /> : <ImageIcon size={viewMode === 'grid' ? 32 : 24} />}
                    </div>
                  )}
                  
                  {file.type?.startsWith('video/') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                        <Play size={20} fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Overlay / List Text */}
                {viewMode === 'grid' ? (
                  <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white font-medium text-sm truncate mb-1">{file.name}</p>
                    <div className="flex items-center justify-between text-white/70 text-[10px]">
                      <span>{((file.size || 0) / 1024 / 1024).toFixed(1)} MB</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFile(file);
                        }}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <h3 className="text-theme-text font-medium truncate">{file.name}</h3>
                    <div className="flex items-center gap-3 text-theme-muted text-xs mt-1">
                      <span className="uppercase">{file.type?.split('/')[1] || 'file'}</span>
                      <span className="w-1 h-1 rounded-full bg-theme-muted opacity-30" />
                      <span>{((file.size || 0) / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="flex items-center gap-2 pr-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFile(file);
                      }}
                      className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-xl transition-all"
                    >
                      <ExternalLink size={20} />
                    </button>
                    <button className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-xl transition-all">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFile(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm pointer-events-auto"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl max-h-full bg-theme-bg rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
            >
              <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-3 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center bg-black/20 overflow-hidden min-h-0">
                {selectedFile.type?.startsWith('image/') ? (
                  <img 
                    src={previews[selectedFile.id]} 
                    alt={selectedFile.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-6 text-theme-muted">
                    <Video size={80} className="opacity-20" />
                    <p className="text-xl font-medium">Video preview coming soon</p>
                    <button 
                      onClick={() => handleOpenFile(selectedFile)}
                      className="px-8 py-3 bg-white text-black rounded-2xl font-bold hover:scale-105 transition-transform"
                    >
                      Open Original
                    </button>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-theme-border flex items-center justify-between gap-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-theme-text truncate">{selectedFile.name}</h2>
                  <p className="text-theme-muted text-sm mt-1 uppercase tracking-wider">
                    {selectedFile.type} • {((selectedFile.size || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleOpenFile(selectedFile)}
                    className="flex items-center gap-2 px-6 py-3 bg-theme-hover text-theme-text rounded-2xl font-bold hover:bg-theme-glass transition-colors"
                  >
                    <ExternalLink size={20} />
                    Open Original
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
