/**
 * 检测已上传照片的 Live Photo 和 HDR 特性
 * 自动更新 photos.js 数据文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import exifr from 'exifr'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 路径配置
const UPLOADS_DIR = path.join(__dirname, '../uploads/original')
const LIVE_DIR = path.join(__dirname, '../uploads/live')
const DATA_FILE = path.join(__dirname, '../src/data/photos.js')

/**
 * 检测是否为 HDR 照片
 */
async function detectHDR(imagePath) {
  try {
    const exif = await exifr.parse(imagePath, {
      xmp: true,
      icc: true,
      tiff: true,
      exif: true
    })

    if (!exif) return false

    // 检测 HDR 标记
    const hdrMarkers = [
      'HDRImageType',
      'HDR',
      'HighDynamicRange',
      'Item:Semantic'
    ]

    for (const marker of hdrMarkers) {
      if (exif[marker]) {
        console.log(`  ✓ HDR 标记: ${marker} = ${exif[marker]}`)
        return true
      }
    }

    // 检测色彩空间
    const colorSpaces = [
      exif.ColorSpace,
      exif.ColorSpaceData,
      exif['Color Space'],
      exif.ProfileDescription
    ]

    const hdrColorSpaces = ['Display P3', 'P3', 'Rec.2020', 'Rec2020', 'BT.2020']
    
    for (const colorSpace of colorSpaces) {
      if (colorSpace && typeof colorSpace === 'string') {
        for (const hdrSpace of hdrColorSpaces) {
          if (colorSpace.includes(hdrSpace)) {
            console.log(`  ✓ HDR 色彩空间: ${colorSpace}`)
            return true
          }
        }
      }
    }

    return false
  } catch (error) {
    console.error(`  ✗ HDR 检测失败: ${error.message}`)
    return false
  }
}

/**
 * 检测是否为 Live Photo（通过视频文件）
 */
function detectLivePhoto(imageFilename) {
  // 从图片文件名推断视频文件名
  const basename = path.basename(imageFilename, path.extname(imageFilename))
  const videoExtensions = ['.mp4', '.mov']
  
  for (const ext of videoExtensions) {
    const videoPath = path.join(LIVE_DIR, basename + ext)
    if (fs.existsSync(videoPath)) {
      console.log(`  ✓ 找到视频文件: ${basename}${ext}`)
      return true
    }
  }
  
  return false
}

/**
 * 读取并解析 photos.js
 */
function readPhotosData() {
  const content = fs.readFileSync(DATA_FILE, 'utf-8')
  
  // 提取 photoGallery 数组
  const match = content.match(/export const photoGallery = (\[[\s\S]*?\n\])/m)
  if (!match) {
    throw new Error('无法解析 photos.js 文件')
  }
  
  // 使用 eval 解析（注意：仅用于可信的本地文件）
  const photosArray = eval(match[1])
  return { content, photosArray, originalMatch: match[0] }
}

/**
 * 更新 photos.js 文件
 */
function updatePhotosData(originalContent, photosArray, originalMatch) {
  // 生成新的 photoGallery 数组代码
  const photosCode = JSON.stringify(photosArray, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // 移除属性名的引号
    .replace(/: "([^"]+)"/g, ": '$1'") // 双引号改为单引号
  
  const newPhotoGallery = `export const photoGallery = ${photosCode}`
  
  // 替换原有的 photoGallery 部分，保留其他内容
  const newContent = originalContent.replace(originalMatch, newPhotoGallery)
  
  // 写入文件
  fs.writeFileSync(DATA_FILE, newContent, 'utf-8')
  console.log('\n✓ photos.js 已更新')
}

/**
 * 主函数
 */
async function main() {
  console.log('开始检测照片特性...\n')
  
  // 读取现有数据
  const { content, photosArray, originalMatch } = readPhotosData()
  console.log(`共 ${photosArray.length} 张照片需要检测\n`)
  
  let updatedCount = 0
  
  // 遍历每张照片
  for (let i = 0; i < photosArray.length; i++) {
    const photo = photosArray[i]
    const imagePath = path.join(__dirname, '..', photo.image_src)
    const filename = path.basename(photo.image_src)
    
    console.log(`[${i + 1}/${photosArray.length}] ${filename}`)
    
    if (!fs.existsSync(imagePath)) {
      console.log('  ✗ 文件不存在，跳过\n')
      continue
    }
    
    let updated = false
    
    // 检测 Live Photo
    const isLive = detectLivePhoto(filename)
    if (isLive && !photo.is_live_photo) {
      photo.is_live_photo = true
      updated = true
    }
    
    // 检测 HDR
    const isHDR = await detectHDR(imagePath)
    if (isHDR && !photo.is_hdr) {
      photo.is_hdr = true
      updated = true
    }
    
    if (updated) {
      updatedCount++
      console.log(`  → 更新: Live=${photo.is_live_photo || false}, HDR=${photo.is_hdr || false}`)
    } else {
      console.log(`  - 无需更新`)
    }
    
    console.log('')
  }
  
  // 保存更新
  if (updatedCount > 0) {
    updatePhotosData(content, photosArray, originalMatch)
    console.log(`\n✓ 完成！共更新 ${updatedCount} 张照片`)
  } else {
    console.log('\n- 没有照片需要更新')
  }
}

// 运行
main().catch(error => {
  console.error('错误:', error)
  process.exit(1)
})
