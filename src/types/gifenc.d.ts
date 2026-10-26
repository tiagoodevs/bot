declare module 'gifenc' {
  export class GIFEncoder {
    writeFrame(
      data: Uint8Array,
      width: number,
      height: number,
      options?: { palette?: Uint8Array; delay?: number; repeat?: number },
    ): void;
    finish(): void;
    bytesView(): Uint8Array;
    bytes(): Uint8Array;
  }
  export function quantize(data: Uint8Array | Uint8ClampedArray, maxColors?: number): Uint8Array;
  export function applyPalette(data: Uint8Array | Uint8ClampedArray, palette: Uint8Array): Uint8Array;
}
