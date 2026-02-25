/**
 * Optimizes workout card images: resizes to max 800px width and compresses JPG.
 * Run from project root: node scripts/optimize-images.js
 * Writes to client/src/assets/optimized/ — then point the app at those (see README in script).
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const assetsDir = path.join(__dirname, '..', 'client', 'src', 'assets')
const outDir = path.join(assetsDir, 'optimized')

const IMAGES = [
  'arms.jpg', 'abs.jpg', 'back.jpg', 'cardio.jpg', 'fullbody.jpg',
  'legs.jpg', 'shoulders.jpg', 'stretching.jpg', 'yoga.jpg'
]

const MAX_WIDTH = 800
const JPG_QUALITY = 82

async function optimize() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  for (const name of IMAGES) {
    const filePath = path.join(assetsDir, name)
    if (!fs.existsSync(filePath)) {
      console.warn('Skip (not found):', name)
      continue
    }
    const before = fs.statSync(filePath).size
    const buffer = await sharp(filePath)
      .resize(MAX_WIDTH, null, { withoutEnlargement: true })
      .jpeg({ quality: JPG_QUALITY, mozjpeg: true })
      .toBuffer()
    const outPath = path.join(outDir, name)
    fs.writeFileSync(outPath, buffer)
    const after = buffer.length
    const saved = ((1 - after / before) * 100).toFixed(1)
    console.log(`${name}: ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB (${saved}% smaller)`)
  }
  console.log('Done. Optimized images in client/src/assets/optimized/')
}

optimize().catch(err => { console.error(err); process.exit(1) })
