import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { GIFEncoder, quantize, applyPalette } from "gifenc";

export async function convertToGif(imageUrl: string, options: { frames?: number; fps?: number } = {}): Promise<Buffer> {
  const frames = Math.min(Math.max(options.frames ?? 12, 4), 20);
  const fps = Math.min(Math.max(options.fps ?? 10, 5), 15);
  const delay = Math.floor(1000 / fps);

  const img = await loadImage(imageUrl);
  const W = Math.min(img.width, 512);
  const H = Math.min(img.height, 512);

  const gif = new GIFEncoder();

  for (let i = 0; i < frames; i++) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // slight zoom/pan animation
    const scale = 1 + (i / frames) * 0.1;
    const offsetX = (W * (1 - scale)) / 2 + Math.sin((i / frames) * Math.PI * 2) * 4;
    const offsetY = (H * (1 - scale)) / 2 + Math.cos((i / frames) * Math.PI * 2) * 4;

    ctx.drawImage(img, offsetX, offsetY, W * scale, H * scale);

    // subtle scanline effect
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 1;

    const data = ctx.getImageData(0, 0, W, H).data;
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, W, H, { palette, delay });
  }

  gif.finish();
  return Buffer.from(gif.bytesView());
}
