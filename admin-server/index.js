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
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'
import jwt from 'jsonwebtoken'

// 配置 ffmpeg 和 ffprobe 路径
ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

// 加载 .env 文件（从 admin-server 目录）
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
const ROOT_DIR = path.join(__dirname, '..')
const DATA_FILE = path.join(ROOT_DIR, 'src/data/photos.js')
const CONFIG_FILE = path.join(ROOT_DIR, 'src/config/index.js')
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads')

// 从环境变量读取 API Key
const AMAP_API_KEY = process.env.AMAP_API_KEY || ''

// 管理员认证配置
const JWT_SECRET = process.env.JWT_SECRET || 'plog_admin_secret_key_2024'
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin'
let ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123'

const app = express()
app.use(cors())
app.use(express.json())

// ============ 认证 ============

// 登录接口
app.post("/api/login", (req, res) => {
  const { username, password } = req.body
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: "7d" })
    res.json({ success: true, token })
  } else {
    res.status(401).json({ error: "用户名或密码错误" })
  }
})

// Token 验证中间件（保护写操作）
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return res.status(401).json({ error: "未登录" })
  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: "登录已过期" })
  }
}


// ============ 系统设置 ============

// 获取当前设置
app.get("/api/admin-path", (req, res) => { res.json({ adminPath: process.env.ADMIN_PATH || "admin" }) })

app.get("/api/settings", authMiddleware, (req, res) => {
  res.json({
    adminPath: process.env.ADMIN_PATH || "admin",
    username: ADMIN_USER
  })
})

// 修改密码
app.post("/api/settings/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "请填写完整" })
    }
    if (currentPassword !== ADMIN_PASS) {
      return res.status(401).json({ error: "当前密码错误" })
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: "新密码至少4位" })
    }
    
    // 更新 .env 文件
    const envPath = path.join(__dirname, '.env')
    let envContent = await fs.readFile(envPath, 'utf-8')
    envContent = envContent.replace(
      /ADMIN_PASSWORD=.*/,
      `ADMIN_PASSWORD=${newPassword}`
    )
    await fs.writeFile(envPath, envContent)
    
    // 更新内存中的变量
    process.env.ADMIN_PASSWORD = newPassword
    ADMIN_PASS = newPassword
    
    res.json({ success: true, message: "密码已更新，下次登录生效" })
  } catch (err) {
    res.status(500).json({ error: "更新失败: " + err.message })
  }
})

// 修改后台路径
app.post("/api/settings/admin-path", authMiddleware, async (req, res) => {
  try {
    const { adminPath } = req.body
    if (!adminPath || !/^[a-zA-Z0-9_-]+$/.test(adminPath)) {
      return res.status(400).json({ error: "路径只能包含字母、数字、下划线和连字符" })
    }
    if (adminPath === "admin") {
      // 允许恢复默认
    }
    
    const oldPath = process.env.ADMIN_PATH || "admin"
    
    // 更新 .env
    const envPath = path.join(__dirname, '.env')
    let envContent = await fs.readFile(envPath, 'utf-8')
    if (envContent.includes('ADMIN_PATH=')) {
      envContent = envContent.replace(/ADMIN_PATH=.*/, `ADMIN_PATH=${adminPath}`)
    } else {
      envContent += `\nADMIN_PATH=${adminPath}`
    }
    await fs.writeFile(envPath, envContent)
    process.env.ADMIN_PATH = adminPath
    
    // 前端已改为动态路由，无需修改 router 文件或重新构建
    res.json({ success: true, message: `后台路径已改为 /${adminPath}，请刷新页面`, newPath: adminPath })
  } catch (err) {
    res.status(500).json({ error: "更新失败: " + err.message })
  }
});


// 保护所有写操作路由
["/api/photos", "/api/categories", "/api/upload", "/api/upload-temp"].forEach(r => {
  app.use(r, (req, res, next) => {
    if (req.method === "GET") return next()
    authMiddleware(req, res, next)
  })
})

