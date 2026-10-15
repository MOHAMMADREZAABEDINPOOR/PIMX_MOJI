import { GIFEncoder, quantize, applyPalette } from "gifenc";
const gif = GIFEncoder();
self.onmessage = (event) => {
  try {
    if (event.data.finish) {
      gif.finish();
      const bytes = gif.bytes();
      self.postMessage({ bytes }, { transfer: [bytes.buffer] });
      return;
    }
    const { pixels, width, height, delay } = event.data;
    const rgba = new Uint8ClampedArray(pixels);
    const palette = quantize(rgba, 128);
    gif.writeFrame(applyPalette(rgba, palette), width, height, {
      palette,
      delay,
      repeat: 0,
    });
    self.postMessage({ ready: true });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
