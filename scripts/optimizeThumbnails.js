/**
 * 优化缩略图文件大小
 * 使用方法: node scripts/optimizeThumbnails.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const THUMB_DIR = path.join(__dirname, '../uploads/thumbnail')
const OUTPUT_DIR = path.join(__dirname, '../uploads/thumbnail_optimized')
const MAX_SIZE = 1024 * 1024 // 1MB
const MAX_WIDTH = 800 // 最大宽度
const QUALITY = 80 // JPEG质量

async function optimizeImage(filePath, outputPath) {
  const stats = fs.statSync(filePath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  const fileName = path.basename(filePath)
  
  if (stats.size <= MAX_SIZE) {
    // 直接复制
    fs.copyFileSync(filePath, outputPath)
    console.log(`  ✓ ${fileName} (${sizeMB}MB) - 已符合要求`)
    return
  }

  console.log(`  处理: ${fileName} (${sizeMB}MB)`)
  
  const ext = path.extname(filePath).toLowerCase()
  
  try {
    let sharpInstance = sharp(filePath).rotate() // 自动根据EXIF旋转
    const metadata = await sharp(filePath).metadata()
    
    // 如果宽度超过MAX_WIDTH，缩小
    if (metadata.width > MAX_WIDTH) {
      sharpInstance = sharpInstance.resize(MAX_WIDTH, null, { withoutEnlargement: true })
    }
    
    // 根据格式输出
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharpInstance.jpeg({ quality: QUALITY }).toFile(outputPath)
    } else if (ext === '.png') {
      await sharpInstance.png({ compressionLevel: 9 }).toFile(outputPath)
    } else if (ext === '.webp') {
      await sharpInstance.webp({ quality: QUALITY }).toFile(outputPath)
    } else {
      await sharpInstance.jpeg({ quality: QUALITY }).toFile(outputPath)
    }
    
    const newStats = fs.statSync(outputPath)
    const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2)
    console.log(`    → 压缩后: ${newSizeMB}MB (节省 ${((stats.size - newStats.size) / 1024).toFixed(0)}KB)`)
  } catch (err) {
    console.log(`    ✗ 处理失败: ${err.message}`)
    // 失败时复制原文件
    fs.copyFileSync(filePath, outputPath)
  }
}

async function main() {
  console.log('开始优化缩略图...\n')
  
  // 创建输出目录
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  
  const files = fs.readdirSync(THUMB_DIR)
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  
  console.log(`找到 ${imageFiles.length} 个图片文件`)
  console.log(`输出目录: ${OUTPUT_DIR}\n`)
  
  for (const file of imageFiles) {
    const inputPath = path.join(THUMB_DIR, file)
    const outputPath = path.join(OUTPUT_DIR, file)
    await optimizeImage(inputPath, outputPath)
  }
  
  console.log('\n✅ 优化完成')
  console.log('请手动将 uploads/thumbnail_optimized 中的文件替换到 uploads/thumbnail')
}

main().catch(console.error)
