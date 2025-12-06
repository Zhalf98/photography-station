/**
 * 读取本地图片EXIF信息并更新photos.js数据文件
 * 使用方法: node scripts/readExif.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ExifReader from 'exifreader'
import https from 'https'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 从 admin-server/.env 读取 API Key
dotenv.config({ path: path.join(__dirname, '../admin-server/.env') })
const AMAP_KEY = process.env.AMAP_API_KEY || ''

// 读取图片EXIF
async function readExif(imagePath) {
  try {
    const fullPath = path.join(__dirname, '..', imagePath.replace(/^\//, ''))
    if (!fs.existsSync(fullPath)) {
      console.log(`  文件不存在: ${fullPath}`)
      return null
    }
    const buffer = fs.readFileSync(fullPath)
    const tags = ExifReader.load(buffer)
    return tags
  } catch (err) {
    console.log(`  读取EXIF失败: ${err.message}`)
    return null
  }
}

// 从EXIF提取相机信息
function extractCameraInfo(tags) {
  const info = {}
  if (tags.Model?.description) info.model = tags.Model.description
  if (tags.Make?.description && !info.model?.includes(tags.Make.description)) {
    info.model = `${tags.Make.description} ${info.model || ''}`
  }
  if (tags.FocalLengthIn35mmFilm?.value) {
    info.focal_length = `${tags.FocalLengthIn35mmFilm.value}mm`
  } else if (tags.FocalLength?.description) {
    info.focal_length = tags.FocalLength.description
  }
  if (tags.FNumber?.description) info.aperture = tags.FNumber.description
  if (tags.ExposureTime?.description) info.shutter_speed = tags.ExposureTime.description
  return info
}

// 提取GPS坐标
function extractGPS(tags) {
  const lat = tags.GPSLatitude?.description
  const lng = tags.GPSLongitude?.description
  if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) }
  return null
}

// 高德逆地理编码
function getLocation(gps) {
  return new Promise((resolve) => {
    if (!gps) return resolve(null)
    if (!AMAP_KEY) {
      console.log('  ⚠ 未配置高德 API Key')
      return resolve(null)
    }
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${gps.lng},${gps.lat}&extensions=base`
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.status === '1' && json.regeocode?.addressComponent) {
            const addr = json.regeocode.addressComponent
            // city可能是空数组[]或空字符串
            const province = (addr.province || '').toString().replace(/省$|市$/, '')
            const cityRaw = Array.isArray(addr.city) ? '' : (addr.city || '')
            const districtRaw = Array.isArray(addr.district) ? '' : (addr.district || '')
            const city = (cityRaw || districtRaw).replace(/市$|区$/, '')
            // 直辖市情况：city为空
            if (!city) {
              resolve(province)
            } else {
              resolve(`${province}.${city}`)
            }
          } else resolve(null)
        } catch { resolve(null) }
      })
    }).on('error', () => resolve(null))
  })
}

// 延迟函数
const delay = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  // 读取photos.js
  const photosPath = path.join(__dirname, '../src/data/photos.js')
  let content = fs.readFileSync(photosPath, 'utf-8')
  
  // 提取photoGallery数组
  const match = content.match(/export const photoGallery = (\[[\s\S]*?\n\])/)
  if (!match) {
    console.error('无法解析photos.js')
    return
  }
  
  const photos = eval(match[1])
  console.log(`找到 ${photos.length} 张照片\n`)

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    console.log(`[${i+1}/${photos.length}] ${photo.title}`)
    
    const tags = await readExif(photo.image_src)
    if (!tags) continue

    const camera = extractCameraInfo(tags)
    if (camera.model) photo.model = camera.model
    if (camera.focal_length) photo.focal_length = camera.focal_length
    if (camera.aperture) photo.aperture = camera.aperture
    if (camera.shutter_speed) photo.shutter_speed = camera.shutter_speed
    
    console.log(`  相机: ${camera.model || '无'}, 焦距: ${camera.focal_length || '无'}`)

    const gps = extractGPS(tags)
    if (gps) {
      console.log(`  GPS: ${gps.lat}, ${gps.lng}`)
      const location = await getLocation(gps)
      if (location) {
        photo.location = location
        console.log(`  位置: ${location}`)
      }
      await delay(700) // QPS限制2，需要间隔约700ms
    }
  }

  // 生成新的文件内容
  const newGallery = JSON.stringify(photos, null, 2)
  const newContent = content.replace(
    /export const photoGallery = \[[\s\S]*?\n\]/,
    `export const photoGallery = ${newGallery}`
  )
  
  fs.writeFileSync(photosPath, newContent)
  console.log('\n✅ photos.js 已更新')
}

main().catch(console.error)
