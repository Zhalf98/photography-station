import { BasePhotoProcessor } from './BasePhotoProcessor.js'
import { convertHEIC, formatFileSize } from './utils.js'

/**
 * iPhone Live Photo 处理器
 * 支持从单个 HEIC 文件中提取视频轨道
 */
export class IPhoneLivePhotoProcessor extends BasePhotoProcessor {
  async detect(file) {
    if (!file) return false
    
    console.log('🔍 iPhone 处理器检测:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    })
    
    // 检查是否是 HEIC 文件
    const isHEIC = file.type === 'image/heic' || 
                   file.name.toLowerCase().endsWith('.heic')
    
    if (!isHEIC) {
      console.log('❌ 不是 HEIC 文件')
      return false
    }

    console.log('✅ 是 HEIC 文件，检查是否包含视频轨道...')

    // 只读取文件末尾 1MB 来检测（提高速度）
    try {
      const chunkSize = Math.min(file.size, 1024 * 1024) // 最多读 1MB
      const blob = file.slice(file.size - chunkSize) // 从末尾读取
      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      
      // 从后往前查找 ftyp 标记
      for (let i = bytes.length - 50; i > 0; i--) {
        if (bytes[i] === 0x66 && 
            bytes[i+1] === 0x74 && 
            bytes[i+2] === 0x79 && 
            bytes[i+3] === 0x70) {
          console.log(`🎬 检测到 iPhone Live Photo (位置: 末尾 ${bytes.length - i} 字节)`)
          return true
        }
      }
      
      console.log('❌ 未检测到视频轨道，可能是普通 HEIC 照片')
    } catch (err) {
      console.warn('检测 HEIC 视频轨道失败:', err)
    }

    return false
  }

  async process(file) {
    console.log('🎯 使用 iPhone Live Photo 处理器')
    
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // 从后往前寻找视频起始点，避开静态图部分的干扰
    // 搜索 'ftyp' 标记 (66 74 79 70)
    let videoStartIndex = -1
    
    console.log('🔍 从后往前扫描文件，寻找视频轨道...')
    
    for (let i = bytes.length - 50; i > 0; i--) {
      // 寻找 ftyp 标记
      if (bytes[i] === 0x66 && 
          bytes[i+1] === 0x74 && 
          bytes[i+2] === 0x79 && 
          bytes[i+3] === 0x70) {
        videoStartIndex = i - 4 // 包含长度位
        console.log(`📍 找到 ftyp 标记，位置: ${i}`)
        break
      }
    }

    if (videoStartIndex === -1) {
      console.error('❌ 该 HEIC 可能不包含视频轨，或者不是标准的 Apple 实况格式')
      throw new Error('该 HEIC 文件不包含实况视频轨道')
    }

    console.log(`📍 视频轨道起始位置: ${videoStartIndex} (${(videoStartIndex / 1024 / 1024).toFixed(2)} MB)`)

    // 截取视频数据
    const videoData = bytes.slice(videoStartIndex)
    
    // 封装为 Blob（使用 QuickTime 格式）
    const videoBlob = new Blob([videoData], { type: 'video/quicktime' })

    console.log(`📊 视频大小: ${formatFileSize(videoData.length)}`)

    // 图片部分：尝试转换，失败则用原始文件
    let imageBlob = file
    let imageUrl = null
    let needsServerConversion = true

    try {
      console.log('🔄 尝试转换 HEIC 为 JPG（用于预览）...')
      const result = await convertHEIC(file)
      imageBlob = Array.isArray(result) ? result[0] : result
      imageUrl = URL.createObjectURL(imageBlob)
      needsServerConversion = false
      console.log('✅ HEIC 转换成功，可以预览')
    } catch (error) {
      console.warn('⚠️ HEIC 转换失败，预览不可用，但上传后后端会处理:', error.message)
      imageBlob = file
      imageUrl = URL.createObjectURL(file)
      needsServerConversion = true
    }

    console.log('✅ iPhone Live Photo 处理完成')
    console.log('⚠️ 注意：视频为 HEVC 编码，部分旧设备可能无法播放')

    return {
      imageBlob,
      videoBlob,
      imageUrl,
      videoUrl: URL.createObjectURL(videoBlob),
      isLivePhoto: true,
      source: 'iphone',
      needsServerConversion,
      exif: null
    }
  }

  getPriority() {
    return 80
  }
}
