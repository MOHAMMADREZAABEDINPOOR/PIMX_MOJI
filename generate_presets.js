import fs from 'fs';

const existingPresetsCount = 48;
const targetCount = 136;
const needed = targetCount - existingPresetsCount;

const themes = [
  { name: 'Neon', color: 'text-pink-500', chars: ' .:-=+*#%@', colorize: true, bgColor: '#000000', shadowBlur: 10, shadowColor: '#ff00ff' },
  { name: 'Cyber', color: 'text-cyan-500', chars: ' 01', colorize: true, bgColor: '#001122', contrast: 150 },
  { name: 'Retro', color: 'text-orange-500', chars: ' ░▒▓█', colorize: true, bgColor: '#220000', saturation: 150 },
  { name: 'Nature', color: 'text-green-500', chars: ' 🌱🌿🌳🌲🍃', bgColor: '#000000' },
  { name: 'Space', color: 'text-purple-500', chars: ' 🌌🌠🪐☄️', bgColor: '#000000' },
  { name: 'Abstract', color: 'text-yellow-500', chars: ' ▲▼◀▶', colorize: true, bgColor: '#000000' },
  { name: 'Glitch', color: 'text-red-500', chars: ' █▓▒░', colorize: true, bgColor: '#000000', contrast: 200 },
  { name: 'Minimal', color: 'text-zinc-500', chars: ' . ', textColor: '#000000', bgColor: '#ffffff', invert: true },
  { name: 'Tech', color: 'text-blue-500', chars: ' ─│┌┐└┘├┤┬┴┼', textColor: '#00ffff', bgColor: '#000000' },
  { name: 'Magic', color: 'text-fuchsia-500', chars: ' ✨🌟💫', bgColor: '#000000' },
  { name: 'Dark', color: 'text-zinc-800', chars: ' ⸸☠⛧', textColor: '#ffffff', bgColor: '#000000' },
];

let newPresets = '';

for (let i = 1; i <= needed; i++) {
  const theme = themes[i % themes.length];
  const id = `preset_${existingPresetsCount + i}`;
  const name = `${theme.name} ${Math.ceil(i / themes.length)}`;
  
  const options = {
    mode: theme.chars.includes('🌱') || theme.chars.includes('🌌') || theme.chars.includes('✨') ? 'emoji' : (theme.chars.includes('▲') ? 'mosaic' : 'ascii'),
    chars: theme.chars,
    colorize: theme.colorize || false,
    bgColor: theme.bgColor || '#000000',
    textColor: theme.textColor || '#ffffff',
    contrast: theme.contrast || 100,
    saturation: theme.saturation || 100,
    shadowBlur: theme.shadowBlur || 0,
    shadowColor: theme.shadowColor || '#000000',
    invert: theme.invert || false
  };

  const optionsStr = JSON.stringify(options).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'");
  
  newPresets += `  { id: '${id}', name: '${name}', color: '${theme.color}', options: ${optionsStr}, previewImg: 'https://picsum.photos/seed/${id}/400/400' },\n`;
}

const fileContent = fs.readFileSync('src/constants/presets.ts', 'utf-8');
const updatedContent = fileContent.replace('];\n', newPresets + '];\n');
fs.writeFileSync('src/constants/presets.ts', updatedContent);

console.log('Added ' + needed + ' presets.');
