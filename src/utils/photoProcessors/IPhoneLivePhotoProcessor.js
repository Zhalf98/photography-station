import { BasePhotoProcessor } from './BasePhotoProcessor.js'
import { convertHEIC, formatFileSize } from './utils.js'

/**
 * iPhone Live Photo 处理器
 * 支持 HEIC + MOV 配对文件
 */
export class IPhoneLivePhotoProcessor extends BasePhotoProcessor {
  async detect(files) {
    if (!Array.isArray(files) || files.length < 2) return false

    const images = files.filter(f => 
      f.type === 'image/heic' || 
      f.type === 'image/jpeg' ||
      f.name.toLowerCase().endsWith('.heic') ||
      f.name.toLowerCase().endsWith('.jpg')
    )
    
    const videos = files.filter(f => 
      f.type === 'video/quicktime' || 
      f.name.toLowerCase().endsWith('.mov')
    )

    return images.length > 0 && videos.length > 0
  }

  async process(files) {
    console.log('🎯 使用 iPhone Live Photo 处理器')
    
    const images = files.filter(f => 
      f.type === 'image/heic' || 
      f.type === 'image/jpeg' ||
      f.name.toLowerCase().endsWith('.heic') ||
      f.name.toLowerCase().endsWith('.jpg')
    )
    
    const videos = files.filter(f => 
      f.type === 'video/quicktime' || 
      f.name.toLowerCase().endsWith('.mov')
    )

    // 匹配文件名
    for (const img of images) {
      const baseName = img.name.replace(/\.(heic|jpg|jpeg)$/i, '')
      const matchedVideo = videos.find(v => 
        v.name.toLowerCase().startsWith(baseName.toLowerCase())
      )
      
      if (matchedVideo) {
        let imageBlob = img

        // HEIC 转换
        if (img.type === 'image/heic' || img.name.toLowerCase().endsWith('.heic')) {
          console.log('🔄 转换 HEIC 格式...')
          imageBlob = await convertHEIC(img)
        }

        console.log(`✅ iPhone 配对成功 - 图片: ${formatFileSize(imageBlob.size)}, 视频: ${formatFileSize(matchedVideo.size)}`)

        // 提取 EXIF 信息
        const exif = await this.extractEXIF(imageBlob)

        return {
          imageBlob,
          videoBlob: matchedVideo,
          imageUrl: URL.createObjectURL(imageBlob),
          videoUrl: URL.createObjectURL(matchedVideo),
          isLivePhoto: true,
          source: 'iphone',
          exif
        }
      }
    }

    throw new Error('未找到匹配的 Live Photo 配对文件')
  }

  getPriority() {
    return 80
  }
}
