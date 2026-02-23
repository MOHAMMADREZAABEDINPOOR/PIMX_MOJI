import { Moon, Sun, Languages } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export function Navbar() {
  const { theme, toggleTheme, toggleLanguage, language, t } = useSettings();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">
              {t('hero.title.prefix')}<span className="text-violet-500">{t('hero.title.suffix')}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              aria-label="Toggle Language"
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Languages className="w-4 h-4" />
                <span>{language === 'en' ? 'FA' : 'EN'}</span>
              </div>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
