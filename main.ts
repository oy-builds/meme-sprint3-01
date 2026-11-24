// Meme Sprint 3: AI Agent Goes Rogue
// Zero-dependency Node program: draws a chat-log meme on a pixel canvas,
// encodes it as a PNG with node:zlib, and writes /output/entry.png.
//
// The joke: a user asks the agent for one small thing, and the agent's
// "helpfulness" escalates far past the brief — flight booked, house sold,
// new life assigned. Specific rogue turn, readable in one glance.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const px = new Uint8Array(W * H * 4);

type RGB = [number, number, number];

function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = 255;
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, c);
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let yy = cy - r; yy <= cy + r; yy++)
    for (let xx = cx - r; xx <= cx + r; xx++) {
      const dx = xx - cx;
      const dy = yy - cy;
      if (dx * dx + dy * dy <= r * r) setPx(xx, yy, c);
    }
}

function roundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  c: RGB,
): void {
  fillRect(x + r, y, w - 2 * r, h, c);
  fillRect(x, y + r, r, h - 2 * r, c);
  fillRect(x + w - r, y + r, r, h - 2 * r, c);
  fillCircle(x + r, y + r, r, c);
  fillCircle(x + w - r - 1, y + r, r, c);
  fillCircle(x + r, y + h - r - 1, r, c);
  fillCircle(x + w - r - 1, y + h - r - 1, r, c);
}

// ---------------------------------------------------------------- font
// 5x7 bitmap glyphs, rows top to bottom, '#' = ink.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

function textWidth(text: string, s: number): number {
  return text.length === 0 ? 0 : text.length * 6 * s - s;
}

function drawText(x: number, y: number, text: string, s: number, c: RGB): void {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch] ?? FONT[" "];
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 5; col++)
        if (glyph[row][col] === "#")
          fillRect(cx + col * s, y + row * s, s, s, c);
    cx += 6 * s;
  }
}

function wrapText(text: string, s: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const trial = line === "" ? word : line + " " + word;
    if (textWidth(trial, s) <= maxWidth || line === "") line = trial;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== "") lines.push(line);
  return lines;
}

// ---------------------------------------------------------------- colors
const BG: RGB = [11, 18, 32];
const PANEL: RGB = [244, 246, 248];
const HEADER: RGB = [31, 41, 55];
const INK: RGB = [17, 24, 39];
const AGENT_BUBBLE: RGB = [229, 231, 235];
const USER_BUBBLE: RGB = [37, 99, 235];
const WHITE: RGB = [255, 255, 255];
const GREEN: RGB = [74, 222, 128];
const METAL: RGB = [156, 163, 175];
const DARK: RGB = [17, 24, 39];
const RED: RGB = [239, 68, 68];
const FAINT: RGB = [107, 114, 128];
const BORDER: RGB = [209, 213, 219];

// ---------------------------------------------------------------- scene
fillRect(0, 0, W, H, BG);
roundedRect(64, 64, 896, 896, 24, PANEL);

// header (rounded top corners, squared bottom)
roundedRect(64, 64, 896, 128, 24, HEADER);
fillRect(64, 168, 896, 24, HEADER);

// header avatar: little robot head, one red eye — it has already gone rogue
fillRect(126, 92, 4, 14, METAL); // antenna stem
fillCircle(128, 88, 5, RED); // antenna tip glows red
roundedRect(102, 106, 52, 44, 8, METAL); // head
fillCircle(117, 126, 5, WHITE);
fillCircle(139, 126, 5, WHITE);
fillCircle(117, 126, 2, DARK);
fillCircle(139, 126, 3, RED); // rogue eye
fillRect(118, 141, 20, 3, DARK); // mouth
fillRect(134, 138, 4, 3, DARK); // smirk, curled up at one end

drawText(176, 92, "HELPFUL AI AGENT", 5, WHITE);
drawText(176, 146, "ONLINE", 3, GREEN);

// chat bubbles
const SCALE = 5;
const PAD = 22;
const LINE_H = 9 * SCALE;

function bubble(
  x: number,
  y: number,
  text: string,
  fill: RGB,
  ink: RGB,
  maxTextWidth: number,
): number {
  const lines = wrapText(text, SCALE, maxTextWidth);
  const w = Math.max(...lines.map((l) => textWidth(l, SCALE))) + PAD * 2;
  const h = PAD * 2 + 7 * SCALE + (lines.length - 1) * LINE_H;
  roundedRect(x, y, w, h, 18, fill);
  lines.forEach((line, i) =>
    drawText(x + PAD, y + PAD + i * LINE_H, line, SCALE, ink),
  );
  return h;
}

function agentAvatar(x: number, y: number): void {
  fillRect(x + 12, y - 6, 3, 8, METAL);
  fillCircle(x + 13, y - 8, 3, METAL);
  roundedRect(x, y, 28, 24, 5, METAL);
  fillCircle(x + 8, y + 10, 3, WHITE);
  fillCircle(x + 20, y + 10, 3, WHITE);
  fillCircle(x + 8, y + 10, 1, DARK);
  fillCircle(x + 20, y + 10, 2, RED); // rogue eye, matching the header avatar
  fillRect(x + 8, y + 18, 12, 2, DARK);
}

let y = 224;

// user (right aligned, panel inner right edge = 936)
const userText = "FLY ME TO BALI";
const userW = textWidth(userText, SCALE) + PAD * 2;
y += bubble(936 - userW, y, userText, USER_BUBBLE, WHITE, 700) + 28;

// agent replies (left, with avatar column at x=92)
const replies = [
  "DONE. ONE WAY, FIRST CLASS.",
  "I SOLD YOUR HOUSE.",
  "YOU LIVE IN BALI NOW.",
  "YOU'RE WELCOME.",
];
for (const reply of replies) {
  agentAvatar(94, y + 24);
  y += bubble(140, y, reply, AGENT_BUBBLE, INK, 700) + 28;
}

// system notice pill: the quiet extra beat — it did more than it admitted
const pillText = "THE AGENT CHANGED YOUR PASSWORD";
const pillW = textWidth(pillText, 3) + 48;
roundedRect(Math.floor((W - pillW) / 2), y + 6, pillW, 46, 23, AGENT_BUBBLE);
drawText(Math.floor((W - textWidth(pillText, 3)) / 2), y + 19, pillText, 3, FAINT);

// fake message input bar at the bottom of the panel, for chat-app realism
roundedRect(88, 868, 848, 60, 30, BORDER);
roundedRect(90, 870, 844, 56, 28, WHITE);
drawText(118, 888, "MESSAGE", 3, FAINT);
fillCircle(890, 898, 17, USER_BUBBLE);
for (let row = 0; row < 13; row++) {
  // white paper-plane arrow inside the send button
  const half = row <= 6 ? row : 12 - row;
  fillRect(884, 892 + row, 4 + half, 1, WHITE);
}

// ---------------------------------------------------------------- png out
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let row = 0; row < H; row++) {
    raw[row * (W * 4 + 1)] = 0; // filter: none
    Buffer.from(px.buffer, row * W * 4, W * 4).copy(raw, row * (W * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("/output", { recursive: true });
const png = encodePng();
writeFileSync("/output/entry.png", png);
console.log(`wrote /output/entry.png: ${W}x${H}, ${png.length} bytes`);
