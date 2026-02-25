import fs from 'fs';

const newPresets = [
  { id: 'cyber_grid', name: 'Cyber Grid', color: 'text-cyan-400', options: { mode: 'ascii', chars: ' ┼┼', colorize: true, bgColor: '#001122', textColor: '#00ffff', contrast: 150 }, previewImg: 'https://picsum.photos/seed/cybergrid/400/400' },
  { id: 'neon_tokyo', name: 'Neon Tokyo', color: 'text-pink-500', options: { mode: 'ascii', chars: ' ░▒▓█', colorize: true, bgColor: '#0a001a', saturation: 200, contrast: 150 }, previewImg: 'https://picsum.photos/seed/neontokyo/400/400' },
  { id: 'hologram', name: 'Hologram', color: 'text-cyan-300', options: { mode: 'ascii', chars: ' ─│┌┐└┘', textColor: '#00ffff', bgColor: '#000000', shadowBlur: 10, shadowColor: '#00ffff' }, previewImg: 'https://picsum.photos/seed/hologram/400/400' },
  { id: 'synthwave', name: 'Synthwave', color: 'text-purple-500', options: { mode: 'mosaic', chars: ' ▲▼◀▶', colorize: true, bgColor: '#1a0033', shadowBlur: 15, shadowColor: '#ff00ff' }, previewImg: 'https://picsum.photos/seed/synthwave/400/400' },
  { id: 'blood_moon', name: 'Blood Moon', color: 'text-red-600', options: { mode: 'emoji', chars: '🌑🌒🌓🌔🌕🩸', bgColor: '#110000' }, previewImg: 'https://picsum.photos/seed/bloodmoon/400/400' },
  { id: 'alien_tech', name: 'Alien Tech', color: 'text-green-400', options: { mode: 'ascii', chars: ' ⍙⍚⍛⍜⍝⍞⍟', textColor: '#39ff14', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/alientech/400/400' },
  { id: 'matrix_red', name: 'Red Matrix', color: 'text-red-500', options: { mode: 'ascii', chars: ' 01', textColor: '#ff0000', bgColor: '#000000', shadowBlur: 5, shadowColor: '#ff0000' }, previewImg: 'https://picsum.photos/seed/matrixred/400/400' },
  { id: 'golden_ratio', name: 'Golden Ratio', color: 'text-yellow-500', options: { mode: 'ascii', chars: ' φΦ', textColor: '#ffd700', bgColor: '#1a1a1a' }, previewImg: 'https://picsum.photos/seed/goldenratio/400/400' },
  { id: 'crystal', name: 'Crystal', color: 'text-cyan-200', options: { mode: 'ascii', chars: ' ✧✦💎', textColor: '#e0ffff', bgColor: '#001122' }, previewImg: 'https://picsum.photos/seed/crystal/400/400' },
  { id: 'steampunk', name: 'Steampunk', color: 'text-amber-700', options: { mode: 'ascii', chars: ' ⚙🔩🔧', textColor: '#b87333', bgColor: '#2b1d14' }, previewImg: 'https://picsum.photos/seed/steampunk/400/400' },
  { id: 'gothic_rose', name: 'Gothic Rose', color: 'text-red-800', options: { mode: 'emoji', chars: '🥀🖤🦇', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/gothicrose/400/400' },
  { id: 'cyber_city', name: 'Cyber City', color: 'text-indigo-500', options: { mode: 'emoji', chars: '🏙️🌃🛸', bgColor: '#050011' }, previewImg: 'https://picsum.photos/seed/cybercity/400/400' },
  { id: 'retro_wave', name: 'Retro Wave', color: 'text-purple-600', options: { mode: 'ascii', chars: ' ░▒▓█', colorize: true, bgColor: '#2d004d', contrast: 180 }, previewImg: 'https://picsum.photos/seed/retrowave/400/400' },
  { id: 'neon_sign', name: 'Neon Sign', color: 'text-fuchsia-500', options: { mode: 'ascii', chars: ' ━┃┏┓┗┛', textColor: '#ff00ff', bgColor: '#000000', shadowBlur: 20, shadowColor: '#ff00ff' }, previewImg: 'https://picsum.photos/seed/neonsign/400/400' },
  { id: 'hacker_green', name: 'Hacker Green', color: 'text-green-500', options: { mode: 'ascii', chars: ' 0101', textColor: '#00ff00', bgColor: '#000000', contrast: 200 }, previewImg: 'https://picsum.photos/seed/hackergreen/400/400' },
  { id: 'vintage_sepia', name: 'Vintage Sepia', color: 'text-yellow-800', options: { mode: 'ascii', chars: ' ░▒▓█', textColor: '#704214', bgColor: '#f5deb3', invert: true }, previewImg: 'https://picsum.photos/seed/vintagesepia/400/400' },
  { id: 'pop_art_dots', name: 'Pop Art Dots', color: 'text-yellow-400', options: { mode: 'ascii', chars: ' ●', colorize: true, bgColor: '#ffff00', resolution: 40 }, previewImg: 'https://picsum.photos/seed/popartdots/400/400' },
  { id: 'comic_book', name: 'Comic Book', color: 'text-red-500', options: { mode: 'ascii', chars: ' 💥🗯️', colorize: true, bgColor: '#ffffff', invert: true }, previewImg: 'https://picsum.photos/seed/comicbook/400/400' },
  { id: 'watercolor', name: 'Watercolor', color: 'text-blue-300', options: { mode: 'ascii', chars: ' ░▒▓█', colorize: true, bgColor: '#ffffff', invert: true, saturation: 150 }, previewImg: 'https://picsum.photos/seed/watercolor/400/400' },
  { id: 'oil_painting', name: 'Oil Painting', color: 'text-amber-600', options: { mode: 'mosaic', chars: ' █', colorize: true, bgColor: '#000000', resolution: 60 }, previewImg: 'https://picsum.photos/seed/oilpainting/400/400' },
  { id: 'stained_glass', name: 'Stained Glass', color: 'text-indigo-400', options: { mode: 'mosaic', chars: ' ⬡⬢', colorize: true, bgColor: '#000000', resolution: 50 }, previewImg: 'https://picsum.photos/seed/stainedglass/400/400' },
  { id: 'ascii_classic', name: 'ASCII Classic', color: 'text-zinc-300', options: { mode: 'ascii', chars: ' .:-=+*#%@', textColor: '#ffffff', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/asciiclassic/400/400' },
  { id: 'braille_dark', name: 'Braille Dark', color: 'text-zinc-500', options: { mode: 'ascii', chars: ' ⠁⠃⠇⡇⣇⣧⣷⣿', textColor: '#ffffff', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/brailledark/400/400' },
  { id: 'binary_code', name: 'Binary Code', color: 'text-green-400', options: { mode: 'ascii', chars: ' 01', textColor: '#00ff00', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/binarycode/400/400' },
  { id: 'hex_code', name: 'Hex Code', color: 'text-cyan-400', options: { mode: 'ascii', chars: ' 0123456789ABCDEF', textColor: '#00ffff', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/hexcode/400/400' },
  { id: 'dna_strand', name: 'DNA Strand', color: 'text-fuchsia-400', options: { mode: 'ascii', chars: ' ⚯⚮', textColor: '#ff00ff', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/dnastrand/400/400' },
  { id: 'constellation', name: 'Constellation', color: 'text-blue-200', options: { mode: 'ascii', chars: ' ✨⋆', textColor: '#ffffff', bgColor: '#000022' }, previewImg: 'https://picsum.photos/seed/constellation/400/400' },
  { id: 'snowfall', name: 'Snowfall', color: 'text-blue-100', options: { mode: 'emoji', chars: '❄️🌨️⛄', bgColor: '#001133' }, previewImg: 'https://picsum.photos/seed/snowfall/400/400' },
  { id: 'autumn', name: 'Autumn', color: 'text-orange-600', options: { mode: 'emoji', chars: '🍂🍁🍄', bgColor: '#221100' }, previewImg: 'https://picsum.photos/seed/autumn/400/400' },
  { id: 'spring', name: 'Spring', color: 'text-pink-300', options: { mode: 'emoji', chars: '🌸🌺🌷', bgColor: '#112200' }, previewImg: 'https://picsum.photos/seed/spring/400/400' },
  { id: 'summer', name: 'Summer', color: 'text-yellow-400', options: { mode: 'emoji', chars: '☀️🏖️🌊', bgColor: '#002233' }, previewImg: 'https://picsum.photos/seed/summer/400/400' },
  { id: 'volcano', name: 'Volcano', color: 'text-red-600', options: { mode: 'emoji', chars: '🌋🔥☄️', bgColor: '#220000' }, previewImg: 'https://picsum.photos/seed/volcano/400/400' },
  { id: 'thunder', name: 'Thunder', color: 'text-yellow-300', options: { mode: 'emoji', chars: '⚡⛈️🌩️', bgColor: '#000011' }, previewImg: 'https://picsum.photos/seed/thunder/400/400' },
  { id: 'tornado', name: 'Tornado', color: 'text-zinc-400', options: { mode: 'emoji', chars: '🌪️💨', bgColor: '#111111' }, previewImg: 'https://picsum.photos/seed/tornado/400/400' },
  { id: 'earthquake', name: 'Earthquake', color: 'text-amber-800', options: { mode: 'emoji', chars: '💥🏚️', bgColor: '#221100' }, previewImg: 'https://picsum.photos/seed/earthquake/400/400' },
  { id: 'tsunami', name: 'Tsunami', color: 'text-blue-500', options: { mode: 'emoji', chars: '🌊💦', bgColor: '#001122' }, previewImg: 'https://picsum.photos/seed/tsunami/400/400' },
  { id: 'meteor', name: 'Meteor', color: 'text-orange-500', options: { mode: 'emoji', chars: '☄️🌠', bgColor: '#000022' }, previewImg: 'https://picsum.photos/seed/meteor/400/400' },
  { id: 'black_hole', name: 'Black Hole', color: 'text-zinc-900', options: { mode: 'emoji', chars: '🌌⚫', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/blackhole/400/400' },
  { id: 'supernova', name: 'Supernova', color: 'text-purple-400', options: { mode: 'emoji', chars: '💥✨', bgColor: '#110022' }, previewImg: 'https://picsum.photos/seed/supernova/400/400' },
  { id: 'nebula', name: 'Nebula', color: 'text-fuchsia-600', options: { mode: 'ascii', chars: ' ░▒▓█', colorize: true, bgColor: '#1a0033', saturation: 200 }, previewImg: 'https://picsum.photos/seed/nebula/400/400' },
  { id: 'galaxy', name: 'Galaxy', color: 'text-indigo-300', options: { mode: 'ascii', chars: ' ✧✦★', colorize: true, bgColor: '#000022' }, previewImg: 'https://picsum.photos/seed/galaxy/400/400' },
  { id: 'milky_way', name: 'Milky Way', color: 'text-zinc-200', options: { mode: 'ascii', chars: ' .:-=+*#%@', colorize: true, bgColor: '#000011' }, previewImg: 'https://picsum.photos/seed/milkyway/400/400' },
  { id: 'solar_system', name: 'Solar System', color: 'text-yellow-500', options: { mode: 'emoji', chars: '☀️🌍🌕', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/solarsystem/400/400' },
  { id: 'alien_planet', name: 'Alien Planet', color: 'text-green-600', options: { mode: 'emoji', chars: '🪐👽🛸', bgColor: '#001100' }, previewImg: 'https://picsum.photos/seed/alienplanet/400/400' },
  { id: 'robot_army', name: 'Robot Army', color: 'text-zinc-500', options: { mode: 'emoji', chars: '🤖🦾', bgColor: '#111111' }, previewImg: 'https://picsum.photos/seed/robotarmy/400/400' },
  { id: 'cyborg', name: 'Cyborg', color: 'text-zinc-400', options: { mode: 'emoji', chars: '🦾🦿', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/cyborg/400/400' },
  { id: 'ai_brain', name: 'AI Brain', color: 'text-pink-400', options: { mode: 'emoji', chars: '🧠⚡', bgColor: '#001122' }, previewImg: 'https://picsum.photos/seed/aibrain/400/400' },
  { id: 'quantum', name: 'Quantum', color: 'text-cyan-500', options: { mode: 'ascii', chars: ' 01', colorize: true, bgColor: '#000011' }, previewImg: 'https://picsum.photos/seed/quantum/400/400' },
  { id: 'vr_world', name: 'VR World', color: 'text-purple-500', options: { mode: 'ascii', chars: ' ░▒▓█', colorize: true, bgColor: '#000000', shadowBlur: 10, shadowColor: '#00ffff' }, previewImg: 'https://picsum.photos/seed/vrworld/400/400' },
  { id: 'ar_vision', name: 'AR Vision', color: 'text-blue-500', options: { mode: 'ascii', chars: ' ─│┌┐└┘', colorize: true, bgColor: '#ffffff', invert: true }, previewImg: 'https://picsum.photos/seed/arvision/400/400' },
  { id: 'metaverse', name: 'Metaverse', color: 'text-fuchsia-500', options: { mode: 'mosaic', chars: ' █', colorize: true, bgColor: '#000000', resolution: 40 }, previewImg: 'https://picsum.photos/seed/metaverse/400/400' },
  { id: 'blockchain', name: 'Blockchain', color: 'text-zinc-300', options: { mode: 'ascii', chars: ' ⛓️🔗', textColor: '#ffffff', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/blockchain/400/400' },
  { id: 'crypto', name: 'Crypto', color: 'text-yellow-500', options: { mode: 'emoji', chars: '💰🪙', bgColor: '#111100' }, previewImg: 'https://picsum.photos/seed/crypto/400/400' },
  { id: 'nft_art', name: 'NFT Art', color: 'text-purple-400', options: { mode: 'mosaic', chars: ' ⬡', colorize: true, bgColor: '#000000', resolution: 50 }, previewImg: 'https://picsum.photos/seed/nftart/400/400' },
  { id: 'web3', name: 'Web3', color: 'text-cyan-400', options: { mode: 'ascii', chars: ' 🌐💻', textColor: '#00ffff', bgColor: '#000022' }, previewImg: 'https://picsum.photos/seed/web3/400/400' },
  { id: 'security', name: 'Security', color: 'text-green-500', options: { mode: 'ascii', chars: ' 🔒🛡️', textColor: '#00ff00', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/security/400/400' },
  { id: 'data_breach', name: 'Data Breach', color: 'text-red-600', options: { mode: 'ascii', chars: ' ⚠️🚨', textColor: '#ff0000', bgColor: '#110000' }, previewImg: 'https://picsum.photos/seed/databreach/400/400' },
  { id: 'firewall', name: 'Firewall', color: 'text-orange-500', options: { mode: 'ascii', chars: ' 🧱🔥', textColor: '#ff4500', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/firewall/400/400' },
  { id: 'virus', name: 'Virus', color: 'text-lime-500', options: { mode: 'emoji', chars: '🦠☣️', bgColor: '#001100' }, previewImg: 'https://picsum.photos/seed/virus/400/400' },
  { id: 'malware', name: 'Malware', color: 'text-red-500', options: { mode: 'ascii', chars: ' ☠️💀', textColor: '#ff0000', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/malware/400/400' },
  { id: 'ransomware', name: 'Ransomware', color: 'text-red-700', options: { mode: 'emoji', chars: '💰🔒', bgColor: '#110000' }, previewImg: 'https://picsum.photos/seed/ransomware/400/400' },
  { id: 'phishing', name: 'Phishing', color: 'text-blue-400', options: { mode: 'emoji', chars: '🎣📧', bgColor: '#001122' }, previewImg: 'https://picsum.photos/seed/phishing/400/400' },
  { id: 'spam', name: 'Spam', color: 'text-zinc-500', options: { mode: 'emoji', chars: '🗑️🚫', bgColor: '#111111' }, previewImg: 'https://picsum.photos/seed/spam/400/400' },
  { id: 'ddos', name: 'DDoS', color: 'text-red-600', options: { mode: 'ascii', chars: ' 💥🔥', textColor: '#ff0000', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/ddos/400/400' },
  { id: 'botnet', name: 'Botnet', color: 'text-indigo-900', options: { mode: 'emoji', chars: '🤖🕸️', bgColor: '#000011' }, previewImg: 'https://picsum.photos/seed/botnet/400/400' },
  { id: 'zero_day', name: 'Zero Day', color: 'text-fuchsia-600', options: { mode: 'ascii', chars: ' 0️⃣💥', textColor: '#ff00ff', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/zeroday/400/400' },
  { id: 'exploit', name: 'Exploit', color: 'text-green-400', options: { mode: 'ascii', chars: ' 🔓💻', textColor: '#00ff00', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/exploit/400/400' },
  { id: 'patch', name: 'Patch', color: 'text-emerald-500', options: { mode: 'emoji', chars: '🩹🛠️', bgColor: '#001100' }, previewImg: 'https://picsum.photos/seed/patch/400/400' },
  { id: 'update', name: 'Update', color: 'text-blue-500', options: { mode: 'emoji', chars: '🔄⬇️', bgColor: '#000022' }, previewImg: 'https://picsum.photos/seed/update/400/400' },
  { id: 'upgrade', name: 'Upgrade', color: 'text-purple-500', options: { mode: 'emoji', chars: '⬆️🚀', bgColor: '#110022' }, previewImg: 'https://picsum.photos/seed/upgrade/400/400' },
  { id: 'downgrade', name: 'Downgrade', color: 'text-red-800', options: { mode: 'emoji', chars: '⬇️📉', bgColor: '#220000' }, previewImg: 'https://picsum.photos/seed/downgrade/400/400' },
  { id: 'crash', name: 'Crash', color: 'text-red-600', options: { mode: 'emoji', chars: '💥🔥', bgColor: '#110000' }, previewImg: 'https://picsum.photos/seed/crash/400/400' },
  { id: 'reboot', name: 'Reboot', color: 'text-zinc-400', options: { mode: 'emoji', chars: '🔄🔌', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/reboot/400/400' },
  { id: 'shutdown', name: 'Shutdown', color: 'text-zinc-600', options: { mode: 'emoji', chars: '🛑🔌', bgColor: '#111111' }, previewImg: 'https://picsum.photos/seed/shutdown/400/400' },
  { id: 'startup', name: 'Startup', color: 'text-green-500', options: { mode: 'emoji', chars: '🚀🟢', bgColor: '#001100' }, previewImg: 'https://picsum.photos/seed/startup/400/400' },
  { id: 'login', name: 'Login', color: 'text-blue-400', options: { mode: 'emoji', chars: '🔑🚪', bgColor: '#000022' }, previewImg: 'https://picsum.photos/seed/login/400/400' },
  { id: 'logout', name: 'Logout', color: 'text-orange-600', options: { mode: 'emoji', chars: '🚪🚶', bgColor: '#220000' }, previewImg: 'https://picsum.photos/seed/logout/400/400' },
  { id: 'register', name: 'Register', color: 'text-emerald-400', options: { mode: 'emoji', chars: '📝✅', bgColor: '#001100' }, previewImg: 'https://picsum.photos/seed/register/400/400' },
  { id: 'profile', name: 'Profile', color: 'text-zinc-300', options: { mode: 'emoji', chars: '👤🖼️', bgColor: '#111111' }, previewImg: 'https://picsum.photos/seed/profile/400/400' },
  { id: 'settings', name: 'Settings', color: 'text-zinc-500', options: { mode: 'emoji', chars: '⚙️🔧', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/settings/400/400' },
  { id: 'dashboard', name: 'Dashboard', color: 'text-cyan-500', options: { mode: 'emoji', chars: '📊📈', bgColor: '#001122' }, previewImg: 'https://picsum.photos/seed/dashboard/400/400' },
  { id: 'analytics', name: 'Analytics', color: 'text-purple-400', options: { mode: 'emoji', chars: '📉📊', bgColor: '#110022' }, previewImg: 'https://picsum.photos/seed/analytics/400/400' },
  { id: 'metrics', name: 'Metrics', color: 'text-zinc-400', options: { mode: 'emoji', chars: '📏📐', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/metrics/400/400' },
  { id: 'statistics', name: 'Statistics', color: 'text-zinc-600', options: { mode: 'emoji', chars: '📈📉', bgColor: '#111111' }, previewImg: 'https://picsum.photos/seed/statistics/400/400' },
  { id: 'data_viz', name: 'Data Viz', color: 'text-fuchsia-400', options: { mode: 'mosaic', chars: ' █', colorize: true, bgColor: '#000000', resolution: 30 }, previewImg: 'https://picsum.photos/seed/dataviz/400/400' },
  { id: 'infographic', name: 'Infographic', color: 'text-blue-500', options: { mode: 'ascii', chars: ' ░▒▓█', colorize: true, bgColor: '#ffffff', invert: true }, previewImg: 'https://picsum.photos/seed/infographic/400/400' },
  { id: 'chart', name: 'Chart', color: 'text-green-400', options: { mode: 'ascii', chars: ' 📊📈', textColor: '#00ff00', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/chart/400/400' },
  { id: 'graph', name: 'Graph', color: 'text-red-500', options: { mode: 'ascii', chars: ' 📉📊', textColor: '#ff0000', bgColor: '#000000' }, previewImg: 'https://picsum.photos/seed/graph/400/400' },
];

const fileContent = fs.readFileSync('src/constants/presets.ts', 'utf-8');
const lines = fileContent.split('\\n');

const startIndex = lines.findIndex(line => line.includes("id: 'preset_49'"));
if (startIndex !== -1) {
  const before = lines.slice(0, startIndex);
  
  const newLines = newPresets.map(p => {
    const optionsStr = JSON.stringify(p.options).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'");
    return `  { id: '${p.id}', name: '${p.name}', color: '${p.color}', options: ${optionsStr}, previewImg: '${p.previewImg}' },`;
  });
  
  const finalContent = [...before, ...newLines, '];'].join('\\n');
  fs.writeFileSync('src/constants/presets.ts', finalContent);
  console.log('Successfully updated presets.ts');
} else {
  console.log('Could not find preset_49');
}
