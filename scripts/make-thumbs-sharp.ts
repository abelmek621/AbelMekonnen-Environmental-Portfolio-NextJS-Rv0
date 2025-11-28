// scripts/make-thumbs-sharp.ts
import sharp from 'sharp';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

async function main() {
  const sourceDir = path.resolve('./public/images/portfolio-images');
  const outDir = path.resolve(sourceDir, 'thumbs');

  if (!fs.existsSync(sourceDir)) {
    console.error('Source folder not found:', sourceDir);
    process.exit(1);
  }

  await fsp.mkdir(outDir, { recursive: true });

  const entries = await fsp.readdir(sourceDir);
  const images = entries.filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));

  if (images.length === 0) {
    console.log('No images found in', sourceDir);
    return;
  }

  console.log(`Processing ${images.length} images with Sharp...`);

  for (const file of images) {
    try {
      const infile = path.join(sourceDir, file);
      const base = path.parse(file).name;

      console.log(`Processing: ${file}`);

      // CARD THUMB: 400x260
      await sharp(infile)
        .resize(400, 260, { 
          fit: 'cover', 
          position: 'center',
          withoutEnlargement: true 
        })
        .webp({ 
          quality: 78,
          // mozjpeg: true 
        })
        .toFile(path.join(outDir, `${base}-thumb.webp`));

      // SMALL THUMB (popup): 240x150
      await sharp(infile)
        .resize(240, 150, { 
          fit: 'cover', 
          position: 'center',
          withoutEnlargement: true 
        })
        .webp({ 
          quality: 72,
          // mozjpeg: true 
        })
        .toFile(path.join(outDir, `${base}-thumb-sm.webp`));

      // Tiny blurred LQIP (10x10) - base64 for blur placeholder
      const tinyBuffer = await sharp(infile)
        .resize(10, 6, { 
          fit: 'cover', 
          position: 'center' 
        })
        .jpeg({ quality: 40 })
        .blur(1)
        .toBuffer();

      const b64 = `data:image/jpeg;base64,${tinyBuffer.toString('base64')}`;
      await fsp.writeFile(
        path.join(outDir, `${base}-blur.txt`), 
        b64, 
        'utf8'
      );

      console.log(`✅ ${file} -> thumbs/`);

    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log('✅ Thumbnail generation completed!');
  console.log('📁 Thumbnails saved to:', outDir);
}

// Install sharp first: npm install sharp
main().catch(console.error);
