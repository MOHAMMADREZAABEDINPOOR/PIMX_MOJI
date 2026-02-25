import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smile, Hash, Type, ChevronRight, ChevronLeft } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useSettings } from '../contexts/SettingsContext';

interface CharacterPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (char: string) => void;
  mode: 'ascii' | 'emoji';
}

const ASCII_SETS = [
  { name: 'Standard', chars: ' .:-=+*#%@' },
  { name: 'Blocks', chars: ' ░▒▓█' },
  { name: 'Extended Blocks', chars: ' ▀   ▂▃▄▅▆▇█▉▊▋▌▍▎▏▐░▒▓' },
  { name: 'Shapes', chars: ' ○◌◍◎●◐◑◒◓◔◕◖◗◘◙◚◛◜◝◞◟◠◡◢◣◤◥◦◧◨◩◪◫◬◭◮' },
  { name: 'Lines', chars: ' ─│┌┐└┘├┤┬┴┼━┃┏┓┗┛┣┫┳┻╋┠┨┯┷┿' },
  { name: 'Arrows', chars: ' ←↑→↓↔↕↖↗↘↙↚↛↜↝↞↟↠↡↢↣↤↥↦↧↨↩↪↫↬↭↮↯' },
  { name: 'Math', chars: ' ±×÷√∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳∴∵∶∷∸∹∺∻∼∽∾∿≀' },
  { name: 'Alphabetic', chars: ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' },
  { name: 'Alphanumeric', chars: ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' },
  { name: 'Matrix', chars: ' ﾘｹﾒｶﾀｼﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' },
  { name: 'Braille', chars: ' ⠁⠃⠇⡇⣇⣧⣷⣿' },
  { name: 'Code Page 437', chars: ' ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼' },
];

export function CharacterPicker({ isOpen, onClose, onSelect, mode }: CharacterPickerProps) {
  const { theme } = useSettings();
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
                  {mode === 'emoji' ? <Smile className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                  {mode === 'emoji' ? 'Emoji Picker' : 'Character Picker'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {mode === 'emoji' ? (
                <div className="emoji-picker-container">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      onSelect(emojiData.emoji);
                      onClose();
                    }}
                    theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                    width="100%"
                    height="400px"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {ASCII_SETS.map((set, i) => (
                      <button
                        key={set.name}
                        onClick={() => setActiveTab(i)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === i ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                      >
                        {set.name}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {ASCII_SETS[activeTab].chars.split('').map((char, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onSelect(char);
                          onClose();
                        }}
                        className="aspect-square flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xl font-mono hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all"
                      >
                        {char === ' ' ? '␣' : char}
                      </button>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        onSelect(ASCII_SETS[activeTab].chars);
                        onClose();
                      }}
                      className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Use Entire Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
