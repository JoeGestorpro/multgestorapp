import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname, parse } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')
const LANDING_SRC = join(PUBLIC, 'landing', 'barbergestor')
const BRANDING_SRC = join(PUBLIC, 'branding', 'barbergestor')
const ASSETS_DST = join(PUBLIC, 'assets', 'barbergestor')

const SIZES = {
  hero: { width: 1400, suffix: 'hero' },
  section: { width: 800, suffix: 'section' },
  thumb: { width: 400, suffix: 'thumb' },
  icon_nav: { width: 32, suffix: 'nav' },
  icon_footer: { width: 28, suffix: 'footer' },
  icon_badge: { width: 64, suffix: 'badge' },
  icon_og: { width: 256, suffix: 'og' },
}

async function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

async function resizeImage(src, dst, width, format = 'webp', quality = 85) {
  const img = sharp(src)
  const meta = await img.metadata()
  const targetWidth = Math.min(width, meta.width)
  const output = img.resize(targetWidth, null, { fit: 'inside', withoutEnlargement: true })

  if (format === 'webp') {
    await output.webp({ quality }).toFile(dst)
  } else {
    await output.png({ quality, palette: true }).toFile(dst)
  }

  const result = statSync(dst)
  return { width: targetWidth, bytes: result.size, format }
}

async function optimizeScreenshot(srcPath, name) {
  console.log(`\n  📷 ${name}`)
  const results = []

  const heroDst = join(ASSETS_DST, `${name}-${SIZES.hero.suffix}.webp`)
  const r1 = await resizeImage(srcPath, heroDst, SIZES.hero.width)
  console.log(`    hero:    ${r1.width}px, ${(r1.bytes / 1024).toFixed(0)}KB (${r1.format})`)
  results.push(r1)

  const sectionDst = join(ASSETS_DST, `${name}-${SIZES.section.suffix}.webp`)
  const r2 = await resizeImage(srcPath, sectionDst, SIZES.section.width)
  console.log(`    section: ${r2.width}px, ${(r2.bytes / 1024).toFixed(0)}KB (${r2.format})`)
  results.push(r2)

  const thumbDst = join(ASSETS_DST, `${name}-${SIZES.thumb.suffix}.webp`)
  const r3 = await resizeImage(srcPath, thumbDst, SIZES.thumb.width)
  console.log(`    thumb:   ${r3.width}px, ${(r3.bytes / 1024).toFixed(0)}KB (${r3.format})`)
  results.push(r3)

  return results
}

async function optimizeIcon(srcPath) {
  console.log(`\n  🔷 Ícone`)

  const navDst = join(ASSETS_DST, `icon-${SIZES.icon_nav.suffix}.webp`)
  const r1 = await resizeImage(srcPath, navDst, SIZES.icon_nav.width)
  console.log(`    navbar:  ${r1.width}px, ${(r1.bytes / 1024).toFixed(0)}KB (${r1.format})`)

  const footerDst = join(ASSETS_DST, `icon-${SIZES.icon_footer.suffix}.webp`)
  const r2 = await resizeImage(srcPath, footerDst, SIZES.icon_footer.width)
  console.log(`    footer:  ${r2.width}px, ${(r2.bytes / 1024).toFixed(0)}KB (${r2.format})`)

  const badgeDst = join(ASSETS_DST, `icon-${SIZES.icon_badge.suffix}.webp`)
  const r3 = await resizeImage(srcPath, badgeDst, SIZES.icon_badge.width)
  console.log(`    badge:   ${r3.width}px, ${(r3.bytes / 1024).toFixed(0)}KB (${r3.format})`)

  const ogDst = join(ASSETS_DST, `icon-${SIZES.icon_og.suffix}.png`)
  const r4 = await resizeImage(srcPath, ogDst, SIZES.icon_og.width, 'png')
  console.log(`    og:      ${r4.width}px, ${(r4.bytes / 1024).toFixed(0)}KB (${r4.format})`)

  return [r1, r2, r3, r4]
}

async function main() {
  console.log('=== 🎨 Otimização de Assets BarberGestor ===\n')

  await ensureDir(ASSETS_DST)

  // Mapear screenshots
  const screenshotDirs = [
    { dir: 'dashboard', name: 'dashboard' },
    { dir: 'agenda', name: 'agenda' },
    { dir: 'caixa', name: 'caixa' },
    { dir: 'atendimentos', name: 'atendimentos' },
    { dir: 'equipe', name: 'equipe' },
    { dir: 'financeiro', name: 'financeiro' },
    { dir: 'produtos', name: 'produtos' },
    { dir: 'serviços', name: 'servicos' },
  ]

  let totalBefore = 0
  let totalAfter = 0

  for (const { dir, name } of screenshotDirs) {
    const srcDir = join(LANDING_SRC, dir)
    const files = readdirSync(srcDir).filter(f => /\.png$/i.test(f))
    for (const file of files) {
      const srcPath = join(srcDir, file)
      const srcSize = statSync(srcPath).size
      totalBefore += srcSize
      const results = await optimizeScreenshot(srcPath, name)
      totalAfter += results.reduce((sum, r) => sum + r.bytes, 0)
    }
  }

  // Otimizar ícone grande do branding
  const iconFiles = readdirSync(BRANDING_SRC).filter(f => /\.png$/i.test(f))
  for (const file of iconFiles) {
    const srcPath = join(BRANDING_SRC, file)
    const srcSize = statSync(srcPath).size
    totalBefore += srcSize
    const results = await optimizeIcon(srcPath)
    totalAfter += results.reduce((sum, r) => sum + r.bytes, 0)
  }

  const savedMB = ((totalBefore - totalAfter) / (1024 * 1024)).toFixed(2)
  const beforeMB = (totalBefore / (1024 * 1024)).toFixed(2)
  const afterMB = (totalAfter / (1024 * 1024)).toFixed(2)

  console.log(`\n=== ✅ Resumo ===`)
  console.log(`  Antes:  ${beforeMB}MB`)
  console.log(`  Depois: ${afterMB}MB`)
  console.log(`  Economia: ${savedMB}MB (${((1 - totalAfter/totalBefore)*100).toFixed(0)}%)`)
  console.log(`  Destino: ${ASSETS_DST}`)
}

main().catch(console.error)
