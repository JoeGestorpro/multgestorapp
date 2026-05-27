import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')
const SRC = join(PUBLIC, 'branding', 'barbergestor', 'barbergestor-icon.png')

const sizes = [
  { name: 'favicon-16x16.png',   size: 16 },
  { name: 'favicon-32x32.png',   size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

async function generate() {
  const srcBuffer = await sharp(SRC).png().toBuffer()

  for (const { name, size } of sizes) {
    await sharp(srcBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0 },
      })
      .png()
      .toFile(join(PUBLIC, name))
    console.log(`  ✓ ${name}  (${size}×${size})`)
  }

  {
    const png16 = readFileSync(join(PUBLIC, 'favicon-16x16.png'))
    const png32 = readFileSync(join(PUBLIC, 'favicon-32x32.png'))

    const entry = (w, h, sz, off) => {
      const b = Buffer.alloc(16)
      b.writeUInt8(w === 256 ? 0 : w, 0)
      b.writeUInt8(h === 256 ? 0 : h, 1)
      b.writeUInt8(0, 2); b.writeUInt8(0, 3)
      b.writeUInt16LE(1, 4); b.writeUInt16LE(32, 6)
      b.writeUInt32LE(sz, 8); b.writeUInt32LE(off, 12)
      return b
    }

    const h = Buffer.alloc(6)
    h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(2, 2)
    const o1 = 6 + 32, o2 = o1 + png16.length
    writeFileSync(join(PUBLIC, 'favicon.ico'),
      Buffer.concat([h, entry(16, 16, png16.length, o1), entry(32, 32, png32.length, o2), png16, png32]))
    console.log('  ✓ favicon.ico')
  }

  console.log('\nDone.')
}

generate().catch(err => { console.error('Error:', err); process.exit(1) })
