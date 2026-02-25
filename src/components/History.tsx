import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Download, Clock, Shield, Wand2 } from 'lucide-react';
import { ArtOptions } from '../utils/imageProcessing';
import { useSettings } from '../contexts/SettingsContext';

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageData: string;
  options: ArtOptions;
  name?: string;
  styleId?: string | null;
  styleLabel?: string;
}

interface HistoryProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
  onDownload: (item: HistoryItem) => void;
  onApply: (item: HistoryItem) => void;
}

export function History({ items, onDelete, onDownload, onApply }: HistoryProps) {
  const { t, language } = useSettings();

  const formatDate = (ts: number) => {
    if (language === 'fa') {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(ts));
    }
    return new Intl.DateTimeFormat('en-US').format(new Date(ts));
  };

  const getStyleName = (item: HistoryItem) => {
    if (item.styleId) {
      const key = `preset.${item.styleId}`;
      const translated = t(key);
      if (translated !== key) return translated;
    }
    if (item.styleLabel) return item.styleLabel;
    return item.options.mode.toUpperCase();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400">
          <Clock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('history.empty.title')}</h3>
          <p className="text-sm text-zinc-500 max-w-xs">{t('history.empty.desc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
        <Shield className="w-5 h-5 flex-shrink-0" />
        <p className="text-xs font-bold leading-tight">
          {t('history.security')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-950 relative overflow-hidden">
                <img src={item.imageData} alt="History Art" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => onApply(item)}
                    className="p-3 bg-white text-zinc-950 rounded-full hover:bg-violet-500 hover:text-white transition-colors shadow-lg group/btn relative"
                    title={t('history.action.use')}
                  >
                    <Wand2 className="w-5 h-5" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {t('history.action.use')}
                    </span>
                  </button>
                  <button
                    onClick={() => onDownload(item)}
                    className="p-3 bg-white text-zinc-950 rounded-full hover:bg-emerald-500 hover:text-white transition-colors shadow-lg group/btn relative"
                    title={t('history.action.download')}
                  >
                    <Download className="w-5 h-5" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {t('history.action.download')}
                    </span>
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-3 bg-white text-zinc-950 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-lg group/btn relative"
                    title={t('history.action.delete')}
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {t('history.action.delete')}
                    </span>
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1 text-[11px] font-black text-zinc-700 dark:text-zinc-200">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="break-words">{getStyleName(item)}</span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {formatDate(item.timestamp)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(item.options.chars).slice(0, 5).map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                      {c === ' ' ? '␣' : c}
                    </span>
                  ))}
                  {Array.from(item.options.chars).length > 5 && <span className="text-[10px] text-zinc-400">...</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
