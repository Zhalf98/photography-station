import { BasePhotoProcessor } from './BasePhotoProcessor.js'
import { findBytes, formatFileSize } from './utils.js'

/**
 * Google/Samsung Motion Photo 处理器
 * 支持 Google Pixel、Samsung Galaxy 等机型
 */
export class GoogleMotionPhotoProcessor extends BasePhotoProcessor {
  async detect(file) {
    if (file.type !== 'image/jpeg') return false

    try {
      const headerSize = Math.min(256 * 1024, file.size)
      const headerBlob = file.slice(0, headerSize)
      const headerText = await headerBlob.text()

      // 检测 Google/Samsung 特征标记
      return headerText.includes('GCamera:MicroVideo="1"') ||
             headerText.includes('GCamera:MicroVideoOffset')
    } catch (error) {
      console.error('Google Motion Photo 检测失败:', error)
      return false
    }
  }

  async process(file) {
    console.log('🎯 使用 Google/Samsung Motion Photo 处理器')
    
    const fileSize = file.size
    const headerSize = Math.min(256 * 1024, fileSize)
    const headerBlob = file.slice(0, headerSize)
    const headerText = await headerBlob.text()

    // 查找视频偏移量
    const offsetMatch = headerText.match(/GCamera:MicroVideoOffset="(\d+)"/)
    
    if (!offsetMatch) {
      throw new Error('未找到视频偏移量标记')
    }

    const offset = parseInt(offsetMatch[1])
    let videoStart = fileSize - offset

    // 精确查找 ftyp 标记（±50 字节范围）
    const searchStart = Math.max(0, videoStart - 50)
    const searchEnd = Math.min(fileSize, videoStart + 50)
    const searchBlob = file.slice(searchStart, searchEnd)
    const searchBuffer = await searchBlob.arrayBuffer()
    const searchBytes = new Uint8Array(searchBuffer)

    const ftypIndex = findBytes(searchBytes, [0x66, 0x74, 0x79, 0x70])
    
    if (ftypIndex >= 0) {
      videoStart = searchStart + Math.max(0, ftypIndex - 4)
      console.log(`✅ 找到精确的视频起始位置: ${videoStart}`)
    }

    const imageBlob = file.slice(0, videoStart, 'image/jpeg')
    const videoBlob = file.slice(videoStart, fileSize, 'video/mp4')

    console.log(`✅ Google 分离成功 - 图片: ${formatFileSize(imageBlob.size)}, 视频: ${formatFileSize(videoBlob.size)}`)

    // 提取 EXIF 信息
    const exif = await this.extractEXIF(imageBlob)

    return {
      imageBlob,
      videoBlob,
      imageUrl: URL.createObjectURL(imageBlob),
      videoUrl: URL.createObjectURL(videoBlob),
      isLivePhoto: true,
      source: 'google',
      exif
    }
  }

  getPriority() {
    return 90
  }
}
