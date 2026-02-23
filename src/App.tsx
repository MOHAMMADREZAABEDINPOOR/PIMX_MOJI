import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Download, Copy, Settings2, Type, Smile, Hash, 
  SlidersHorizontal, Palette, FileText, Wand2, ZoomIn, ZoomOut, 
  Maximize, ArrowLeft, Send, Twitter, Smartphone, Music, ShieldCheck, Zap, X, ChevronRight, Sparkles, Check
} from 'lucide-react';
import { generateArt, generateText, ArtOptions } from './utils/imageProcessing';
import { motion, AnimatePresence } from 'motion/react';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { Navbar } from './components/Navbar';

// --- Components ---

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

// --- Main App Content ---

type View = 'home' | 'setup' | 'result';

function AppContent() {
  const { t, language } = useSettings();
  const [view, setView] = useState<View>('home');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
  
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportQuality, setExportQuality] = useState<number>(0.9);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger generation whenever view changes to result or options change
  useEffect(() => {
    if (view === 'result' && image) {
      const controller = new AbortController();
      let isMounted = true;

      const render = async () => {
        // Poll for canvas ref availability (max 1 second)
        let attempts = 0;
        while (!canvasRef.current && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 50));
          attempts++;
        }
        
        if (!canvasRef.current) {
          console.error("Canvas ref not found after polling");
          if (isMounted) setError("Canvas initialization failed. Please try again.");
          return;
        }

        try {
          if (isMounted) {
            setIsGenerating(true);
            setProgress(0);
            setError(null);
            await generateArt(image, canvasRef.current, options, (p) => {
              if (isMounted) setProgress(p);
            }, controller.signal);
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('Generation aborted');
            return;
          }
          console.error("Art generation failed:", err);
          if (isMounted) setError(err.message || "Generation failed. Try reducing resolution.");
        } finally {
          if (isMounted && !controller.signal.aborted) {
            setIsGenerating(false);
            // Auto fit to screen after generation
            setTimeout(() => {
              if (canvasRef.current) {
                const padding = window.innerWidth < 768 ? 32 : 64;
                const availableWidth = window.innerWidth - padding;
                const availableHeight = window.innerHeight - 200; // Account for header/footer
                const scaleX = availableWidth / canvasRef.current.width;
                const scaleY = availableHeight / canvasRef.current.height;
                setZoom(Math.min(scaleX, scaleY, 1));
              }
            }, 100);
          }
        }
      };
      
      render();
      
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
    setOptions({ ...options, mode, chars: defaultChars, colorize: defaultColorize });
  };

  const applyPreset = (preset: string) => {
    const base = { ...options, brightness: 100, contrast: 100, saturation: 100, invert: false, colorize: false, resolution: 140, fontFamily: 'monospace', fontWeight: 'bold', threshold: 0, spacing: 1.0, shadowBlur: 0 };
    switch (preset) {
      case 'matrix':
        setOptions({ 
          ...base, 
          mode: 'ascii', 
          chars: '      .:-+=;ﾘｹﾒｶﾀｼﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ', 
          textColor: '#00ff41', 
          bgColor: '#000000', 
          brightness: 110, 
          contrast: 220, 
          shadowBlur: 4,
          shadowColor: '#00ff41',
          threshold: 40,
          spacing: 1.2
        });
        break;
      case 'cyberpunk':
        setOptions({ ...base, mode: 'ascii', chars: '░▒▓█', colorize: true, bgColor: '#05000a', contrast: 170, saturation: 180, shadowBlur: 10, shadowColor: '#ff00ff' });
        break;
      case 'blueprint':
        setOptions({ ...base, mode: 'ascii', chars: ' .|+*#', textColor: '#ffffff', bgColor: '#0a3d91', invert: true, contrast: 130 });
        break;
      case 'newspaper':
        setOptions({ ...base, mode: 'ascii', chars: ' .,:;irsXA253hMHGS#9B&@', textColor: '#111111', bgColor: '#f4f4f0', invert: true, fontFamily: 'serif', contrast: 140, saturation: 0 });
        break;
      case 'retro-game':
        setOptions({ ...base, mode: 'mosaic', chars: '■□', colorize: true, bgColor: '#000000', resolution: 80, contrast: 160 });
        break;
      case 'braille':
        setOptions({ ...base, mode: 'ascii', chars: ' ⠁⠃⠇⡇⣇⣧⣷⣿', colorize: true, bgColor: '#000000' });
        break;
      case 'binary':
        setOptions({ ...base, mode: 'ascii', chars: '01', textColor: '#ffffff', bgColor: '#000000', contrast: 200 });
        break;
      case 'hearts':
        setOptions({ ...base, mode: 'emoji', chars: '🖤🤎❤️🧡💛💚💙💜🤍', bgColor: '#000000' });
        break;
      case 'terminal':
        setOptions({ ...base, mode: 'ascii', chars: ' #_@', textColor: '#00ff00', bgColor: '#000000', fontFamily: 'monospace', contrast: 150 });
        break;
      case 'gold':
        setOptions({ ...base, mode: 'ascii', chars: ' .:+*#%@', textColor: '#ffd700', bgColor: '#1a1a1a', shadowBlur: 8, shadowColor: '#ffd700', contrast: 130 });
        break;
      case 'vaporwave':
        setOptions({ ...base, mode: 'ascii', chars: '░▒▓█', colorize: true, bgColor: '#2d004d', saturation: 200, contrast: 150, shadowBlur: 15, shadowColor: '#00ffff' });
        break;
      case 'sketch':
        setOptions({ ...base, mode: 'ascii', chars: ' /\\|-_', textColor: '#000000', bgColor: '#ffffff', invert: true, contrast: 180, saturation: 0 });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-violet-500/30 overflow-x-hidden transition-colors duration-300">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-zinc-200 dark:border-zinc-900 w-full max-w-4xl">
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
                <div>
                  <div className="text-3xl font-black text-zinc-900 dark:text-white">∞</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{t('stats.possibilities')}</div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="relative z-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-900 p-8 md:p-24 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto space-y-32">
                
                {/* Ecosystem Section */}
                <div className="space-y-24">
                  <div className="max-w-4xl space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-[10px] font-black tracking-widest uppercase">
                      THE NETWORK
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white leading-[0.9] tracking-tighter">
                      {t('ecosystem.title')}
                    </h2>
                    <div className="space-y-8">
                      <p className="text-2xl md:text-4xl text-zinc-600 dark:text-zinc-400 leading-tight font-bold">
                        {t('ecosystem.desc')}
                      </p>
                      <div className="h-px w-24 bg-zinc-900 dark:bg-white/20"></div>
                      <p className="text-xl text-zinc-500 dark:text-zinc-500 leading-relaxed max-w-3xl font-medium">
                        {t('ecosystem.detailed_desc')}
                      </p>
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
                              START CONNECTING <ChevronRight className={`w-5 h-5 ${language === 'fa' ? 'rotate-180' : ''}`} />
                            </a>
                            <a 
                              href="https://t.me/PIMX_PASS" 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black px-8 py-4 rounded-[20px] transition-all active:scale-95 text-base border border-zinc-200 dark:border-zinc-800"
                            >
                              <Send className="w-5 h-5" />
                              CHANNEL
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
                              START DOWNLOADING <ChevronRight className={`w-5 h-5 ${language === 'fa' ? 'rotate-180' : ''}`} />
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
                              START STREAMING <ChevronRight className={`w-5 h-5 ${language === 'fa' ? 'rotate-180' : ''}`} />
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

                {/* Documentation / How it works */}
                <div className="space-y-16 pt-32 border-t border-zinc-200 dark:border-zinc-900">
                  <div className="max-w-3xl space-y-6">
                    <div className="text-xs font-black tracking-[0.2em] text-violet-600 dark:text-violet-500 uppercase">
                      CORE TECHNOLOGY
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                      HOW IT WORKS
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="group p-10 rounded-[40px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/10">
                      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-8 group-hover:scale-110 transition-transform duration-500">
                        <Type className="w-8 h-8" />
                      </div>
                      <div className="text-5xl font-black text-zinc-100 dark:text-zinc-900 mb-4">01</div>
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">{t('feature.mosaic.title')}</h3>
                      <p className="text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium">
                        {t('feature.mosaic.desc')}
                      </p>
                    </div>

                    <div className="group p-10 rounded-[40px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-8 group-hover:scale-110 transition-transform duration-500">
                        <Hash className="w-8 h-8" />
                      </div>
                      <div className="text-5xl font-black text-zinc-100 dark:text-zinc-900 mb-4">02</div>
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">{t('feature.ascii.title')}</h3>
                      <p className="text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium">
                        {t('feature.ascii.desc')}
                      </p>
                    </div>

                    <div className="group p-10 rounded-[40px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500">
                        <Smile className="w-8 h-8" />
                      </div>
                      <div className="text-5xl font-black text-zinc-100 dark:text-zinc-900 mb-4">03</div>
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">{t('feature.emoji.title')}</h3>
                      <p className="text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium">
                        {t('feature.emoji.desc')}
                      </p>
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

            <div className="flex-1 overflow-y-auto p-6 md:p-12">
              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Left Column: Upload */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{t('setup.step1.title')}</h2>
                    <p className="text-zinc-600 dark:text-zinc-500 font-medium">{t('setup.step1.desc')}</p>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`group border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all ${image ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-300 dark:border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 bg-white dark:bg-zinc-900/30'}`}
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
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{t('setup.step2.title')}</h2>
                    <p className="text-zinc-600 dark:text-zinc-500 font-medium">{t('setup.step2.desc')}</p>
                  </div>

                  <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-[32px] p-8 space-y-2 shadow-sm">
                    <Section title={t('section.presets')} icon={Wand2}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'matrix', color: 'text-green-500 dark:text-green-400' },
                          { id: 'cyberpunk', color: 'text-pink-500 dark:text-pink-400' },
                          { id: 'blueprint', color: 'text-blue-500 dark:text-blue-400' },
                          { id: 'newspaper', color: 'text-zinc-600 dark:text-zinc-300' },
                          { id: 'retro-game', color: 'text-orange-500 dark:text-orange-400' },
                          { id: 'braille', color: 'text-zinc-600 dark:text-zinc-300' },
                          { id: 'binary', color: 'text-zinc-600 dark:text-zinc-300' },
                          { id: 'hearts', color: 'text-pink-500 dark:text-pink-400' },
                          { id: 'terminal', color: 'text-emerald-500 dark:text-emerald-400' },
                          { id: 'gold', color: 'text-yellow-600 dark:text-yellow-500' },
                          { id: 'vaporwave', color: 'text-cyan-500 dark:text-cyan-400' },
                          { id: 'sketch', color: 'text-zinc-500 dark:text-zinc-400' },
                        ].map((preset) => (
                          <button 
                            key={preset.id}
                            onClick={() => applyPreset(preset.id)} 
                            className={`bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl text-[10px] font-bold ${preset.color} transition-colors uppercase tracking-wider`}
                          >
                            {t(`preset.${preset.id.replace('-game', '')}`)}
                          </button>
                        ))}
                      </div>
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
                        <input 
                          type="text" 
                          value={options.chars}
                          onChange={(e) => setOptions({ ...options, chars: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-zinc-900 dark:text-zinc-200"
                        />
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
                            type="range" min="20" max="300" 
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
                </div>
              </div>
            </div>

            {/* Floating Action Button for Mobile */}
            <div className="fixed bottom-8 end-8 z-40 lg:hidden">
              <button 
                onClick={handleGenerate}
                disabled={!image}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${image ? 'bg-violet-600 dark:bg-violet-500 hover:bg-violet-500 dark:hover:bg-violet-400 text-white dark:text-zinc-950 shadow-violet-500/40' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
              >
                {isGenerating ? (
                  <div className="w-6 h-6 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-8 h-8" />
                )}
              </button>
            </div>
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
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors font-bold text-sm"
              >
                <ArrowLeft className={`w-4 h-4 ${language === 'fa' ? 'rotate-180' : ''}`} />
                {t('result.back')}
              </button>
              <h1 className="text-xl font-black tracking-tighter text-violet-600 dark:text-violet-400 hidden md:block">{t('result.title')}</h1>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-all"><ZoomIn className="w-5 h-5" /></button>
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.1))} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-all"><ZoomOut className="w-5 h-5" /></button>
                <button onClick={() => setZoom(1)} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-all"><Maximize className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 relative overflow-auto custom-scrollbar flex items-center justify-center p-4 md:p-8">
              <div className="absolute inset-0 opacity-5 pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              
              {isGenerating && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
                  <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-8 border-violet-500/10 rounded-full" />
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle 
                        cx="64" cy="64" r="56" 
                        fill="none" stroke="currentColor" strokeWidth="8"
                        className="text-violet-500 transition-all duration-500 ease-out"
                        strokeDasharray={351.8}
                        strokeDashoffset={351.8 - (351.8 * progress) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-zinc-900 dark:text-white">{progress}%</span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Processing</span>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">{t('result.generating.title')}</p>
                    <p className="text-sm text-zinc-500 font-medium max-w-xs mx-auto">{t('result.generating.desc')}</p>
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
                animate={{ scale: zoom, opacity: isGenerating ? 0.3 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative origin-center"
              >
                <canvas 
                  ref={canvasRef} 
                  className="shadow-2xl rounded-sm border border-zinc-200 dark:border-zinc-800/50 transition-all"
                  style={{ backgroundColor: options.bgColor === 'transparent' ? 'transparent' : options.bgColor }}
                />
              </motion.div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-center gap-4 z-20">
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <select 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="bg-transparent border-0 text-xs font-bold text-zinc-600 dark:text-zinc-400 focus:ring-0 px-3 cursor-pointer"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WEBP</option>
                </select>
                <button 
                  onClick={handleDownloadImage}
                  className="flex items-center gap-2 bg-violet-600 dark:bg-violet-500 hover:bg-violet-500 dark:hover:bg-violet-400 text-white dark:text-zinc-950 font-black px-6 py-3 rounded-lg transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
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
