import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCw, ZoomIn, ZoomOut, Check, Move } from 'lucide-react';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (editedImage: string) => void;
  onCancel: () => void;
}

import { motion } from 'framer-motion';

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgElement(img);
      // Reset state for new image
      setRotation(0);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!imgElement || !canvasRef.current) return;
    draw();
  }, [imgElement, rotation, zoom, offset]);

  const draw = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imgElement) return;

    // Set canvas size to match container (maintaining aspect ratio)
    const container = canvas.parentElement;
    if (!container) return;
    
    // We want a standard 16:9 aspect ratio for the background
    canvas.width = container.clientWidth;
    canvas.height = (container.clientWidth * 9) / 16;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // 1. Center the context
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    
    // 2. Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 3. Scale (Zoom)
    ctx.scale(zoom, zoom);

    // 4. Draw Image (centered)
    // Calculate scale to fit image in canvas initially
    const scaleToFit = Math.min(canvas.width / imgElement.width, canvas.height / imgElement.height);
    const drawWidth = imgElement.width * scaleToFit;
    const drawHeight = imgElement.height * scaleToFit;

    ctx.drawImage(imgElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (!imgElement) return;

    // Create a final canvas at target resolution (1920x1080)
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 1920;
    finalCanvas.height = 1080;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return;

    finalCtx.fillStyle = '#000000';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    finalCtx.save();
    
    // Calculate mapping from preview canvas to final canvas
    const previewScale = 1920 / canvasRef.current!.width;
    
    finalCtx.translate(finalCanvas.width / 2 + offset.x * previewScale, finalCanvas.height / 2 + offset.y * previewScale);
    finalCtx.rotate((rotation * Math.PI) / 180);
    finalCtx.scale(zoom, zoom);

    const scaleToFit = Math.min(finalCanvas.width / imgElement.width, finalCanvas.height / imgElement.height);
    const drawWidth = imgElement.width * scaleToFit;
    const drawHeight = imgElement.height * scaleToFit;

    finalCtx.drawImage(imgElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    finalCtx.restore();

    onSave(finalCanvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onCancel}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-theme-glass backdrop-blur-2xl border border-theme-border rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-theme-border flex items-center justify-between">
          <h3 className="text-xl font-bold text-theme-text flex items-center gap-3">
            <Move size={20} className="text-theme-muted" /> Adjust Background
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-theme-hover rounded-full transition-colors text-theme-muted hover:text-theme-text">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Viewport */}
          <div 
            className="w-full aspect-video rounded-2xl overflow-hidden bg-black/20 border border-theme-border relative cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute inset-0 border-2 border-theme-text/20 pointer-events-none rounded-2xl" />
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ZoomOut size={18} className="text-theme-muted" />
                <input 
                  type="range" 
                  min="0.5" 
                  max="3" 
                  step="0.1" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-32 accent-theme-text"
                />
                <ZoomIn size={18} className="text-theme-muted" />
              </div>
              <div className="h-8 w-px bg-theme-border" />
              <button 
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-2 px-4 py-2 bg-theme-glass hover:bg-theme-hover border border-theme-border rounded-xl transition-all font-bold text-theme-text"
              >
                <RotateCw size={18} /> Rotate 90°
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={onCancel}
                className="px-6 py-2 text-theme-muted hover:text-theme-text font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 bg-theme-text text-theme-contrast rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg"
              >
                <Check size={20} /> Apply Changes
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImageEditor;
