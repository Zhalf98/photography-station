import { BasePhotoProcessor } from './BasePhotoProcessor.js'
import { findBytes, formatFileSize } from './utils.js'

/**
 * vivo Motion Photo 处理器
 * 支持 vivo X200 Pro 等机型的 Live Photo
 */
export class VivoMotionPhotoProcessor extends BasePhotoProcessor {
  async detect(file) {
    if (!file || file.type !== 'image/jpeg') return false

    try {
      const headerSize = Math.min(256 * 1024, file.size)
      const headerBlob = file.slice(0, headerSize)
      const headerText = await headerBlob.text()

      // 检测 vivo 特征标记
      const hasMotionPhoto = headerText.includes('Item:Semantic="MotionPhoto"')
      const hasVivoLivePhoto = headerText.includes('vivo:LivePhoto')
      
      return hasMotionPhoto || hasVivoLivePhoto
    } catch (error) {
      console.error('vivo Motion Photo 检测失败:', error)
      return false
    }
  }

  /**
   * 检测照片特性（Live Photo、HDR 等）
   */
  async _detectFeatures(headerText) {
    const features = {
      isLivePhoto: headerText.includes('Item:Semantic="MotionPhoto"') || 
                   headerText.includes('vivo:LivePhoto'),
      isHDR: headerText.includes('Item:Semantic="GainMap"') || 
             headerText.includes('vivo:HDRImage'),
      hasGainMap: headerText.includes('Item:Semantic="GainMap"')
    }

    console.log('📊 vivo 照片特性分析:')
    console.log(`  - Live Photo: ${features.isLivePhoto ? '✅' : '❌'}`)
    console.log(`  - HDR: ${features.isHDR ? '✅' : '❌'}`)
    console.log(`  - GainMap: ${features.hasGainMap ? '✅' : '❌'}`)

    return features
  }

  async process(file) {
    console.log('🎯 使用 vivo Motion Photo 处理器')
    
    const fileSize = file.size
    const headerSize = Math.min(256 * 1024, fileSize)
    const headerBlob = file.slice(0, headerSize)
    const headerText = await headerBlob.text()

    // 检测照片特性
    const features = await this._detectFeatures(headerText)

    // 方法1: 查找 Item:Length 标记
    const itemLengthMatch = this._findItemLength(headerText)
    
    if (itemLengthMatch) {
      const videoLength = parseInt(itemLengthMatch[1])
      const videoStart = fileSize - videoLength

      if (videoStart > 0 && videoStart < fileSize && videoLength > 100) {
        const imageBlob = new Blob([file.slice(0, videoStart)], { type: 'image/jpeg' })
        const videoBlob = new Blob([file.slice(videoStart)], { type: 'video/mp4' })

        console.log(`✅ vivo 分离成功 - 图片: ${formatFileSize(imageBlob.size)}, 视频: ${formatFileSize(videoBlob.size)}`)

        // 提取 EXIF 信息
        const exif = await this.extractEXIF(imageBlob)

        return {
          imageBlob,
          videoBlob,
          imageUrl: URL.createObjectURL(imageBlob),
          videoUrl: URL.createObjectURL(videoBlob),
          isLivePhoto: true,
          source: 'vivo',
          isHDR: features.isHDR,
          hasGainMap: features.hasGainMap,
          exif
        }
      }
    }

    // 方法2: 二进制查找（兜底）
    return await this._extractByBinarySearch(file)
  }

  _findItemLength(text) {
    // 尝试多种匹配模式
    const patterns = [
      /Item:Semantic="MotionPhoto"[^>]+Item:Length="(\d+)"/,
      /Item:Semantic="MotionPhoto"[^>]+Item:Length=(\d+)/,
      /Item:Length="(\d+)"[^>]+Item:Semantic="MotionPhoto"/,
      /Item:Length=(\d+)[^>]+Item:Semantic="MotionPhoto"/
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return match
    }

    return null
  }

  async _extractByBinarySearch(file) {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // 查找 JPG 结束标记
    let jpgEnd = -1
    for (let i = bytes.length - 1; i > 0; i--) {
      if (bytes[i - 1] === 0xFF && bytes[i] === 0xD9) {
        jpgEnd = i + 1
        break
      }
    }

    if (jpgEnd === -1) {
      throw new Error('未找到 JPG 结束标记')
    }

    const remainingBytes = bytes.slice(jpgEnd)
    const ftypIndex = findBytes(remainingBytes, [0x66, 0x74, 0x79, 0x70])

    if (ftypIndex < 0) {
      throw new Error('未找到视频数据')
    }

    const videoStart = jpgEnd + Math.max(0, ftypIndex - 4)
    const imageBlob = new Blob([bytes.slice(0, jpgEnd)], { type: 'image/jpeg' })
    const videoBlob = new Blob([bytes.slice(videoStart)], { type: 'video/mp4' })

    // 提取 EXIF 信息
    const exif = await this.extractEXIF(imageBlob)

    return {
      imageBlob,
      videoBlob,
      imageUrl: URL.createObjectURL(imageBlob),
      videoUrl: URL.createObjectURL(videoBlob),
      isLivePhoto: true,
      source: 'vivo',
      isHDR: false,
      hasGainMap: false,
      exif
    }
  }

  getPriority() {
    return 100 // 高优先级
  }
}
