import { BasePhotoProcessor } from './BasePhotoProcessor.js'

/**
 * 普通照片处理器
 * 处理单张图片（JPEG、PNG 等）
 */
export class NormalPhotoProcessor extends BasePhotoProcessor {
  async detect(file) {
    if (!file) return false
    
    // 检查是否是图片文件（排除 HEIC）
    const isImage = file && (
      (file.type && file.type.startsWith('image/') && file.type !== 'image/heic') ||
      file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
    )
    
    return !!isImage
  }

  async process(file) {
    console.log('🎯 使用普通照片处理器')
    
    const imageBlob = file

    console.log(`✅ 普通照片处理完成`)

    // 提取 EXIF 信息
    let exif = null
    try {
      exif = await this.extractEXIF(imageBlob)
    } catch (err) {
      console.warn('EXIF 提取失败:', err)
    }

    return {
      imageBlob,
      videoBlob: null,
      imageUrl: URL.createObjectURL(imageBlob),
      videoUrl: null,
      isLivePhoto: false,
      source: 'normal',
      needsServerConversion: false,
      exif
    }
  }

  getPriority() {
    return 0 // 最低优先级，作为兜底
  }
}
