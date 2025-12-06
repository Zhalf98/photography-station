/**
 * 为现有照片数据补充图片尺寸信息
 * 运行: node scripts/updateImageDimensions.js
 */

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const DATA_FILE = path.join(ROOT_DIR, 'src/data/photos.js')

async function main() {
  console.log('📷 开始更新图片尺寸信息...\n')

  // 读取数据文件
  const content = await fs.readFile(DATA_FILE, 'utf-8')
  
  // 提取 categories
  const categoriesMatch = content.match(/export const categories\s*=\s*(\[[\s\S]*?\n\])/)
  let categories = []
  if (categoriesMatch) {
    categories = eval('(' + categoriesMatch[1] + ')')
  }
  
  // 提取 photoGallery
  const photosMatch = content.match(/export const photoGallery\s*=\s*(\[[\s\S]*\])/)
  let photos = []
  if (photosMatch) {
    photos = eval('(' + photosMatch[1] + ')')
  }

  console.log(`找到 ${photos.length} 张照片\n`)

  let updated = 0
  for (const photo of photos) {
    // 跳过已有尺寸的
    if (photo.width && photo.height) {
      console.log(`✓ ${photo.title} - 已有尺寸 (${photo.width}x${photo.height})`)
      continue
    }

    // 读取缩略图尺寸
    const thumbnailPath = path.join(ROOT_DIR, photo.thumbnail)
    try {
      const metadata = await sharp(thumbnailPath).metadata()
      photo.width = metadata.width
      photo.height = metadata.height
      console.log(`✓ ${photo.title} - ${metadata.width}x${metadata.height}`)
      updated++
    } catch (e) {
      console.log(`✗ ${photo.title} - 读取失败: ${e.message}`)
    }
  }

  // 写回文件
  const newContent = `/**
 * 照片数据文件
 * 存储分类和照片列表数据
 */

// 分类配置
export const categories = ${JSON.stringify(categories, null, 2)}

// 照片列表
export const photoGallery = ${JSON.stringify(photos, null, 2)}
`

  await fs.writeFile(DATA_FILE, newContent, 'utf-8')
  
  console.log(`\n✅ 完成！更新了 ${updated} 张照片的尺寸信息`)
}

main().catch(console.error)
