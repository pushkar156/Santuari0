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
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    init();
  }, [init]);

  const previewsRef = React.useRef<Record<string, string>>({});

  // Clean up Object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Update ref when previews change
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Handle folder picking
  const handleConnectFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
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
    let result = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'image' && file.type?.startsWith('image/')) ||
                           (filterType === 'video' && file.type?.startsWith('video/'));
      return matchesSearch && matchesFilter;
    });

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'date') return (b.lastModified || 0) - (a.lastModified || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return 0;
    });
  }, [files, searchQuery, filterType, sortBy]);

  const handlePreviewFile = async (file: DriveFile) => {
    try {
      if (file.handle.kind === 'file') {
        const fileData = await (file.handle as FileSystemFileHandle).getFile();
        const url = URL.createObjectURL(fileData);
        setSelectedFile(file);
        setSelectedFileUrl(url);
      }
    } catch (err) {
      console.error('Failed to preview file', err);
    }
  };

  const handleClosePreview = () => {
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }
    setSelectedFile(null);
    setSelectedFileUrl(null);
  };

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
            <h2 className="text-3xl font-bold text-theme-text tracking-tight uppercase">Local Drive</h2>
            <p className="text-theme-muted leading-relaxed font-medium">
              Connect a local folder to index your personal photos and videos. Your files stay private and never leave your machine.
            </p>
          </div>
          <button 
            onClick={handleConnectFolder}
            className="group flex items-center gap-3 px-8 py-4 bg-theme-text text-theme-bg rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <FolderPlus size={18} />
            Connect Folder
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6 lg:p-10 gap-8 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-theme-muted text-[10px] font-black uppercase tracking-widest mb-2">
            <HardDrive size={12} className="text-theme-text opacity-40" />
            <span className="opacity-60">Santuario</span>
            <ChevronRight size={12} className="opacity-40" />
            <span className="text-theme-text">{rootHandle.name}</span>
          </div>
          <h1 className="text-4xl font-black text-theme-text tracking-tighter uppercase">Media Gallery</h1>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs mt-2 font-black uppercase tracking-widest"
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
              className="w-full md:w-64 pl-12 pr-4 py-3 bg-theme-glass border border-theme-border rounded-2xl focus:outline-none focus:border-theme-text/30 text-theme-text placeholder:text-theme-muted transition-all font-bold text-sm"
            />
          </div>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-theme-glass border border-theme-border rounded-2xl px-4 py-3 text-sm font-black text-theme-text outline-none focus:border-theme-text/30 transition-all uppercase tracking-widest"
          >
            <option value="date">Recent</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>

          <div className="flex p-1 bg-theme-glass border border-theme-border rounded-2xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-theme-text text-theme-bg shadow-lg' : 'text-theme-muted hover:text-theme-text'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-theme-text text-theme-bg shadow-lg' : 'text-theme-muted hover:text-theme-text'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
          
          <div className="h-8 w-px bg-theme-border mx-1" />

          <button 
            onClick={indexFolder}
            className="p-3 bg-theme-glass border border-theme-border rounded-2xl text-theme-muted hover:text-theme-text transition-all hover:rotate-180 duration-700"
            title="Refresh items"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={clearDrive}
            className="p-3 bg-theme-glass border border-theme-border rounded-2xl text-theme-muted hover:text-red-400 transition-all"
            title="Disconnect Drive"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'image', 'video'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
              filterType === type 
                ? 'bg-theme-text text-theme-bg border-theme-text shadow-xl' 
                : 'bg-theme-glass text-theme-muted border-theme-border hover:border-theme-text/30'
            }`}
          >
            {type}s
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isIndexing ? (
          <div className="w-full h-64 flex flex-col items-center justify-center gap-6 text-theme-muted">
            <Loader2 size={48} className="animate-spin opacity-20" />
            <p className="font-black uppercase tracking-[0.3em] text-xs">Indexing Sector...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="w-full h-96 flex flex-col items-center justify-center gap-6 text-theme-muted border-2 border-dashed border-theme-border rounded-[3rem] opacity-50">
            <Search size={48} className="opacity-20" />
            <p className="font-black uppercase tracking-[0.3em] text-xs">Zero results found</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 pb-32"
              : "flex flex-col gap-4 pb-32"
            }
          >
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                variants={itemVariants}
                layout
                onClick={() => handlePreviewFile(file)}
                className={`group relative overflow-hidden transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? "aspect-square rounded-[2rem] bg-theme-glass border border-theme-border hover:scale-[1.02] hover:shadow-2xl active:scale-95 shadow-lg"
                    : "flex items-center gap-6 p-5 rounded-3xl bg-theme-glass border border-theme-border hover:bg-theme-hover transition-all shadow-md"
                }`}
              >
                {/* Thumbnail */}
                <div className={viewMode === 'grid' ? "w-full h-full relative" : "w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative"}>
                  {previews[file.id] ? (
                    <img 
                      src={previews[file.id]} 
                      alt={file.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-theme-hover text-theme-text/40">
                      {file.type?.startsWith('video/') ? <Video size={viewMode === 'grid' ? 40 : 28} /> : <ImageIcon size={viewMode === 'grid' ? 40 : 28} />}
                    </div>
                  )}
                  
                  {file.type?.startsWith('video/') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="p-3 bg-white/20 backdrop-blur-xl rounded-full text-white shadow-xl border border-theme-border/20">
                        <Play size={20} fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Overlay / List Text */}
                {viewMode === 'grid' ? (
                  <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-white font-black text-xs truncate mb-2 uppercase tracking-tight">{file.name}</p>
                    <div className="flex items-center justify-between text-white/60 text-[10px] font-black uppercase tracking-widest">
                      <span>{((file.size || 0) / 1024 / 1024).toFixed(1)} MB</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFile(file);
                        }}
                        className="p-2 hover:bg-white/20 rounded-xl transition-all"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <h3 className="text-theme-text font-black truncate uppercase tracking-tight text-sm">{file.name}</h3>
                    <div className="flex items-center gap-4 text-theme-muted text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
                      <span>{file.type?.split('/')[1] || 'file'}</span>
                      <span className="w-1 h-1 rounded-full bg-theme-muted opacity-30" />
                      <span>{((file.size || 0) / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="flex items-center gap-3 pr-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFile(file);
                      }}
                      className="p-3 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-2xl transition-all"
                    >
                      <ExternalLink size={20} />
                    </button>
                    <button className="p-3 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-2xl transition-all">
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
        {selectedFile && selectedFileUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePreview}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl pointer-events-auto"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-6xl h-full max-h-[85vh] bg-theme-bg rounded-[3rem] border border-theme-border/30 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto"
            >
              {/* Modal Close */}
              <button 
                onClick={handleClosePreview}
                className="absolute top-8 right-8 z-50 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-3xl transition-all border border-theme-border/20"
              >
                <X size={24} />
              </button>

              <div className="flex-1 flex items-center justify-center bg-black/40 overflow-hidden min-h-0 relative group/player">
                {selectedFile.type?.startsWith('image/') ? (
                  <img 
                    src={selectedFileUrl} 
                    alt={selectedFile.name}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                  />
                ) : (
                  <video 
                    src={selectedFileUrl} 
                    controls 
                    autoPlay
                    className="max-w-full max-h-full shadow-2xl"
                  />
                )}
              </div>

              <div className="p-10 border-t border-theme-border/50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-theme-glass/30">
                <div className="min-w-0 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-theme-text/5 flex items-center justify-center text-theme-text shrink-0">
                    {selectedFile.type?.startsWith('video/') ? <Video size={32} /> : <ImageIcon size={32} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-theme-text truncate uppercase tracking-tighter">{selectedFile.name}</h2>
                    <div className="flex items-center gap-4 text-theme-muted text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                      <span className="text-theme-text opacity-100">{selectedFile.type}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-theme-muted opacity-20" />
                      <span>{((selectedFile.size || 0) / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-theme-muted opacity-20" />
                      <span>Last Modified: {new Date(selectedFile.lastModified || 0).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleOpenFile(selectedFile)}
                    className="flex items-center gap-3 px-8 py-4 bg-theme-text text-theme-bg rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-theme-text/10"
                  >
                    <ExternalLink size={20} />
                    Open Source
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
