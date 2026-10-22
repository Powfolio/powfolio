const PNG = [0x89, 0x50, 0x4e, 0x47];
const JPEG = [0xff, 0xd8, 0xff];
const GIF = [0x47, 0x49, 0x46];
const WEBP = [0x52, 0x49, 0x46, 0x46];

function startsWith(buf: Uint8Array, sig: number[]) {
  if (buf.length < sig.length) return false;
  return sig.every((b, i) => buf[i] === b);
}

/** True only if the bytes match a known safe image signature. SVG and spoofed MIME are rejected. */
export function isSafeImageBytes(buf: Uint8Array): boolean {
  if (!buf || buf.length < 12) return false;
  if (startsWith(buf, PNG)) return true;
  if (startsWith(buf, JPEG)) return true;
  if (startsWith(buf, GIF)) return true;
  if (startsWith(buf, WEBP) && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
  return false;
}
