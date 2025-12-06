/**
 * 重新生成指定图片的缩略图
 * 运行: node scripts/regenerateThumbnail.js
 */

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads')

async function regenerateThumbnail(baseName) {
  const originalPath = path.join(UPLOADS_DIR, 'original', `${baseName}.jpg`)
  const thumbnailPath = path.join(UPLOADS_DIR, 'thumbnail', `${baseName}_small.jpg`)
  
  console.log(`处理: ${baseName}`)
  
  try {
    const buffer = await fs.readFile(originalPath)
    const info = await sharp(buffer)
      .rotate()
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)
    
    console.log(`✓ 生成缩略图: ${info.width}x${info.height}`)
    return { width: info.width, height: info.height }
  } catch (e) {
    console.log(`✗ 失败: ${e.message}`)
    return null
  }
}

// 重新生成祈年问天的缩略图
regenerateThumbnail('830da70fd3e55267')
