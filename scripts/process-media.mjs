/**
 * Media pipeline for the Power2U site.
 *
 *   npm run media
 *
 * - Photos (Images/*.webp, low resolution) are cleaned up and upscaled 2x with
 *   Lanczos3 + a careful unsharp mask, then exported as 1x/2x WebP plus a tiny
 *   blurred placeholder that is inlined into src/data/media.json.
 * - The Motion Sites hero video (assets-src/hero-energy-grid.mp4) is turned into
 *   a seamless "boomerang" loop and compressed to MP4 (H.264) + WebM (VP9),
 *   with a desktop and a mobile size and a poster frame.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_IMAGES = path.join(root, 'Images');
const OUT_PHOTOS = path.join(root, 'public/media/photos');
const OUT_VIDEO = path.join(root, 'public/media/video');
const MANIFEST = path.join(root, 'src/data/media.json');

fs.mkdirSync(OUT_PHOTOS, { recursive: true });
fs.mkdirSync(OUT_VIDEO, { recursive: true });

// Original file -> meaningful slug. The business card is used for reference only.
const PHOTOS = {
  'unnamed (1).webp': 'dyness-wall',
  'unnamed (2).webp': 'workshop-backup',
  'unnamed (3).webp': 'onsite-roof',
  'unnamed (4).webp': 'inverter-bank',
  'unnamed (5).webp': 'rooftop-array',
  'unnamed (6).webp': 'carport-garden',
  'unnamed (7).webp': 'carport-drive',
  'unnamed (8).webp': 'solis-lithium',
  'unnamed (9).webp': 'twin-inverter-rack',
  'unnamed (10).webp': 'solis-db-board'
};

async function processPhoto(file, slug) {
  const input = path.join(SRC_IMAGES, file);
  const meta = await sharp(input).metadata();
  const w = meta.width;
  const h = meta.height;

  // Gentle pre-clean: a very small blur knocks down WebP block artefacts before
  // upscaling; the post-sharpen restores edge contrast without halo-ing.
  const base = sharp(input).rotate().removeAlpha().toColourspace('srgb');

  const x2 = await base
    .clone()
    .blur(0.45)
    .resize({ width: w * 2, height: h * 2, kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 1.15, m1: 0.55, m2: 2.4, x1: 2.2, y2: 12, y3: 16 })
    .modulate({ saturation: 1.06 })
    .linear(1.035, -3)
    .webp({ quality: 80, effort: 6, smartSubsample: true })
    .toBuffer();
  fs.writeFileSync(path.join(OUT_PHOTOS, `${slug}@2x.webp`), x2);

  const x1 = await base
    .clone()
    .sharpen({ sigma: 0.8, m1: 0.4, m2: 1.6 })
    .modulate({ saturation: 1.05 })
    .webp({ quality: 82, effort: 6 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT_PHOTOS, `${slug}.webp`), x1);

  const lqip = await base.clone().resize({ width: 24 }).blur(1.2).webp({ quality: 40 }).toBuffer();

  return {
    slug,
    width: w * 2,
    height: h * 2,
    src: `/media/photos/${slug}.webp`,
    src2x: `/media/photos/${slug}@2x.webp`,
    placeholder: `data:image/webp;base64,${lqip.toString('base64')}`
  };
}

function ffmpeg(args) {
  execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

function processVideo() {
  const src = path.join(root, 'assets-src/hero-energy-grid.mp4');
  if (!fs.existsSync(src)) {
    console.warn('! hero video source missing, skipping');
    return null;
  }
  // forward + reversed = seamless loop (the source pulses bright -> dim)
  const boomerang = '[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,format=yuv420p';
  const sizes = [
    { name: 'hero-grid', width: 1600, crf: 27, vp9: 36 },
    { name: 'hero-grid-mobile', width: 960, crf: 29, vp9: 38 }
  ];
  for (const s of sizes) {
    const vf = `${boomerang},scale=${s.width}:-2:flags=lanczos`;
    ffmpeg(['-i', src, '-filter_complex', vf, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(s.crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT_VIDEO, `${s.name}.mp4`)]);
    ffmpeg(['-i', src, '-filter_complex', vf, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(s.vp9), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', path.join(OUT_VIDEO, `${s.name}.webm`)]);
  }
  ffmpeg(['-ss', '0.4', '-i', src, '-frames:v', '1', '-vf', 'scale=1600:-2:flags=lanczos', '-q:v', '3', path.join(OUT_VIDEO, 'hero-grid-poster.jpg')]);
  return {
    mp4: '/media/video/hero-grid.mp4',
    webm: '/media/video/hero-grid.webm',
    mp4Mobile: '/media/video/hero-grid-mobile.mp4',
    webmMobile: '/media/video/hero-grid-mobile.webm',
    poster: '/media/video/hero-grid-poster.jpg'
  };
}

/** 1200×630 social preview: rooftop photo, darkened, with the faceted bulb mark. */
async function socialImage() {
  const bulb = fs
    .readFileSync(path.join(root, 'public/favicon.svg'), 'utf8')
    .replace('<svg ', '<svg width="160" height="216" ');
  const shade = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#050706" stop-opacity="0.92"/>
          <stop offset="0.55" stop-color="#050706" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#050706" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
    </svg>`
  );
  await sharp(path.join(SRC_IMAGES, 'unnamed (5).webp'))
    .resize(1200, 630, { fit: 'cover', position: 'right', kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 1 })
    .modulate({ brightness: 0.85, saturation: 0.9 })
    .composite([
      { input: shade, left: 0, top: 0 },
      { input: Buffer.from(bulb), left: 110, top: 207 }
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(root, 'public/media/og-image.jpg'));
  console.log('social  public/media/og-image.jpg');
}

const photos = {};
for (const [file, slug] of Object.entries(PHOTOS)) {
  photos[slug] = await processPhoto(file, slug);
  console.log('photo', slug.padEnd(20), `${photos[slug].width}x${photos[slug].height}`);
}
const video = processVideo();
if (video) console.log('video', Object.values(video).join(', '));
await socialImage();

fs.writeFileSync(MANIFEST, JSON.stringify({ photos, video }, null, 2));
console.log('manifest ->', path.relative(root, MANIFEST));
