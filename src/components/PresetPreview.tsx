import React, { useEffect, useRef, useState } from 'react';
import { generateArt, ArtOptions } from '../utils/imageProcessing';
import { Preset } from '../constants/presets';

let defaultImageCache: HTMLImageElement | null = null;

const getDefaultImage = (): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    if (defaultImageCache) {
      resolve(defaultImageCache);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      defaultImageCache = img;
      resolve(img);
    };
    img.onerror = () => {
      // Fallback to a generated image if network fails
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 150, 150);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#10b981');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 150, 150);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(75, 75, 40, 0, Math.PI * 2);
        ctx.fill();
      }
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        defaultImageCache = fallbackImg;
        resolve(fallbackImg);
      };
      fallbackImg.src = canvas.toDataURL();
    };
    img.src = 'https://i.scdn.co/image/ab6761610000e5eb6a2240e30495392888718e67';
  });
};

interface PresetPreviewProps {
  preset: Preset;
  userImage?: HTMLImageElement | null;
  className?: string;
}

export function PresetPreview({ preset, userImage, className }: PresetPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    let isMounted = true;
    const controller = new AbortController();

    const renderPreview = async () => {
      if (!canvasRef.current) return;
      setLoading(true);
      
      const imgToUse = userImage || await getDefaultImage();
      
      if (!isMounted) return;

      // Use a lower resolution for fast preview
      const previewOptions: ArtOptions = {
        ...preset.options,
        resolution: Math.min(preset.options.resolution || 50, 60), // Cap resolution for preview
      } as ArtOptions;

      try {
        await generateArt(imgToUse, canvasRef.current, previewOptions, undefined, controller.signal);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Preview generation failed', e);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    renderPreview();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [preset, userImage, isInView]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className || 'rounded-xl bg-zinc-100 dark:bg-zinc-900'}`}>
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
