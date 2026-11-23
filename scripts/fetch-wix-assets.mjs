// One-time script (Nov 2026): downloads the original images from the old Wix site and
// applies the same crops Wix used, so the new site shows identical pictures.
// Since then: the profile photo and markups figure match Luigi's Dropbox originals;
// the Manaus photo was re-cut from the writing project's figures/AmuMDxfb.png (same crop);
// the transfers chart was replaced by panel (a) of d10_split_score.pdf from the
// SelectionMeritocracy project (the headline test-score event study).
// Run with: node scripts/fetch-wix-assets.mjs
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';

const OUT = new URL('../src/assets/images/', import.meta.url);
const BASE = 'https://static.wixstatic.com/media/';

// crop = [left, top, width, height] in original pixels, copied from the Wix image URLs.
const images = [
  { id: '50b58f_a25113e65ee7441c912129d3c7ed06e0~mv2.jpg', out: 'profile.jpg' },
  { id: '50b58f_d8578269d75a4063b45de761beb82874~mv2.png', out: 'endogenous-firm-competition.png', crop: [126, 75, 1587, 1197] },
  { id: '50b58f_ff63c34e959a4b97b371219ecdc63bbd~mv2.png', out: 'greener-on-the-other-side.png', crop: [244, 0, 867, 653] },
];

await mkdir(OUT, { recursive: true });
for (const img of images) {
  const res = await fetch(BASE + img.id);
  if (!res.ok) throw new Error(`${img.id}: HTTP ${res.status}`);
  let pipeline = sharp(Buffer.from(await res.arrayBuffer()));
  const meta = await pipeline.metadata();
  if (img.crop) {
    const [left, top, width, height] = img.crop;
    pipeline = pipeline.extract({ left, top, width, height });
  }
  await writeFile(new URL(img.out, OUT), await pipeline.toBuffer());
  console.log(`${img.out}: original ${meta.width}x${meta.height}${img.crop ? `, cropped ${img.crop[2]}x${img.crop[3]}` : ''}`);
}
