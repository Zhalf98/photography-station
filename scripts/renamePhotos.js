/**
 * 重命名本地图片为随机名称，并更新photos.js
 * 使用方法: node scripts/renamePhotos.js
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ORIGINAL_DIR = path.join(__dirname, '../uploads/original')
const THUMB_DIR = path.join(__dirname, '../uploads/thumbnail')
const PHOTOS_FILE = path.join(__dirname, '../src/data/photos.js')

// 生成随机ID
function generateId() {
  return crypto.randomBytes(8).toString('hex')
}

async function main() {
  console.log('开始重命名图片...\n')

  // 读取photos.js
  let content = fs.readFileSync(PHOTOS_FILE, 'utf-8')
  const match = content.match(/export const photoGallery = (\[[\s\S]*?\n\])/)
  if (!match) {
    console.error('无法解析photos.js')
    return
  }
  
  const photos = eval(match[1])
  console.log(`找到 ${photos.length} 张照片\n`)

  const renamedFiles = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const newId = generateId()
    
    // 获取原文件路径
    const origPath = photo.image_src.replace(/^\//, '')
    const thumbPath = photo.thumbnail.replace(/^\//, '')
    
    const origFullPath = path.join(__dirname, '..', origPath)
    const thumbFullPath = path.join(__dirname, '..', thumbPath)
    
    // 获取扩展名
    const origExt = path.extname(origPath).toLowerCase()
    const thumbExt = path.extname(thumbPath).toLowerCase()
    
    // 新文件名
    const newOrigName = `${newId}${origExt}`
    const newThumbName = `${newId}_small${thumbExt}`
    
    const newOrigPath = path.join(ORIGINAL_DIR, newOrigName)
    const newThumbPath = path.join(THUMB_DIR, newThumbName)
    
    console.log(`[${i+1}/${photos.length}] ${photo.title}`)
    
    // 重命名原图
    if (fs.existsSync(origFullPath)) {
      fs.renameSync(origFullPath, newOrigPath)
      console.log(`  原图: ${path.basename(origPath)} → ${newOrigName}`)
    } else {
      console.log(`  ⚠ 原图不存在: ${origPath}`)
    }
    
    // 重命名缩略图
    if (fs.existsSync(thumbFullPath)) {
      fs.renameSync(thumbFullPath, newThumbPath)
      console.log(`  缩略图: ${path.basename(thumbPath)} → ${newThumbName}`)
    } else {
      console.log(`  ⚠ 缩略图不存在: ${thumbPath}`)
    }
    
    // 更新photos数组
    photo.image_src = `/uploads/original/${newOrigName}`
    photo.thumbnail = `/uploads/thumbnail/${newThumbName}`
    
    renamedFiles.push({ old: origPath, new: newOrigName })
  }

  // 更新photos.js
  const newGallery = JSON.stringify(photos, null, 2)
  const newContent = content.replace(
    /export const photoGallery = \[[\s\S]*?\n\]/,
    `export const photoGallery = ${newGallery}`
  )
  
  fs.writeFileSync(PHOTOS_FILE, newContent)
  
  console.log(`\n✅ 完成！重命名了 ${renamedFiles.length} 组图片`)
}

main().catch(console.error)
