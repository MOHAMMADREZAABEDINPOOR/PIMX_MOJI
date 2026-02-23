export type ArtMode = 'mosaic' | 'ascii' | 'emoji';

export interface ArtOptions {
  mode: ArtMode;
  chars: string;
  resolution: number;
  colorize: boolean;
  bgColor: string;
  textColor: string;
  brightness: number;
  contrast: number;
  saturation: number;
  invert: boolean;
  fontFamily: string;
  fontWeight: string;
  shadowBlur?: number;
  shadowColor?: string;
  spacing?: number;
  threshold?: number;
  fontSize?: number;
}

export async function generateArt(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  options: ArtOptions,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
) {
  const ctx = canvas.getContext('2d', { alpha: options.bgColor === 'transparent' });
  if (!ctx) return;

  const cols = options.resolution;
  const fontSize = options.fontSize || 12; 
  
  // Ensure image is valid
  if (!image.width || !image.height) {
    console.error("Invalid image dimensions");
    return;
  }

  // Measure text width based on selected font
  ctx.font = `${options.fontWeight} ${fontSize}px ${options.fontFamily}`;
  const spacing = options.spacing || 1.0;
  
  // Better measurement for emojis and multi-byte characters
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(options.chars);
  const measureChar = hasEmoji ? '😀' : 'M';
  const charWidth = (ctx.measureText(measureChar).width || (fontSize * 0.6)) * spacing;
  const charHeight = fontSize * spacing;

  let rows = Math.floor((cols * image.height * charWidth) / (image.width * charHeight));
  
  // Safety checks
  if (!isFinite(rows) || rows <= 0) rows = 1;
  if (rows > 500) rows = 500; // Cap rows to prevent memory issues and long generation times

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cols;
  tempCanvas.height = rows;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) return;

  // Apply image adjustments
  try {
    tempCtx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%) saturate(${options.saturation}%)`;
  } catch (e) {
    console.warn("Canvas filter not supported, skipping adjustments");
  }
  
  tempCtx.drawImage(image, 0, 0, cols, rows);
  
  let imageData: Uint8ClampedArray;
  try {
    imageData = tempCtx.getImageData(0, 0, cols, rows).data;
  } catch (e) {
    console.error("Failed to get image data:", e);
    throw new Error("Security error: Unable to access image data. Try using a local image.");
  }

  canvas.width = cols * charWidth;
  canvas.height = rows * charHeight;

  if (options.bgColor !== 'transparent') {
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  ctx.textBaseline = 'top';

  const charArray = Array.from(options.chars);
  if (charArray.length === 0) charArray.push(' ');

  // Cache state to avoid redundant context updates
  let currentFont = '';
  let currentFillStyle = '';
  let currentShadowBlur = -1;

  const baseFont = `${options.fontWeight} ${fontSize}px ${options.fontFamily}`;
  const emojiFont = `${fontSize}px sans-serif`;

  // Chunked rendering to keep UI responsive
  const CHUNK_SIZE = 10; // Increased chunk size slightly for better throughput
  
  for (let y = 0; y < rows; y++) {
    // Check for cancellation
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    for (let x = 0; x < cols; x++) {
      const offset = (y * cols + x) * 4;
      const r = imageData[offset];
      const g = imageData[offset + 1];
      const b = imageData[offset + 2];
      const a = imageData[offset + 3];

      if (a === 0 && options.bgColor === 'transparent') {
        continue;
      }

      let charToDraw = '';
      
      if (options.mode === 'mosaic') {
        // Simple modulo for mosaic pattern
        const globalIndex = y * cols + x;
        charToDraw = charArray[globalIndex % charArray.length];
      } else {
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const threshold = options.threshold || 0;
        if (brightness < threshold) continue;

        let mappedIndex = Math.floor(((brightness - threshold) / (Math.max(1, 256 - threshold))) * charArray.length);
        mappedIndex = Math.max(0, Math.min(charArray.length - 1, mappedIndex));
        if (options.invert) {
          mappedIndex = charArray.length - 1 - mappedIndex;
        }
        charToDraw = charArray[mappedIndex];
      }

      // Update fill style only if changed
      const nextFillStyle = options.colorize ? `rgb(${r},${g},${b})` : options.textColor;
      if (currentFillStyle !== nextFillStyle) {
        ctx.fillStyle = nextFillStyle;
        currentFillStyle = nextFillStyle;
      }

      // Update shadow only if changed
      const nextShadowBlur = options.shadowBlur || 0;
      if (currentShadowBlur !== nextShadowBlur) {
        ctx.shadowBlur = nextShadowBlur;
        if (nextShadowBlur > 0) {
          ctx.shadowColor = options.shadowColor || options.textColor;
        }
        currentShadowBlur = nextShadowBlur;
      }

      // Update font only if changed
      const nextFont = options.mode === 'emoji' ? emojiFont : baseFont;
      if (currentFont !== nextFont) {
        ctx.font = nextFont;
        currentFont = nextFont;
      }

      ctx.fillText(charToDraw, x * charWidth, y * charHeight);
    }
    
    // Yield to main thread every CHUNK_SIZE rows
    if (y % CHUNK_SIZE === 0) {
        if (onProgress) onProgress(Math.round((y / rows) * 100));
        await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  if (onProgress) onProgress(100);
}

export function generateText(
  image: HTMLImageElement,
  options: ArtOptions
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cols = options.resolution;
  const fontSize = options.fontSize || 12;
  
  // Use the same measurement logic as generateArt for consistency
  ctx.font = `${options.fontWeight} ${fontSize}px ${options.fontFamily}`;
  const spacing = options.spacing || 1.0;
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(options.chars);
  const measureChar = hasEmoji ? '😀' : 'M';
  const charWidth = (ctx.measureText(measureChar).width || (fontSize * 0.6)) * spacing;
  const charHeight = fontSize * spacing;

  let rows = Math.floor((cols * image.height * charWidth) / (image.width * charHeight));
  if (!isFinite(rows) || rows <= 0) rows = 1;
  if (rows > 500) rows = 500;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cols;
  tempCanvas.height = rows;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return '';

  tempCtx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%) saturate(${options.saturation}%)`;
  tempCtx.drawImage(image, 0, 0, cols, rows);
  const imageData = tempCtx.getImageData(0, 0, cols, rows).data;

  const charArray = Array.from(options.chars);
  if (charArray.length === 0) charArray.push(' ');

  let result = '';
  let charIndex = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const offset = (y * cols + x) * 4;
      const r = imageData[offset];
      const g = imageData[offset + 1];
      const b = imageData[offset + 2];
      const a = imageData[offset + 3];

      // Handle transparency
      if (a === 0 && options.bgColor === 'transparent') {
        result += ' ';
        continue;
      }

      if (options.mode === 'mosaic') {
        result += charArray[charIndex % charArray.length];
        charIndex++;
      } else {
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const threshold = options.threshold || 0;
        
        // Fix: If below threshold, add a space to maintain grid alignment
        if (brightness < threshold) {
          result += ' ';
          continue;
        }

        let mappedIndex = Math.floor(((brightness - threshold) / (Math.max(1, 256 - threshold))) * charArray.length);
        mappedIndex = Math.max(0, Math.min(charArray.length - 1, mappedIndex));
        if (options.invert) {
          mappedIndex = charArray.length - 1 - mappedIndex;
        }
        result += charArray[mappedIndex];
      }
    }
    result += '\n';
  }

  return result;
}