// 静态文件服务 - 上传的图片
app.use('/uploads', express.static(UPLOADS_DIR))

// 确保上传目录存在
async function ensureUploadDirs() {
  await fs.mkdir(path.join(UPLOADS_DIR, 'original'), { recursive: true })
  await fs.mkdir(path.join(UPLOADS_DIR, 'thumbnail'), { recursive: true })
  await fs.mkdir(path.join(UPLOADS_DIR, 'live'), { recursive: true })
}
ensureUploadDirs()

// Multer 配置
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB（支持视频）
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('只支持图片和视频文件'))
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
        // 删除视频（Live Photo）
        if (photo.live_video) {
          const videoPath = path.join(ROOT_DIR, photo.live_video)
          await fs.unlink(videoPath).catch(() => {})
          console.log('删除视频:', videoPath)
        }
      } catch (e) {
        console.warn('删除文件失败:', e.message)
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

// 临时上传接口（用于预览）
app.post('/api/upload-temp', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files['image']) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const imageFile = req.files['image'][0]
    const videoFile = req.files['video']?.[0]
    
    const randomId = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(imageFile.originalname).toLowerCase() || '.jpg'
    
    // 保存到 temp 目录
    const imageName = `${randomId}${ext}`
    const imagePath = path.join(UPLOADS_DIR, 'temp', imageName)
    await fs.writeFile(imagePath, imageFile.buffer)
    
    let videoUrl = null
    
    if (videoFile) {
      const videoName = `${randomId}.mp4`
      const videoPath = path.join(UPLOADS_DIR, 'temp', videoName)
      
      // 保存原始视频
      await fs.writeFile(videoPath, videoFile.buffer)
      videoUrl = `/uploads/temp/${videoName}`
      console.log(`✅ 临时保存视频: ${videoName}`)
    }
    
    res.json({
      success: true,
      imageUrl: `/uploads/temp/${imageName}`,
      videoUrl,
      tempId: randomId
    })
  } catch (error) {
    console.error('临时上传失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 删除临时文件
app.delete('/api/upload-temp/:tempId', async (req, res) => {
  try {
    const { tempId } = req.params
    const files = await fs.readdir(path.join(UPLOADS_DIR, 'temp'))
    
    for (const file of files) {
      if (file.startsWith(tempId)) {
        await fs.unlink(path.join(UPLOADS_DIR, 'temp', file)).catch(() => {})
      }
    }
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 上传图片（支持 Live Photo）
app.post('/api/upload', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files['image']) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const imageFile = req.files['image'][0]
    const videoFile = req.files['video']?.[0]
    
    const buffer = imageFile.buffer
    const randomId = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(imageFile.originalname).toLowerCase() || '.jpg'
    const baseName = randomId
    
    // 优先使用前端传来的检测结果
    let isHDR = req.body.is_hdr === 'true'
    let isLivePhoto = req.body.is_live_photo === 'true'
    const source = req.body.source || 'normal'
    
    console.log(`📷 图片: ${imageFile.originalname}`)
    console.log(`   来源: ${source}`)
    console.log(`   Live Photo: ${isLivePhoto}`)
    console.log(`   HDR: ${isHDR}`)
    
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

    // 保存原图（需要旋转以修正 EXIF 方向）
    const originalName = `${baseName}${ext}`
    const originalPath = path.join(UPLOADS_DIR, 'original', originalName)
    
    // 使用 Sharp 处理原图：保留元数据 + 自动旋转
    const originalInfo = await sharp(buffer)
      .withMetadata() // 保留 HDR 元数据（GainMap）
      .rotate() // 根据 EXIF 方向自动旋转
      .jpeg({ quality: 95 }) // 高质量保存
      .toFile(originalPath)

    // 读取原图尺寸和色彩空间
    const originalWidth = originalInfo.width
    const originalHeight = originalInfo.height
    const metadata = await sharp(buffer).metadata()
    const colorSpace = metadata.space || 'srgb'

    // 生成缩略图
    const thumbnailName = `${baseName}_small${ext}`
    const thumbnailPath = path.join(UPLOADS_DIR, 'thumbnail', thumbnailName)
    
    const thumbnailInfo = await sharp(buffer)
      .withMetadata() // 保留 HDR 元数据（GainMap）
      .rotate()
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)

    // 处理视频（Live Photo）
    let videoData = null
    if (videoFile) {
      const videoName = `${baseName}.mp4`
      const videoNameH264 = `${baseName}_h264.mp4`
      const videoPath = path.join(UPLOADS_DIR, 'live', videoName)
      const videoPathH264 = path.join(UPLOADS_DIR, 'live', videoNameH264)
      
      // 保存原始视频文件（H.265）
      await fs.writeFile(videoPath, videoFile.buffer)
      console.log(`✅ 保存原始视频: ${videoName}`)
      
      // 检测视频编码格式
      const videoCodec = await detectVideoCodec(videoPath)
      console.log(`📹 视频编码: ${videoCodec}`)
      
      // 如果是 H.265，转码为 H.264 兼容版本
      let h264Path = null
      if (videoCodec === 'hevc' || videoCodec === 'h265') {
        console.log('🔄 开始转码 H.265 → H.264...')
        try {
          await transcodeToH264(videoPath, videoPathH264)
          h264Path = `/uploads/live/${videoNameH264}`
          console.log(`✅ H.264 转码完成: ${videoNameH264}`)
        } catch (e) {
          console.error('❌ 转码失败:', e.message)
        }
      }
      
      // 获取视频信息
      const { getVideoDurationInSeconds } = await import('get-video-duration')
      let duration = 0
      try {
        duration = await getVideoDurationInSeconds(videoPath)
      } catch (e) {
        console.warn('获取视频时长失败:', e.message)
      }
      
      videoData = {
        path: `/uploads/live/${videoName}`,
        pathH264: h264Path, // H.264 兼容版本
        codec: videoCodec,
        duration: duration.toFixed(2),
        size: (videoFile.size / 1024 / 1024).toFixed(2),
        hasAudio: true
      }
    }

    // 提取相机信息
    const cameraInfo = extractCameraInfo(exifData)
    const gpsInfo = extractGPS(exifData)

    res.json({
      success: true,
      original: `/uploads/original/${originalName}`,
      thumbnail: `/uploads/thumbnail/${thumbnailName}`,
      width: thumbnailInfo.width,
      height: thumbnailInfo.height,
      is_hdr: isHDR, // 使用前端传来的检测结果
      color_space: colorSpace,
      is_live_photo: isLivePhoto, // 使用前端传来的检测结果
      source: source,
      live_video: videoData?.path,
      live_video_h264: videoData?.pathH264, // H.264 兼容版本
      live_codec: videoData?.codec,
      live_duration: videoData?.duration,
      live_file_size: videoData?.size,
      live_has_audio: videoData?.hasAudio,
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

// 检测视频编码格式
function detectVideoCodec(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video')
      if (videoStream) {
        resolve(videoStream.codec_name)
      } else {
        reject(new Error('未找到视频流'))
      }
    })
  })
}

// 转码为 H.264
function transcodeToH264(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-crf 23',           // 质量控制（18-28，越小质量越好）
        '-preset medium',    // 编码速度（ultrafast/fast/medium/slow）
        '-movflags +faststart', // 优化网络播放
        '-pix_fmt yuv420p'   // 兼容性像素格式
      ])
      .on('start', (cmd) => {
        console.log('🎬 FFmpeg 命令:', cmd)
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`⏳ 转码进度: ${Math.round(progress.percent)}%`)
        }
      })
      .on('end', () => {
        console.log('✅ 转码完成')
        resolve()
      })
      .on('error', (err) => {
        console.error('❌ 转码错误:', err.message)
        reject(err)
      })
      .save(outputPath)
  })
}

// 启动服务
const PORT = 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API 服务已启动 (端口 ${PORT})`)
  console.log(`   局域网访问: http://<你的IP>:${PORT}`)
})
