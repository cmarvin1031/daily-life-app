#!/usr/bin/env node
// Renders scripts/icon/icon.svg into every icon the app ships:
//   public/apple-touch-icon.png   180x180  iOS home screen (full-bleed; iOS rounds it)
//   public/icon-192.png           192x192  PWA manifest
//   public/icon-512.png           512x512  PWA manifest
//   public/icon-512-maskable.png  512x512  Android adaptive: artwork scaled into the
//                                          safe zone so circular/squircle masks don't clip it
//   public/favicon.svg                     browser tab (adds rounded corners itself)
//
//   node scripts/generate-icons.mjs
//
// Edit the SVG, re-run, commit the outputs.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const publicDir = path.join(root, 'public');

const svg = await readFile(path.join(here, 'icon', 'icon.svg'), 'utf8');

async function renderPng(source, size, file) {
  await sharp(Buffer.from(source), { density: 384 }).resize(size, size).png().toFile(path.join(publicDir, file));
  console.log(`${file}  ${size}x${size}`);
}

// Full-bleed set.
await renderPng(svg, 180, 'apple-touch-icon.png');
await renderPng(svg, 192, 'icon-192.png');
await renderPng(svg, 512, 'icon-512.png');

// Maskable: same background, artwork shrunk to ~74% so it stays inside
// Android's 80% safe zone under any mask shape.
const maskable = svg.replace('<g id="art">', '<g id="art" transform="translate(256 256) scale(0.74) translate(-256 -256)">');
await renderPng(maskable, 512, 'icon-512-maskable.png');

// Favicon: browsers don't mask, so bake in rounded corners via a clip.
const favicon = svg
  .replace('<rect width="512" height="512" fill="url(#bg)"/>', '<clipPath id="r"><rect width="512" height="512" rx="112"/></clipPath><g clip-path="url(#r)"><rect width="512" height="512" fill="url(#bg)"/>')
  .replace('</svg>', '</g></svg>')
  .replace(/\s*<!--[\s\S]*?-->/, '');
await writeFile(path.join(publicDir, 'favicon.svg'), favicon);
console.log('favicon.svg');
