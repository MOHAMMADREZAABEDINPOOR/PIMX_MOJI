import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Download, Copy, Settings2, Type, Smile, Hash, 
  SlidersHorizontal, Palette, FileText, Wand2, ZoomIn, ZoomOut, 
  Maximize, Maximize2, ArrowLeft, Send, Twitter, Smartphone, Music, ShieldCheck, Zap, X, ChevronRight, Sparkles, Check,
  History as HistoryIcon
} from 'lucide-react';
import { generateArt, generateText, ArtOptions } from './utils/imageProcessing';
import { motion, AnimatePresence } from 'motion/react';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { Navbar } from './components/Navbar';
import { PRESETS, Preset } from './constants/presets';
import { PresetPreview } from './components/PresetPreview';
import { History, HistoryItem } from './components/History';
import { ZoomModal } from './components/ZoomModal';
import { CharacterPicker } from './components/CharacterPicker';
import { trackImageGeneration, trackVisit10MinuteBucket } from './services/analytics';

// --- Components ---
const HISTORY_STORAGE_KEY = 'pimxmoji-history';
const MAX_HISTORY_ITEMS = 20;
const DEFAULT_IMAGE_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
       <defs>
         <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
           <stop offset="0%" stop-color="#0f172a"/>
           <stop offset="100%" stop-color="#111827"/>
         </linearGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="monospace" font-size="48" fill="#94a3b8">PIMXMOJI</text>
     </svg>`
  );

const persistHistory = (items: HistoryItem[]) => {
  const trySave = (list: HistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  };

  let trimmed = items.slice(0, MAX_HISTORY_ITEMS);
  if (trySave(trimmed)) return trimmed;
  trimmed = trimmed.slice(0, 10);
  if (trySave(trimmed)) return trimmed;
  trimmed = trimmed.slice(0, 5);
  if (trySave(trimmed)) return trimmed;
  trySave([]);
  return [];
};

const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="space-y-4 py-6 border-b border-zinc-200 dark:border-zinc-800/50 last:border-0">
    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
      <Icon className="w-4 h-4 text-violet-600 dark:text-violet-500" />
      {title}
    </label>
    {children}
  </div>
);

const SocialLink = ({ href, icon: Icon, label, sublabel }: { href: string, icon: any, label: string, sublabel?: string }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noreferrer"
    className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl hover:border-violet-500/50 hover:bg-violet-500/5 dark:hover:bg-violet-500/10 transition-all group"
  >
    <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl group-hover:scale-110 transition-transform text-violet-600 dark:text-violet-400 shadow-sm">
      <Icon className="w-5 h-5" />
    </div>
    <div className="text-start">
      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{label}</div>
      {sublabel && <div className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase tracking-tight">{sublabel}</div>}
    </div>
  </a>
);

const AppLoadingScreen = ({ language }: { language: 'en' | 'fa' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[300] flex items-center justify-center bg-white dark:bg-zinc-950 transition-colors duration-300"
  >
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-12%] start-[-8%] w-[35%] h-[35%] rounded-full blur-[120px] bg-violet-500/20 dark:bg-violet-500/15" />
      <div className="absolute bottom-[-12%] end-[-8%] w-[35%] h-[35%] rounded-full blur-[120px] bg-emerald-500/15 dark:bg-emerald-500/10" />
    </div>
    <div className="relative flex flex-col items-center gap-5">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-[6px] border-zinc-200 dark:border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-violet-600 dark:border-t-violet-400 animate-spin" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'fa' ? 'در حال آماده‌سازی...' : 'Preparing your workspace...'}
        </h2>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mt-1">
          {language === 'fa' ? 'لطفاً چند لحظه صبر کنید' : 'Please wait a moment'}
        </p>
      </div>
    </div>
  </motion.div>
);

// --- Main App Content ---

type View = 'home' | 'setup' | 'result';

function AppContent() {
  const { t, language } = useSettings();
  const [view, setView] = useState<View>('home');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const [options, setOptions] = useState<ArtOptions>({
    mode: 'mosaic',
    chars: 'ART ',
    resolution: 120,
    colorize: true,
    bgColor: '#000000',
    textColor: '#ffffff',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    invert: false,
    fontFamily: 'monospace',
    fontWeight: 'normal',
    threshold: 0,
    spacing: 1.0,
    fontSize: 12,
    shadowBlur: 0,
    shadowColor: '#ffffff'
  });

  useEffect(() => {
    const tickVisit = () => {
      if (document.visibilityState !== 'visible') return;
      trackVisit10MinuteBucket();
    };

    // Count first visit immediately, then keep checking while user stays on the site.
    tickVisit();

    const intervalId = window.setInterval(() => {
      tickVisit();
    }, 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tickVisit();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Persistence
  useEffect(() => {
    let active = true;
    const loadSaved = async () => {
      const savedOptions = localStorage.getItem('pimxmoji_options');
      if (savedOptions) {
        try {
          setOptions(JSON.parse(savedOptions));
        } catch (e) {
          console.error("Failed to load saved options");
        }
      }
      
      // Fallback to default image
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            if (active) setImage(img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = DEFAULT_IMAGE_DATA_URL;
        });
      } finally {
        if (active) setIsAppLoading(false);
      }
    };
    
    loadSaved();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pimxmoji_options', JSON.stringify(options));
  }, [options]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportQuality, setExportQuality] = useState<number>(0.9);
  
  const [visibleExamples, setVisibleExamples] = useState(10);
  const [visiblePresets, setVisiblePresets] = useState(20);
  const [hoveredPreset, setHoveredPreset] = useState<Preset | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<string>('');
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [itemToDownload, setItemToDownload] = useState<HistoryItem | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isRendered, setIsRendered] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = () => {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse history");
        }
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleApplyHistory = (item: HistoryItem) => {
    setOptions(item.options);
    setSelectedPresetId(item.styleId || null);
    setToast({ message: language === 'fa' ? 'استایل با موفقیت اعمال شد' : 'Style applied successfully!', type: 'success' });
  };

  const getPresetLabel = (preset: Preset) => {
    const key = `preset.${preset.id}`;
    const translated = t(key);
    return translated === key ? preset.name : translated;
  };

  const handleDownloadWithFormat = (format: 'png' | 'jpeg' | 'webp') => {
    setExportFormat(format);
    setShowDownloadModal(false);
    
    setTimeout(() => {
      if (itemToDownload) {
        // Download history item
        const link = document.createElement('a');
        const ext = format === 'jpeg' ? 'jpg' : format;
        link.download = `pimxmoji-history-${itemToDownload.id}.${ext}`;
        
        // If it's already a data URL, we might need to re-encode if format changed
        // But history stores it as PNG. For simplicity, if it's history, we just download what's there
        // or we could draw it to a temp canvas to re-encode.
        const tempCanvas = document.createElement('canvas');
        const img = new Image();
        img.onload = () => {
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            link.href = tempCanvas.toDataURL(`image/${format}`, exportQuality);
            link.click();
          }
          setItemToDownload(null);
        };
        img.src = itemToDownload.imageData;
      } else {
        // Download current canvas
        handleDownloadImage();
      }
    }, 100);
  };

  const [shouldSaveHistory, setShouldSaveHistory] = useState(false);

  // Trigger generation whenever view changes to result or options change
  useEffect(() => {
    if (view === 'result' && image) {
      let isMounted = true;
      const controller = new AbortController();

      const generate = async () => {
        setIsGenerating(true);
        setError(null);
        setProgress(0);
        setIsRendered(false);

        const offscreenCanvas = document.createElement('canvas');

        try {
          // Step 1: Perform the intensive art generation on a hidden canvas
          await generateArt(image, offscreenCanvas, options, (p) => {
            if (isMounted) setProgress(p);
          }, controller.signal);

          // Step 2: Convert the result to a Data URL and load it into a new Image object.
          const dataUrl = offscreenCanvas.toDataURL();
          const finalImage = new Image();

          // Step 3: Set up the onload handler. This code will only run when the image is 100% ready to be painted instantly.
          finalImage.onload = () => {
            const tryDraw = () => {
              if (!isMounted) return;
              if (canvasRef.current) {
                const visibleCanvas = canvasRef.current;
                const ctx = visibleCanvas.getContext('2d');
                if (ctx) {
                  visibleCanvas.width = finalImage.width;
                  visibleCanvas.height = finalImage.height;
                  // Manually draw the background color onto the canvas itself.
                  // This makes the background part of the image data and prevents race conditions.
                  if (options.bgColor !== 'transparent') {
                    ctx.fillStyle = options.bgColor;
                    ctx.fillRect(0, 0, visibleCanvas.width, visibleCanvas.height);
                  }
                  ctx.drawImage(finalImage, 0, 0);
                }

                // Step 4: Use requestAnimationFrame to sync the reveal with the browser's next paint cycle for the smoothest possible transition.
                requestAnimationFrame(() => {
                  if (isMounted) {
                    setCanvasSize({ width: visibleCanvas.width, height: visibleCanvas.height });
                    setIsRendered(true); // This makes the canvas container visible
                    setIsGenerating(false); // Hide the loading spinner

                    // Auto-fit to screen
                    setTimeout(() => {
                      if (isMounted && resultContainerRef.current && visibleCanvas.width > 0) {
                        const container = resultContainerRef.current;
                        const scaleX = (container.clientWidth - 64) / visibleCanvas.width;
                        const scaleY = (container.clientHeight - 64) / visibleCanvas.height;
                        // Allow upscaling to fill the screen better
                        setZoom(Math.min(scaleX, scaleY));
                        
                        if (shouldSaveHistory) {
                          const selectedPreset = selectedPresetId ? PRESETS.find((p) => p.id === selectedPresetId) : null;
                          let previewData = '';
                          try {
                            previewData = visibleCanvas.toDataURL('image/webp', 0.7);
                          } catch {
                            previewData = '';
                          }
                          if (!previewData || !previewData.startsWith('data:image/webp')) {
                            previewData = visibleCanvas.toDataURL('image/png');
                          }

                          const newItem: HistoryItem = {
                            id: Math.random().toString(36).substring(7),
                            timestamp: Date.now(),
                            imageData: previewData,
                            options: { ...options },
                            styleId: selectedPreset?.id || null,
                            styleLabel: selectedPreset
                              ? getPresetLabel(selectedPreset)
                              : (language === 'fa'
                                  ? `سفارشی ${options.mode}`
                                  : `Custom ${options.mode.toUpperCase()}`),
                          };
                          setHistory(prev => persistHistory([newItem, ...prev]));
                          trackImageGeneration({
                            mode: options.mode,
                            styleKey: selectedPreset?.id || `custom_${options.mode}`,
                            styleLabel: selectedPreset
                              ? getPresetLabel(selectedPreset)
                              : (language === 'fa'
                                  ? `سفارشی ${options.mode}`
                                  : `Custom ${options.mode.toUpperCase()}`),
                          });
                          setShouldSaveHistory(false);
                        }
                      }
                    }, 100);
                  }
                });
              } else {
                setTimeout(tryDraw, 50);
              }
            };
            tryDraw();
          };

          finalImage.onerror = () => {
            if (isMounted) {
              setError("Failed to load the generated image asset.");
              setIsGenerating(false);
            }
          };

          // Step 5: Setting the src triggers the loading process.
          finalImage.src = dataUrl;

        } catch (err: any) {
          if (isMounted) {
            if (err.name !== 'AbortError') {
              console.error("Art generation failed:", err);
              setError(err.message || "Generation failed. Try reducing resolution.");
            }
            setIsRendered(false);
            setIsGenerating(false);
          }
        }
      };

      generate();

      return () => {
        isMounted = false;
        controller.abort();
      };
    }
  }, [view, image, options]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setError(null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!image) {
      alert(t('alert.upload'));
      return;
    }
    setZoom(1);
    setView('result');
    setCanvasSize({ width: 0, height: 0 });
    setIsRendered(false);
    setShouldSaveHistory(true);
  };

  const handleDownloadImage = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
      link.download = `pimxmoji-result.${ext}`;
      link.href = canvasRef.current.toDataURL(`image/${exportFormat}`, exportQuality);
      link.click();
    }
  };

  const handleDownloadText = () => {
    if (image) {
      try {
        const text = generateText(image, options);
        const blob = new Blob([text], { type: 'text/plain' });
        const link = document.createElement('a');
        link.download = 'pimxmoji-result.txt';
        link.href = URL.createObjectURL(blob);
        link.click();
      } catch (err) {
        console.error("Failed to generate text:", err);
        alert(t('alert.fail.text'));
      }
    }
  };

  const handleCopyText = () => {
    if (image) {
      try {
        const text = generateText(image, options);
        navigator.clipboard.writeText(text);
        alert(t('alert.copy'));
      } catch (err) {
        console.error("Failed to copy text:", err);
        alert(t('alert.fail.copy'));
      }
    }
  };

  const handleModeChange = (mode: ArtOptions['mode']) => {
    let defaultChars = '';
    let defaultColorize = false;
    if (mode === 'mosaic') {
      defaultChars = 'ART ';
      defaultColorize = true;
    } else if (mode === 'ascii') {
      defaultChars = ' .:-=+*#%@';
      defaultColorize = false;
    } else if (mode === 'emoji') {
      defaultChars = '🌑🌒🌓🌔🌕';
      defaultColorize = false;
    }
    setSelectedPresetId(null);
    setOptions({ ...options, mode, chars: defaultChars, colorize: defaultColorize });
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      const base = { 
        ...options, 
        brightness: 100, 
        contrast: 100, 
        saturation: 100, 
        invert: false, 
        colorize: false, 
        resolution: 140, 
        fontFamily: 'monospace', 
        fontWeight: 'bold', 
        threshold: 0, 
        spacing: 1.0, 
        shadowBlur: 0 
      };
      setOptions({ ...base, ...preset.options });
      setSelectedPresetId(presetId);
    }
  };

  return (
    <div dir={language === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-violet-500/30 overflow-x-hidden transition-colors duration-300">
      <Navbar />
      
      {/* --- Home View --- */}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            className="min-h-[calc(100vh-64px)] flex flex-col relative"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] start-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute bottom-[-10%] end-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Hero Section */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-6xl mx-auto space-y-12 py-20 lg:py-32">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs font-bold text-violet-600 dark:text-violet-400 tracking-widest uppercase mb-4 shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                {t('hero.badge')}
              </motion.div>
              
              <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-zinc-900 dark:text-white leading-[0.9]">
                  {t('hero.title.prefix')}<span className="text-violet-600 dark:text-violet-500">{t('hero.title.suffix')}</span>
                </h1>
                <p className="text-lg md:text-2xl lg:text-3xl text-zinc-600 dark:text-zinc-400 font-medium leading-tight max-w-3xl mx-auto">
                  {t('hero.description')}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6">
                <button 
                  onClick={() => setView('setup')}
                  className="group relative px-8 py-4 md:px-10 md:py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black text-lg md:text-xl rounded-2xl transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 active:translate-y-0"
                >
                  <Wand2 className="w-6 h-6" />
                  {t('hero.cta.start')}
                  <ChevronRight className={`w-5 h-5 transition-transform ${language === 'fa' ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
                </button>
                <a 
                  href="https://t.me/PIMX_PASS" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-8 py-4 md:px-10 md:py-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold text-lg md:text-xl rounded-2xl transition-all flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95"
                >
                  <Send className="w-6 h-6 text-violet-500" />
                  {t('hero.cta.telegram')}
                </a>
              </div>

              {/* Stats / Trust */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-zinc-200 dark:border-zinc-900 w-full max-w-4xl">
                <div>
                  <div className="text-3xl font-black text-zinc-900 dark:text-white">300+</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{t('stats.res')}</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-zinc-900 dark:text-white">0ms</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{t('stats.latency')}</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-zinc-900 dark:text-white">100%</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{t('stats.private')}</div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="relative z-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-900 p-8 md:p-24 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto space-y-32">
                
                {/* Ecosystem Section */}
                <div className="space-y-24">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                      <div className="inline-flex px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-black tracking-[0.2em] uppercase rounded-full">
                        {t('ecosystem.badge')}
                      </div>
                      <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight sm:leading-[0.85] uppercase break-words">
                        {t('ecosystem.title')}
                      </h2>
                      <p className="text-2xl md:text-3xl font-bold text-zinc-500 dark:text-zinc-400 leading-tight tracking-tight">
                        {t('ecosystem.desc')}
                      </p>
                      <div className="w-24 h-1 bg-zinc-200 dark:bg-zinc-800" />
                      <p className="text-lg text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium max-w-xl">
                        {t('ecosystem.detailed_desc')}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-4 p-8 rounded-[40px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-4xl font-black text-violet-600 dark:text-violet-500 tracking-tighter">150+</div>
                        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t('ecosystem.stats.styles.label')}</div>
                        <p className="text-sm text-zinc-500 font-medium">{t('ecosystem.stats.styles.desc')}</p>
                      </div>
                      <div className="space-y-4 p-8 rounded-[40px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 sm:mt-8">
                        <div className="text-4xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter">100%</div>
                        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t('ecosystem.stats.private.label')}</div>
                        <p className="text-sm text-zinc-500 font-medium">{t('ecosystem.stats.private.desc')}</p>
                      </div>
                      <div className="space-y-4 p-8 rounded-[40px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 sm:-mt-8">
                        <div className="text-4xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">∞</div>
                        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t('ecosystem.stats.freedom.label')}</div>
                        <p className="text-sm text-zinc-500 font-medium">{t('ecosystem.stats.freedom.desc')}</p>
                      </div>
                      <div className="space-y-4 p-8 rounded-[40px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-4xl font-black text-orange-600 dark:text-orange-500 tracking-tighter">24/7</div>
                        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t('ecosystem.stats.support.label')}</div>
                        <p className="text-sm text-zinc-500 font-medium">{t('ecosystem.stats.support.desc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {/* PIMX PASS BOT Card */}
                    <div className="relative group overflow-hidden rounded-[32px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl transition-all hover:shadow-violet-500/20">
                      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none"></div>
                      <div className="relative p-6 md:p-10 flex flex-col lg:flex-row gap-10 items-center">
                        <div className="flex-1 space-y-8">
                          <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-[10px] font-black tracking-widest uppercase border border-violet-500/20">
                              {t('bot.pass.badge')}
                            </div>
                            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                              {t('bot.pass.title')}
                            </h3>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl font-medium">
                              {t('bot.pass.desc')}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {t('bot.pass.features').split(',').map((feature, i) => (
                              <div key={i} className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 font-bold group/item text-sm">
                                <div className="w-5 h-5 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover/item:scale-110 transition-transform">
                                  <Check className="w-3 h-3" />
                                </div>
                                {feature.trim()}
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4 pt-4">
                            <a 
                              href="https://t.me/PIMX_PASS_BOT" 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-3 bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 dark:hover:bg-violet-400 text-white dark:text-zinc-950 font-black px-8 py-4 rounded-[20px] transition-all active:scale-95 shadow-xl shadow-violet-500/30 text-base"
                            >
                              {t('bot.pass.cta')} <ChevronRight className={`w-5 h-5 ${language === 'fa' ? 'rotate-180' : ''}`} />
                            </a>
                            <a 
                              href="https://t.me/PIMX_PASS" 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black px-8 py-4 rounded-[20px] transition-all active:scale-95 text-base border border-zinc-200 dark:border-zinc-800"
                            >
                              <Send className="w-5 h-5" />
                              {t('bot.channel')}
                            </a>
                          </div>
                        </div>
                        <div className="relative w-full lg:w-1/3 aspect-square flex items-center justify-center">
                          <div className="absolute inset-0 bg-violet-500/20 blur-[100px] rounded-full animate-pulse"></div>
                          <div className="relative w-48 h-48 md:w-64 md:h-64 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[48px] flex items-center justify-center shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] rotate-6 group-hover:rotate-12 transition-transform duration-700 ease-out">
                            <Zap className="w-24 h-24 md:w-32 md:h-32 text-violet-600 dark:text-violet-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PIMX PLAY Card */}
                    <div className="relative group overflow-hidden rounded-[32px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl transition-all hover:shadow-emerald-500/20">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none"></div>
                      <div className="relative p-6 md:p-10 flex flex-col lg:flex-row-reverse gap-10 items-center">
                        <div className="flex-1 space-y-8">
                          <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black tracking-widest uppercase border border-emerald-500/20">
                              {t('bot.play.badge')}
                            </div>
                            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                          </div>
                          <div className="space-y-4 text-right lg:text-left">
                            <h3 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                              {t('bot.play.title')}
                            </h3>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl font-medium ml-auto lg:ml-0">
                              {t('bot.play.desc')}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {t('bot.play.features').split(',').map((feature, i) => (
                              <div key={i} className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 font-bold group/item text-sm">
                                <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover/item:scale-110 transition-transform">
                                  <Check className="w-3 h-3" />
                                </div>
                                {feature.trim()}
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4 pt-4 justify-center lg:justify-start">
                            <a 
                              href="https://t.me/PIMX_PLAY_BOT" 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-3 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-black px-8 py-4 rounded-[20px] transition-all active:scale-95 shadow-xl shadow-emerald-500/30 text-base"
                            >
                              {t('bot.play.cta')} <ChevronRight className={`w-5 h-5 ${language === 'fa' ? 'rotate-180' : ''}`} />
                            </a>
                          </div>
                        </div>
                        <div className="relative w-full lg:w-1/3 aspect-square flex items-center justify-center">
                          <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse"></div>
                          <div className="relative w-48 h-48 md:w-64 md:h-64 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[48px] flex items-center justify-center shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] -rotate-6 group-hover:-rotate-12 transition-transform duration-700 ease-out">
                            <Smartphone className="w-24 h-24 md:w-32 md:h-32 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PIMX SONIC Card */}
                    <div className="relative group overflow-hidden rounded-[32px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl transition-all hover:shadow-blue-500/20">
                      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none"></div>
                      <div className="relative p-6 md:p-10 flex flex-col lg:flex-row gap-10 items-center">
                        <div className="flex-1 space-y-8">
                          <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black tracking-widest uppercase border border-blue-500/20">
                              {t('bot.sonic.badge')}
                            </div>
                            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                              {t('bot.sonic.title')}
                            </h3>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl font-medium">
                              {t('bot.sonic.desc')}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {t('bot.sonic.features').split(',').map((feature, i) => (
                              <div key={i} className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 font-bold group/item text-sm">
                                <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover/item:scale-110 transition-transform">
                                  <Check className="w-3 h-3" />
                                </div>
                                {feature.trim()}
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4 pt-4">
                            <a 
                              href="https://t.me/PIMX_SONIC_BOT" 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white dark:text-zinc-950 font-black px-8 py-4 rounded-[20px] transition-all active:scale-95 shadow-xl shadow-blue-500/30 text-base"
                            >
                              {t('bot.sonic.cta')} <ChevronRight className={`w-5 h-5 ${language === 'fa' ? 'rotate-180' : ''}`} />
                            </a>
                          </div>
                        </div>
                        <div className="relative w-full lg:w-1/3 aspect-square flex items-center justify-center">
                          <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full animate-pulse"></div>
                          <div className="relative w-48 h-48 md:w-64 md:h-64 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[48px] flex items-center justify-center shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] rotate-6 group-hover:rotate-12 transition-transform duration-700 ease-out">
                            <Music className="w-24 h-24 md:w-32 md:h-32 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Examples Showcase */}
                <div className="space-y-16">
                  <div className="max-w-3xl space-y-6">
                    <div className="text-xs font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-500 uppercase">
                      VISUAL SHOWCASE
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                      {t('examples.title')}
                    </h2>
                    <p className="text-xl text-zinc-500 dark:text-zinc-500 leading-relaxed max-w-2xl font-medium">
                      {t('examples.desc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PRESETS.slice(0, visibleExamples).map((item) => (
                      <div key={item.id} className="group relative overflow-hidden rounded-[32px] aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-50 group-hover:opacity-100">
                          <PresetPreview preset={item} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-6 left-6 right-6 flex flex-col items-start">
                          <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-2 bg-zinc-900/50 backdrop-blur-md`}>
                            {item.options.mode}
                          </div>
                          <div className="text-xl font-black text-white tracking-tight mb-4">
                            {item.name}
                          </div>
                          <button 
                            onClick={() => {
                              applyPreset(item.id);
                              setView('setup');
                            }}
                            className="w-full py-3 bg-white text-zinc-950 rounded-xl font-black text-sm hover:bg-violet-500 hover:text-white transition-colors"
                          >
                            {t('examples.use') || 'USE THIS STYLE'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {visibleExamples < PRESETS.length && (
                    <div className="flex justify-center pt-8">
                      <button 
                        onClick={() => setVisibleExamples(prev => Math.min(prev + 20, PRESETS.length))}
                        className="px-8 py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-black text-sm transition-colors border border-zinc-200 dark:border-zinc-800"
                      >
                        {t('examples.loadMore') || `LOAD MORE (+${Math.min(20, PRESETS.length - visibleExamples)})`}
                      </button>
                    </div>
                  )}
                </div>

                {/* Documentation / How it works */}
                <div className="space-y-32 pt-32 border-t border-zinc-200 dark:border-zinc-900">
                  <div className="space-y-16">
                    <div className="max-w-3xl space-y-6">
                      <div className="text-xs font-black tracking-[0.2em] text-violet-600 dark:text-violet-500 uppercase">
                        {t('howitworks.badge')}
                      </div>
                      <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                        {t('howitworks.title')}
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="group p-10 rounded-[40px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/10">
                        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-8 group-hover:scale-110 transition-transform duration-500">
                          <Type className="w-8 h-8" />
                        </div>
                        <div className="text-5xl font-black text-zinc-100 dark:text-zinc-900 mb-4">01</div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">{t('howitworks.mosaic.title')}</h3>
                        <p className="text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium">
                          {t('howitworks.mosaic.desc')}
                        </p>
                      </div>

                      <div className="group p-10 rounded-[40px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-8 group-hover:scale-110 transition-transform duration-500">
                          <Hash className="w-8 h-8" />
                        </div>
                        <div className="text-5xl font-black text-zinc-100 dark:text-zinc-900 mb-4">02</div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">{t('howitworks.ascii.title')}</h3>
                        <p className="text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium">
                          {t('howitworks.ascii.desc')}
                        </p>
                      </div>

                      <div className="group p-10 rounded-[40px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500">
                          <Smile className="w-8 h-8" />
                        </div>
                        <div className="text-5xl font-black text-zinc-100 dark:text-zinc-900 mb-4">03</div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">{t('howitworks.emoji.title')}</h3>
                        <p className="text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium">
                          {t('howitworks.emoji.desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 p-12 text-center text-zinc-500 dark:text-zinc-600 text-xs border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-center gap-6 mb-8">
                  <a href="https://t.me/PIMX_PASS" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-bold tracking-widest">TELEGRAM</a>
                  <a href="https://x.com/pimxpass" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-bold tracking-widest">X / TWITTER</a>
                </div>
                <p className="font-medium opacity-50">{t('footer.rights')}</p>
              </div>
            </footer>
          </motion.div>
        )}

        {/* --- Setup & Upload View --- */}
        {view === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-[calc(100vh-64px)] flex flex-col bg-zinc-50 dark:bg-[#050505]"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 sticky top-0 z-30 backdrop-blur-xl">
              <button 
                onClick={() => setView('home')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 transition-colors font-bold text-sm"
              >
                <ArrowLeft className={`w-4 h-4 ${language === 'fa' ? 'rotate-180' : ''}`} />
                {t('setup.back')}
              </button>
              <h1 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white hidden sm:block">
                {t('hero.title.prefix')}<span className="text-violet-600 dark:text-violet-500">{t('hero.title.suffix')}</span> {t('setup.title')}
              </h1>
              
              <button 
                onClick={handleGenerate}
                disabled={!image}
                className={`group px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 shadow-xl active:scale-95 ${image ? 'bg-violet-600 dark:bg-violet-500 hover:bg-violet-500 dark:hover:bg-violet-400 text-white dark:text-zinc-950 shadow-violet-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'}`}
              >
                {isGenerating ? t('setup.generating') : t('setup.generate')}
                {!isGenerating && <Wand2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-[0.75fr_1.25fr] gap-10">
                
                {/* Left Column: Upload */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{t('setup.step1.title')}</h2>
                    <p className="text-zinc-600 dark:text-zinc-500 font-medium">{t('setup.step1.desc')}</p>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`group border-2 border-dashed rounded-[32px] p-6 md:p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${image ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-300 dark:border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 bg-white dark:bg-zinc-900/30'}`}
                  >
                    {image ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                        <img src={image.src} alt="Uploaded" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-zinc-950/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-white text-zinc-950 px-4 py-2 rounded-full font-bold text-sm">{t('setup.upload.change')}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                          <Upload className="w-8 h-8 text-zinc-400 group-hover:text-violet-500" />
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-black text-zinc-700 dark:text-zinc-200 block mb-1">{t('setup.upload.click')}</span>
                          <span className="text-sm text-zinc-500 font-medium">{t('setup.upload.drag')}</span>
                        </div>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </div>

                  {/* History Section (Desktop: Under Step 1) */}
                  <div ref={historyRef} className="hidden lg:block pt-12 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{t('history.title')}</h2>
                        <p className="text-zinc-600 dark:text-zinc-500 font-medium">{t('history.desc')}</p>
                      </div>
                    </div>
                    <History 
                      items={history} 
                      onDelete={(id) => setHistory(prev => persistHistory(prev.filter(item => item.id !== id)))}
                      onDownload={(item) => {
                        setItemToDownload(item);
                        setShowDownloadModal(true);
                      }}
                      onApply={handleApplyHistory}
                    />
                  </div>
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{t('setup.step2.title')}</h2>
                    <p className="text-zinc-600 dark:text-zinc-500 font-medium">{t('setup.step2.desc')}</p>
                  </div>

                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-[32px] p-5 md:p-6 space-y-2 shadow-sm">
                    <Section title={t('section.presets')} icon={Wand2}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                        {PRESETS.slice(0, visiblePresets).map((preset) => (
                          <div key={preset.id} className="relative group">
                            <button 
                              onClick={() => applyPreset(preset.id)} 
                              onMouseEnter={() => setHoveredPreset(preset)}
                              onMouseLeave={() => setHoveredPreset(null)}
                              className={`w-full min-h-[56px] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border p-1.5 rounded-2xl text-[11px] font-black ${preset.color} transition-all tracking-tight leading-tight ${selectedPresetId === preset.id ? 'border-violet-500 ring-4 ring-violet-500/20 bg-violet-50 dark:bg-violet-500/10 scale-[1.02] shadow-lg shadow-violet-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}
                            >
                              <span className="w-full px-1 text-center whitespace-normal break-words">{getPresetLabel(preset)}</span>
                              {selectedPresetId === preset.id && (
                                <motion.div 
                                  layoutId="active-preset"
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center text-white shadow-lg"
                                >
                                  <Check className="w-2.5 h-2.5" />
                                </motion.div>
                              )}
                            </button>
                            
                            {/* Hover Preview Tooltip */}
                            <AnimatePresence>
                              {hoveredPreset?.id === preset.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl pointer-events-none w-48"
                                >
                                  <div className="w-full aspect-square rounded-xl overflow-hidden">
                                    <PresetPreview preset={preset} userImage={image} />
                                  </div>
                                  <div className="text-center mt-2 text-xs font-bold text-zinc-900 dark:text-white">
                                    {getPresetLabel(preset)}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                      
                      {visiblePresets < PRESETS.length && (
                        <button 
                          onClick={() => setVisiblePresets(PRESETS.length)}
                          className="w-full mt-4 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl text-xs font-black transition-colors border border-zinc-200 dark:border-zinc-800 uppercase tracking-widest"
                        >
                          {t('presets.loadMore') || `+${PRESETS.length - visiblePresets} MORE PRESETS`}
                        </button>
                      )}
                    </Section>

                    <Section title={t('section.mode')} icon={Settings2}>
                      <div className="grid grid-cols-3 gap-2 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <button onClick={() => handleModeChange('mosaic')} className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-colors ${options.mode === 'mosaic' ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                          <Type className="w-5 h-5 mb-1.5" /> {t('mode.word')}
                        </button>
                        <button onClick={() => handleModeChange('ascii')} className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-colors ${options.mode === 'ascii' ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                          <Hash className="w-5 h-5 mb-1.5" /> {t('mode.ascii')}
                        </button>
                        <button onClick={() => handleModeChange('emoji')} className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-colors ${options.mode === 'emoji' ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                          <Smile className="w-5 h-5 mb-1.5" /> {t('mode.emoji')}
                        </button>
                      </div>

                      <div className="space-y-2 mt-6">
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                          {options.mode === 'mosaic' ? t('label.word') : t('label.chars')}
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={options.chars}
                            onChange={(e) => setOptions({ ...options, chars: e.target.value })}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-zinc-900 dark:text-zinc-200 pe-12"
                          />
                          {options.mode !== 'mosaic' && (
                            <button 
                              onClick={() => setShowCharPicker(true)}
                              className="absolute end-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                            >
                              <Smartphone className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </Section>

                    <Section title={t('section.res')} icon={SlidersHorizontal}>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t('label.resolution')}</label>
                            <span className="text-xs text-violet-600 dark:text-violet-400 font-mono font-bold">{options.resolution}</span>
                          </div>
                          <input 
                            type="range" min="20" max="400" 
                            value={options.resolution}
                            onChange={(e) => setOptions({ ...options, resolution: parseInt(e.target.value) })}
                            className="w-full accent-violet-500 h-2 bg-zinc-100 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t('label.spacing')}</label>
                            <span className="text-xs text-violet-600 dark:text-violet-400 font-mono font-bold">{(options.spacing || 1.0).toFixed(1)}x</span>
                          </div>
                          <input 
                            type="range" min="0.5" max="2.5" step="0.1"
                            value={options.spacing || 1.0}
                            onChange={(e) => setOptions({ ...options, spacing: parseFloat(e.target.value) })}
                            className="w-full accent-violet-500 h-2 bg-zinc-100 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </Section>

                    <Section title={t('section.adjust')} icon={SlidersHorizontal}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                          { label: t('label.brightness'), key: 'brightness', min: 0, max: 200 },
                          { label: t('label.contrast'), key: 'contrast', min: 0, max: 200 },
                          { label: t('label.saturation'), key: 'saturation', min: 0, max: 200 },
                        ].map((slider) => (
                          <div key={slider.key} className="space-y-2">
                            <div className="flex justify-between">
                              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{slider.label}</label>
                              <span className="text-xs text-violet-600 dark:text-violet-400 font-mono font-bold">{(options as any)[slider.key]}%</span>
                            </div>
                            <input 
                              type="range" min={slider.min} max={slider.max} 
                              value={(options as any)[slider.key]}
                              onChange={(e) => setOptions({ ...options, [slider.key]: parseInt(e.target.value) })}
                              className="w-full accent-violet-500 h-2 bg-zinc-100 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </Section>

                    <Section title={t('section.typo')} icon={Palette}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t('label.fontFamily')}</label>
                              <select 
                                value={options.fontFamily}
                                onChange={(e) => setOptions({ ...options, fontFamily: e.target.value })}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-zinc-200"
                              >
                                <option value="monospace">Monospace</option>
                                <option value="sans-serif">Sans-serif</option>
                                <option value="serif">Serif</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t('label.fontWeight')}</label>
                              <select 
                                value={options.fontWeight}
                                onChange={(e) => setOptions({ ...options, fontWeight: e.target.value })}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-zinc-200"
                              >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex justify-between">
                                <span>{t('label.fontSize')}</span>
                                <span className="text-violet-500">{options.fontSize}px</span>
                              </label>
                              <input 
                                type="range" min="4" max="48" step="1"
                                value={options.fontSize}
                                onChange={(e) => setOptions({ ...options, fontSize: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex justify-between">
                                <span>{t('label.spacing')}</span>
                                <span className="text-violet-500">{options.spacing}x</span>
                              </label>
                              <input 
                                type="range" min="0.5" max="3" step="0.1"
                                value={options.spacing}
                                onChange={(e) => setOptions({ ...options, spacing: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('label.colorize')}</label>
                            <button 
                              onClick={() => setOptions({ ...options, colorize: !options.colorize })}
                              className={`w-12 h-6 rounded-full relative transition-colors ${options.colorize ? 'bg-violet-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${options.colorize ? 'start-7' : 'start-1'}`} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {!options.colorize && (
                              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t('label.textColor')}</label>
                                <input 
                                  type="color" 
                                  value={options.textColor}
                                  onChange={(e) => setOptions({ ...options, textColor: e.target.value })}
                                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t('label.bgColor')}</label>
                              <input 
                                type="color" 
                                value={options.bgColor === 'transparent' ? '#000000' : options.bgColor}
                                onChange={(e) => setOptions({ ...options, bgColor: e.target.value })}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Section>
                  </div>

                  {/* History Section (Mobile: Bottom of Column 2) */}
                  <div ref={historyRef} className="lg:hidden pt-12 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{t('history.title')}</h2>
                        <p className="text-zinc-600 dark:text-zinc-500 font-medium">{t('history.desc')}</p>
                      </div>
                    </div>
                    <History 
                      items={history} 
                      onDelete={(id) => setHistory(prev => persistHistory(prev.filter(item => item.id !== id)))}
                      onDownload={(item) => {
                        setItemToDownload(item);
                        setShowDownloadModal(true);
                      }}
                      onApply={handleApplyHistory}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Action Button for Mobile */}
            <div className="fixed bottom-8 end-8 z-40 lg:hidden flex flex-col gap-4">
              <button 
                onClick={() => historyRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center bg-zinc-800 text-white shadow-2xl transition-all active:scale-90 border border-zinc-700"
              >
                <HistoryIcon className="w-6 h-6 mb-0.5" />
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">
                  {language === 'fa' ? 'هیستوری' : 'HISTORY'}
                </span>
              </button>
              <button 
                onClick={handleGenerate}
                disabled={!image}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${image ? 'bg-violet-600 dark:bg-violet-500 hover:bg-violet-500 dark:hover:bg-violet-400 text-white dark:text-zinc-950 shadow-violet-500/40' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
              >
                {isGenerating ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Footer */}
            <footer className="relative z-10 p-12 text-center text-zinc-500 dark:text-zinc-600 text-xs border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 mt-24">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-center gap-6 mb-8">
                  <a href="https://t.me/PIMX_PASS" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-bold tracking-widest">TELEGRAM</a>
                  <a href="https://x.com/pimxpass" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-bold tracking-widest">X / TWITTER</a>
                </div>
                <p className="font-medium opacity-50">{t('footer.rights')}</p>
              </div>
            </footer>
          </motion.div>
        )}

        {/* --- Result View --- */}
        {view === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-[calc(100vh-64px)] flex flex-col overflow-hidden"
          >
            {/* Top Bar */}
            <div className="p-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between z-20">
              <button 
                onClick={() => setView('setup')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors font-bold text-[10px] md:text-sm"
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${language === 'fa' ? 'rotate-180' : ''}`} />
                <span className="hidden sm:inline">{t('result.back')}</span>
                <span className="sm:hidden">{language === 'fa' ? 'بازگشت' : 'BACK'}</span>
              </button>
              <h1 className="text-xl font-black tracking-tighter text-violet-600 dark:text-violet-400 hidden md:block">{t('result.title')}</h1>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-all" title="Zoom In"><ZoomIn className="w-5 h-5" /></button>
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.1))} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-all" title="Zoom Out"><ZoomOut className="w-5 h-5" /></button>
                <button 
                  onClick={() => {
                    if (canvasRef.current && resultContainerRef.current) {
                      const container = resultContainerRef.current;
                      const scaleX = (container.clientWidth - 64) / canvasSize.width;
                      const scaleY = (container.clientHeight - 64) / canvasSize.height;
                      setZoom(Math.min(scaleX, scaleY));
                      setTimeout(() => {
                        container.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                      }, 50);
                    }
                  }} 
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-all" 
                  title="Fit to Screen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    if (canvasRef.current) {
                      setZoomImage(canvasRef.current.toDataURL('image/png'));
                      setShowZoomModal(true);
                    }
                  }}
                  className="p-2 bg-violet-600 dark:bg-violet-500 hover:bg-violet-500 dark:hover:bg-violet-400 text-white dark:text-zinc-950 rounded-lg transition-all"
                  title="Fullscreen Preview"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div ref={resultContainerRef} className="flex-1 bg-zinc-100 dark:bg-zinc-950 relative overflow-auto custom-scrollbar">
              <div className="min-h-full min-w-full flex items-center justify-center p-4 md:p-12">
                <div className="absolute inset-0 opacity-5 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                
                {isGenerating && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl">
                    <div className="relative w-40 h-40 mb-10">
                      <div className="absolute inset-0 border-8 border-violet-500/5 dark:border-violet-500/10 rounded-full" />
                      <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]">
                        <circle 
                          cx="80" cy="80" r="72" 
                          fill="none" stroke="currentColor" strokeWidth="8"
                          className="text-violet-600 dark:text-violet-500 transition-all duration-500 ease-out"
                          strokeDasharray={452.4}
                          strokeDashoffset={452.4 - (452.4 * progress) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{progress}%</span>
                        <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest animate-pulse">
                          {language === 'fa' ? 'در حال پردازش' : 'PROCESSING'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center space-y-3 px-6">
                      <p className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-none">
                        {t('result.generating.title')}
                      </p>
                      <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed">
                        {t('result.generating.desc')}
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-6 text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6">
                      <X className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 uppercase">{t('result.failed.title')}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">{error}</p>
                    <button 
                      onClick={() => setView('setup')}
                      className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                      {t('result.failed.back')}
                    </button>
                  </div>
                )}

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isRendered ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative origin-center"
                  style={{ display: isRendered ? 'block' : 'none' }}
                >
                  <canvas 
                    ref={canvasRef} 
                    className="shadow-2xl rounded-sm border border-zinc-200 dark:border-zinc-800/50 transition-all duration-200 ease-out"
                    style={{ 
                      backgroundColor: options.bgColor === 'transparent' ? 'transparent' : options.bgColor,
                      width: canvasSize.width ? `${canvasSize.width * zoom}px` : 'auto',
                      height: canvasSize.height ? `${canvasSize.height * zoom}px` : 'auto'
                    }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-center gap-4 z-20">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowDownloadModal(true)}
                  className="flex items-center gap-2 bg-violet-600 dark:bg-violet-500 hover:bg-violet-500 dark:hover:bg-violet-400 text-white dark:text-zinc-950 font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-violet-500/20"
                >
                  <Download className="w-5 h-4" />
                  {t('action.download')}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadText}
                  className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  {t('action.save')}
                </button>
                <button 
                  onClick={handleCopyText}
                  className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {t('action.copy')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ZoomModal 
        isOpen={showZoomModal} 
        onClose={() => setShowZoomModal(false)} 
        imageSrc={zoomImage}
        onDownload={() => {
          setItemToDownload(null);
          setShowDownloadModal(true);
        }}
      />

      <CharacterPicker
        isOpen={showCharPicker}
        onClose={() => setShowCharPicker(false)}
        mode={options.mode === 'emoji' ? 'emoji' : 'ascii'}
        onSelect={(char) => setOptions({ ...options, chars: char })}
      />

      {/* Download Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDownloadModal(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 p-8"
            >
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-6 uppercase tracking-tight text-center">
                {language === 'fa' ? 'انتخاب فرمت دانلود' : 'Select Format'}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {(['png', 'jpg', 'webp'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownloadWithFormat(format === 'jpg' ? 'jpeg' : format)}
                    className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-500 hover:text-white rounded-2xl font-black text-sm transition-all uppercase tracking-widest"
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="w-full mt-6 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {language === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-24 left-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-red-500 text-white border-red-400'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAppLoading && (
          <AppLoadingScreen language={language} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
