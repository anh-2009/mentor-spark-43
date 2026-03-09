import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface LightboxProps {
  images: GalleryImage[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, open, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, index]);

  const next = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (zoom > 1) return;
    const threshold = 80;
    if (info.offset.x < -threshold) next();
    else if (info.offset.x > threshold) prev();
    else if (Math.abs(info.offset.y) > threshold * 1.5) onClose();
  };

  const toggleZoom = () => {
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  };

  const current = images[index];
  if (!current) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />

          {/* Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={zoom > 1 ? "Zoom out" : "Zoom in"}
            >
              {zoom > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg glass text-xs text-muted-foreground">
            {index + 1} / {images.length}
          </div>

          {/* Prev/Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            ref={constraintsRef}
            className="relative w-full h-full flex items-center justify-center p-12 md:p-20"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                drag={zoom <= 1}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.4}
                onDragEnd={handleDragEnd}
                className="relative max-w-full max-h-full cursor-grab active:cursor-grabbing"
                style={{
                  scale: zoom,
                  x: position.x,
                  y: position.y,
                }}
                onClick={onClose}
              >
                <img
                  src={current.src}
                  alt={current.alt}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-lg select-none"
                  draggable={false}
                  onDoubleClick={(e) => { e.stopPropagation(); toggleZoom(); }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Caption */}
          {current.caption && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-5 py-2.5 rounded-xl glass max-w-md text-center"
            >
              <p className="text-sm text-foreground font-medium">{current.caption}</p>
            </motion.div>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIndex(i); setZoom(1); setPosition({ x: 0, y: 0 }); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === index ? "bg-primary w-5" : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
