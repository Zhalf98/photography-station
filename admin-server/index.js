import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import sharp from 'sharp'
import exifr from 'exifr'

// 加载 .env 文件（从 admin-server 目录）
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
const ROOT_DIR = path.join(__dirname, '..')
const DATA_FILE = path.join(ROOT_DIR, 'src/data/photos.js')
const CONFIG_FILE = path.join(ROOT_DIR, 'src/config/index.js')
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads')

// 从环境变量读取 API Key
const AMAP_API_KEY = process.env.AMAP_API_KEY || ''

const app = express()
app.use(cors())
app.use(express.json())

// 静态文件服务 - 上传的图片
app.use('/uploads', express.static(UPLOADS_DIR))

// 确保上传目录存在
async function ensureUploadDirs() {
  await fs.mkdir(path.join(UPLOADS_DIR, 'original'), { recursive: true })
  await fs.mkdir(path.join(UPLOADS_DIR, 'thumbnail'), { recursive: true })
}
ensureUploadDirs()

// Multer 配置
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只支持图片文件'))
    }
  }
})

// ============ 数据读写工具 ============

async function readDataFile() {
  const content = await fs.readFile(DATA_FILE, 'utf-8')
  const configContent = await fs.readFile(CONFIG_FILE, 'utf-8')
  
  // 从环境变量和配置文件提取配置
  let exifConfig = { 
    enabled: true, 
    amapApiKey: AMAP_API_KEY,  // 从环境变量读取
    manualDataFirst: false 
  }
  
  // 从 exifConfig 提取 enabled
  const enabledMatch = configContent.match(/exifConfig[\s\S]*?enabled:\s*(true|false)/)
  if (enabledMatch) {
    exifConfig.enabled = enabledMatch[1] === 'true'
  }
  
  // 提取 categories
  const categoriesMatch = content.match(/export const categories\s*=\s*(\[[\s\S]*?\n\])/)
  let categories = []
  if (categoriesMatch) {
    try {
      categories = eval('(' + categoriesMatch[1] + ')')
    } catch (e) {
      console.error('解析 categories 失败:', e)
    }
  }
  
  // 提取 photoGallery
  const photosMatch = content.match(/export const photoGallery\s*=\s*(\[[\s\S]*\])/)
  let photos = []
  if (photosMatch) {
    try {
      photos = eval('(' + photosMatch[1] + ')')
    } catch (e) {
      console.error('解析 photoGallery 失败:', e)
    }
  }
  
  return { exifConfig, categories, photos }
}

async function writeDataFile(data) {
  const { categories, photos } = data
  
  const content = `/**
 * 照片数据文件
 * 存储分类和照片列表数据
 */

// 分类配置
export const categories = ${JSON.stringify(categories, null, 2)}

// 照片列表
export const photoGallery = ${JSON.stringify(photos, null, 2)}
`
  
  await fs.writeFile(DATA_FILE, content, 'utf-8')
}

// ============ API 路由 ============

