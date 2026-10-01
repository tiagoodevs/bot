import { createCanvas, loadImage, GlobalFonts, type Image, type SKRSContext2D } from "@napi-rs/canvas";
import type { User } from "discord.js";
import { join } from "path";

export interface QuoteCard {
  user: User;
  content: string;
}

const PADDING = 48;
const MAX_LINES = 14;

const SANS = "Inter, Montserrat, 'Noto Sans', 'Noto Sans Symbols 2', 'Noto Color Emoji'";
const BACKDROP = "#191724";

const FONTS_DIR = join(__dirname, "..", "fonts");

function registerLocalFonts() {
  GlobalFonts.registerFromPath(join(FONTS_DIR, "Inter", "Inter-VariableFont_opsz,wght.ttf"), "Inter");
  GlobalFonts.registerFromPath(join(FONTS_DIR, "Inter", "Inter-Italic-VariableFont_opsz,wght.ttf"), "Inter-Italic");

  GlobalFonts.registerFromPath(
    join(FONTS_DIR, "Plus_Jakarta_Sans", "PlusJakartaSans-VariableFont_wght.ttf"),
    "Plus Jakarta Sans",
  );
  GlobalFonts.registerFromPath(
    join(FONTS_DIR, "Plus_Jakarta_Sans", "PlusJakartaSans-Italic-VariableFont_wght.ttf"),
    "Plus Jakarta Sans-Italic",
  );

  GlobalFonts.registerFromPath(join(FONTS_DIR, "Slabo_13px", "Slabo13px-Regular.ttf"), "Slabo 13px");
  GlobalFonts.registerFromPath(join(FONTS_DIR, "VT323", "VT323-Regular.ttf"), "VT323");
  GlobalFonts.registerFromPath(join(FONTS_DIR, "Butterfly_Kids", "ButterflyKids-Regular.ttf"), "Butterfly Kids");
}

registerLocalFonts();

function font(size: number, weight: number | string = 400): string {
  return `${weight} ${size}px ${SANS}`;
}

const FONT_STACK = "'Plus Jakarta Sans', Inter, 'Noto Sans', 'Noto Color Emoji', sans-serif";

function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderQuoteCard(card: QuoteCard): Promise<Buffer> {
  const W = 800;
  const H = 400;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const { user, content } = card;

  const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 512 }));

  // background
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, W, H);

  // avatar on the left half
  ctx.drawImage(avatar, 0, 0, W / 2, H);

  // gradient fade from avatar into the background
  const fadeStart = W / 4;
  const fadeEnd = W / 2 + 40;
  const gradient = ctx.createLinearGradient(fadeStart, 0, fadeEnd, 0);
  gradient.addColorStop(0, "rgba(36, 23, 26, 0)");
  gradient.addColorStop(0.7, "rgba(25, 23, 36, 1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(fadeStart, 0, fadeEnd - fadeStart, H);

  // text region: centered in the right half, nudged left
  const nudge = 30;
  const textCenterX = W / 2 + W / 4 - nudge; // 570
  const textWidth = W / 2 - PADDING * 2 - nudge * 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // auto-fit: shrink the font until the quote fits the available height
  const authorSize = 22;
  const gap = 24;
  const maxBlockHeight = H - PADDING * 2;

  let quoteSize = 40;
  let lineHeight = quoteSize * 1.3;
  let lines: string[] = [];

  while (quoteSize >= 16) {
    ctx.font = `600 ${quoteSize}px ${FONT_STACK}`;
    lineHeight = quoteSize * 1.3;
    lines = wrapText(ctx, content, textWidth);
    const blockHeight = lines.length * lineHeight + gap + authorSize;
    if (blockHeight <= maxBlockHeight && lines.length <= MAX_LINES) break;
    quoteSize -= 2;
  }

  // vertically center the whole block (quote + author)
  const blockHeight = lines.length * lineHeight + gap + authorSize;
  let y = (H - blockHeight) / 2 + lineHeight / 2;

  // quote
  ctx.font = `600 ${quoteSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#e0def4";
  for (const line of lines) {
    ctx.fillText(line, textCenterX, y);
    y += lineHeight;
  }

  // author
  y += gap - lineHeight / 2 + authorSize / 2;
  ctx.font = `400 ${authorSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#6e6a86";
  ctx.fillText(`- @${user.username}`, textCenterX, y);

  return canvas.toBuffer("image/png");
}