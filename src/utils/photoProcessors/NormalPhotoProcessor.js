import { BasePhotoProcessor } from './BasePhotoProcessor.js'
import { convertHEIC, formatFileSize } from './utils.js'

/**
 * 普通照片处理器
 * 处理单张图片（JPEG、PNG、HEIC 等）
 */
export class NormalPhotoProcessor extends BasePhotoProcessor {
  async detect(file) {
    // 普通照片处理器作为兜底，总是返回 true
    return file && file.type && file.type.startsWith('image/')
  }

  async process(file) {
    console.log('🎯 使用普通照片处理器')
    
    let imageBlob = file

    // HEIC 转换
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      console.log('🔄 转换 HEIC 格式...')
      imageBlob = await convertHEIC(file)
    }

    console.log(`✅ 普通照片处理完成 - 图片: ${formatFileSize(imageBlob.size)}`)

    // 提取 EXIF 信息
    const exif = await this.extractEXIF(imageBlob)

    return {
      imageBlob,
      videoBlob: null,
      imageUrl: URL.createObjectURL(imageBlob),
      videoUrl: null,
      isLivePhoto: false,
      source: 'normal',
      exif
    }
  }

  getPriority() {
    return 0 // 最低优先级，作为兜底
  }
}