// 获取所有数据
app.get('/api/data', async (req, res) => {
  try {
    const data = await readDataFile()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取分类列表
app.get('/api/categories', async (req, res) => {
  try {
    const { categories } = await readDataFile()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 保存分类
app.post('/api/categories', async (req, res) => {
  try {
    const data = await readDataFile()
    data.categories = req.body
    await writeDataFile(data)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取图片列表
app.get('/api/photos', async (req, res) => {
  try {
    const { photos } = await readDataFile()
    res.json(photos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 保存图片列表
app.post('/api/photos', async (req, res) => {
  try {
    const data = await readDataFile()
    data.photos = req.body
    await writeDataFile(data)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除单张图片
app.delete('/api/photos/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index)
    const data = await readDataFile()
    if (index >= 0 && index < data.photos.length) {
      const photo = data.photos[index]
      
      // 删除实际的图片文件
      try {
        // 删除原图
        if (photo.image_src) {
          const originalPath = path.join(ROOT_DIR, photo.image_src)
          await fs.unlink(originalPath).catch(() => {})
          console.log('删除原图:', originalPath)
        }
        // 删除缩略图
        if (photo.thumbnail) {
          const thumbnailPath = path.join(ROOT_DIR, photo.thumbnail)
          await fs.unlink(thumbnailPath).catch(() => {})
          console.log('删除缩略图:', thumbnailPath)
        }
      } catch (e) {
        console.warn('删除图片文件失败:', e.message)
      }
      
      // 从数据中移除
      data.photos.splice(index, 1)
      await writeDataFile(data)
      res.json({ success: true })
    } else {
      res.status(400).json({ error: '无效的索引' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 上传图片
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const buffer = req.file.buffer
    const randomId = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
    const baseName = randomId
    
    // 读取 EXIF 信息
    let exifData = {}
    try {
      exifData = await exifr.parse(buffer, {
        pick: [
          'FNumber', 'ShutterSpeedValue', 'ExposureTime',
          'FocalLengthIn35mmFormat', 'DateTime', 'Model', 'Make',
          'GPSLatitude', 'GPSLongitude', 'latitude', 'longitude'
        ],
        tiff: true,
        gps: true,
        mergeOutput: true
      }) || {}
    } catch (e) {
      console.warn('EXIF 读取失败:', e.message)
    }

    // 保存原图
    const originalName = `${baseName}${ext}`
    const originalPath = path.join(UPLOADS_DIR, 'original', originalName)
    await fs.writeFile(originalPath, buffer)

    // 读取原图尺寸
    const metadata = await sharp(buffer).metadata()
    const originalWidth = metadata.width
    const originalHeight = metadata.height

    // 生成缩略图 (压缩到约1MB，宽度限制800px)
    const thumbnailName = `${baseName}_small${ext}`
    const thumbnailPath = path.join(UPLOADS_DIR, 'thumbnail', thumbnailName)
    
    const thumbnailInfo = await sharp(buffer)
      .rotate() // 自动根据EXIF方向旋转
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)

    // 提取相机信息
    const cameraInfo = extractCameraInfo(exifData)
    const gpsInfo = extractGPS(exifData)

    res.json({
      success: true,
      original: `/uploads/original/${originalName}`,
      thumbnail: `/uploads/thumbnail/${thumbnailName}`,
      width: thumbnailInfo.width,
      height: thumbnailInfo.height,
      exif: {
        cameraInfo,
        gps: gpsInfo
      }
    })
  } catch (error) {
    console.error('上传失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 地理编码接口（API Key 从环境变量读取）
app.get('/api/geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query
    if (!lat || !lng) {
      return res.status(400).json({ error: '缺少参数' })
    }
    
    if (!AMAP_API_KEY) {
      return res.json({ location: null, error: '未配置高德地图 API Key' })
    }
    
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_API_KEY}&location=${lng},${lat}&extensions=base`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === '1' && data.regeocode?.addressComponent) {
      const addr = data.regeocode.addressComponent
      const province = addr.province?.replace(/省$/, '') || ''
      const city = (addr.city || addr.district || '').replace(/市$/, '')
      
      // 直辖市处理
      const municipalities = ['北京', '上海', '天津', '重庆']
      if (municipalities.some(m => province.includes(m))) {
        res.json({ location: province.replace('市', '') })
      } else {
        res.json({ location: city ? `${province}.${city}` : province })
      }
    } else {
      res.json({ location: null })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取 EXIF 配置
app.get('/api/config', async (req, res) => {
  try {
    const { exifConfig } = await readDataFile()
    res.json(exifConfig)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============ 工具函数 ============

function extractCameraInfo(exifData) {
  if (!exifData) return null
  
  const parts = []
  
  // 型号
  if (exifData.Model) {
    const model = exifData.Model.replace(exifData.Make || '', '').trim()
    if (model) parts.push(model)
  }
  
  // 焦距
  if (exifData.FocalLengthIn35mmFormat) {
    parts.push(`${Math.round(exifData.FocalLengthIn35mmFormat)}mm`)
  }
  
  // 光圈
  if (exifData.FNumber) {
    parts.push(`f/${exifData.FNumber}`)
  }
  
  // 快门
  if (exifData.ExposureTime) {
    const exp = exifData.ExposureTime
    if (exp < 1) {
      parts.push(`1/${Math.round(1/exp)}s`)
    } else {
      parts.push(`${exp}s`)
    }
  }
  
  return parts.length > 0 ? parts.join(' · ') : null
}

function extractGPS(exifData) {
  if (!exifData) return null
  
  const lat = exifData.latitude || exifData.GPSLatitude
  const lng = exifData.longitude || exifData.GPSLongitude
  
  if (lat && lng) {
    return { latitude: lat, longitude: lng }
  }
  return null
}

// 启动服务
const PORT = 3001
app.listen(PORT, () => {
  console.log(`✅ API 服务已启动 (端口 ${PORT})`)
})
