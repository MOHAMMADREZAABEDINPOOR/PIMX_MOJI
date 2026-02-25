import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';

interface ZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onDownload?: () => void;
}

export function ZoomModal({ isOpen, onClose, imageSrc, onDownload }: ZoomModalProps) {
  const [zoom, setZoom] = React.useState(1);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/95 backdrop-blur-md p-4 md:p-12"
        >
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
          >
            <X className="w-6 h-6" />
          </motion.button>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl z-[110]">
            <button onClick={handleZoomOut} className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors">
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="px-4 text-white font-black text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={handleZoomIn} className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors">
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button onClick={handleReset} className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors">
              <Maximize2 className="w-5 h-5" />
            </button>
            {onDownload && (
              <>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button onClick={onDownload} className="p-3 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={(e) => {
              if (isDragging) {
                setPosition(prev => ({
                  x: prev.x + e.movementX,
                  y: prev.y + e.movementY
                }));
              }
            }}
          >
            <motion.img
              src={imageSrc}
              alt="Zoomed Art"
              style={{
                scale: zoom,
                x: position.x,
                y: position.y,
              }}
              className="max-w-full max-h-full object-contain shadow-2xl pointer-events-none"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: zoom, opacity: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
