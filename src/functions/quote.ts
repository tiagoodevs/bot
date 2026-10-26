import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import type { User } from "discord.js";
import { join } from "path";

export interface QuoteCard {
  user: User;
  content: string;
  style?: QuoteStyle;
}

export type QuoteStyle = "classic" | "neon" | "retro" | "bubble" | "minimal" | "void" | "sunset" | "cyberpunk";

export type QuoteFont = "jakarta" | "inter" | "slabo" | "vt323" | "butterfly" | "system";

const PADDING = 48;
const MAX_LINES = 14;

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

export const QUOTE_STYLES: QuoteStyle[] = ["classic", "neon", "retro", "bubble", "minimal", "void", "sunset", "cyberpunk"];
export const QUOTE_FONTS: QuoteFont[] = ["jakarta", "inter", "slabo", "vt323", "butterfly", "system"];

const FONT_MAP: Record<QuoteFont, string> = {
  jakarta: "'Plus Jakarta Sans', Inter, 'Noto Sans', 'Noto Color Emoji', sans-serif",
  inter: "Inter, 'Plus Jakarta Sans', 'Noto Sans', 'Noto Color Emoji', sans-serif",
  slabo: "'Slabo 13px', Georgia, serif",
  vt323: "VT323, 'Courier New', monospace",
  butterfly: "'Butterfly Kids', cursive, serif",
  system: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

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

function getStyle(style: QuoteStyle = "classic") {
  switch (style) {
    case "neon":
      return {
        backdrop: "#0a0a1a",
        quoteColor: "#39ff14",
        authorColor: "#ff6ec7",
        glow: true,
      };
    case "retro":
      return {
        backdrop: "#2b1d0e",
        quoteColor: "#f5d16e",
        authorColor: "#d4b942",
        sepia: true,
      };
    case "bubble":
      return {
        backdrop: "#7c3fbf",
        quoteColor: "#ffffff",
        authorColor: "#f3e8ff",
        bubble: true,
      };
    case "minimal":
      return {
        backdrop: "#111111",
        quoteColor: "#ffffff",
        authorColor: "#aaaaaa",
      };
    case "void":
      return {
        backdrop: "#000000",
        quoteColor: "#e4e4e7",
        authorColor: "#71717a",
      };
    case "sunset":
      return {
        backdrop: "#1a0e1f",
        quoteColor: "#ff9f45",
        authorColor: "#ff7b9d",
      };
    case "cyberpunk":
      return {
        backdrop: "#0f0f23",
        quoteColor: "#00ffff",
        authorColor: "#ff00ff",
        glow: true,
      };
    case "classic":
    default:
      return {
        backdrop: "#1a1b26",
        quoteColor: "#c0caf5",
        authorColor: "#6e6a86",
      };
  }
}

export async function renderQuoteCard(card: QuoteCard, fontChoice: QuoteFont = "jakarta"): Promise<Buffer> {
  const W = 800;
  const H = 400;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const { user, content, style = "classic" } = card;
  const theme = getStyle(style);
  const fontStack = FONT_MAP[fontChoice];

  const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 512 }));

  // background
  ctx.fillStyle = theme.backdrop;
  ctx.fillRect(0, 0, W, H);

  if (theme.bubble) {
    // fun bubble style
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(150, 100, 80, 0, Math.PI * 2);
    ctx.arc(650, 50, 60, 0, Math.PI * 2);
    ctx.arc(600, 300, 100, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  }

  // avatar on the left half
  ctx.drawImage(avatar, 0, 0, W / 2, H);

  // gradient fade from avatar into the background
  const fadeStart = W / 4;
  const fadeEnd = W / 2 + 40;
  const gradient = ctx.createLinearGradient(fadeStart, 0, fadeEnd, 0);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, theme.backdrop);
  ctx.fillStyle = gradient;
  ctx.fillRect(fadeStart, 0, fadeEnd - fadeStart, H);

  // text region
  const nudge = 30;
  const textCenterX = W / 2;
  const textWidth = W / 2 - PADDING * 2 - nudge * 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const authorSize = 22;
  const gap = 24;
  const maxBlockHeight = H - PADDING * 2;

  let quoteSize = 40;
  let lineHeight = quoteSize * 1.3;
  let lines: string[] = [];

  while (quoteSize >= 16) {
    ctx.font = `600 ${quoteSize}px ${fontStack}`;
    lineHeight = quoteSize * 1.3;
    lines = wrapText(ctx, content, textWidth);
    const blockHeight = lines.length * lineHeight + gap + authorSize;
    if (blockHeight <= maxBlockHeight && lines.length <= MAX_LINES) break;
    quoteSize -= 2;
  }

  const blockHeight = lines.length * lineHeight + gap + authorSize;
  let y = (H - blockHeight) / 2 + lineHeight / 2;

  // quote
  ctx.font = `600 ${quoteSize}px ${fontStack}`;
  ctx.fillStyle = theme.quoteColor;
  if (theme.glow) {
    ctx.shadowColor = theme.quoteColor;
    ctx.shadowBlur = 10;
  }
  for (const line of lines) {
    ctx.fillText(line, textCenterX, y);
    y += lineHeight;
  }
  ctx.shadowBlur = 0;

  // author
  y += gap - lineHeight / 2 + authorSize / 2;
  ctx.font = `400 ${authorSize}px ${fontStack}`;
  ctx.fillStyle = theme.authorColor;
  ctx.fillText(`- @${user.username}`, textCenterX, y);

  return canvas.toBuffer("image/png");
}