import { BasePhotoProcessor } from './BasePhotoProcessor.js'

/**
 * HDR 照片处理器
 * 支持带 Gain Map 的 Ultra HDR 照片（如 vivo X200 Pro）
 */
export class HDRPhotoProcessor extends BasePhotoProcessor {
  async detect(file) {
    if (file.type !== 'image/jpeg') return false

    try {
      const headerSize = Math.min(256 * 1024, file.size)
      const headerBlob = file.slice(0, headerSize)
      const headerText = await headerBlob.text()

      // 检测 HDR 特征标记
      return headerText.includes('Item:Semantic="GainMap"') ||
             headerText.includes('vivo:HDRImage')
    } catch (error) {
      console.error('HDR 照片检测失败:', error)
      return false
    }
  }

  async process(file) {
    console.log('🎯 使用 HDR 照片处理器')
    
    const headerSize = Math.min(256 * 1024, file.size)
    const headerBlob = file.slice(0, headerSize)
    const headerText = await headerBlob.text()

    const hasGainMap = headerText.includes('Item:Semantic="GainMap"')
    const hasVivoHDR = headerText.includes('vivo:HDRImage')

    console.log('📊 HDR 照片特性:')
    console.log(`  - GainMap: ${hasGainMap ? '✅' : '❌'}`)
    console.log(`  - vivo HDR: ${hasVivoHDR ? '✅' : '❌'}`)

    const imageBlob = file
    const imageUrl = URL.createObjectURL(imageBlob)

    // 提取 EXIF 信息
    const exif = await this.extractEXIF(imageBlob)

    return {
      imageBlob,
      videoBlob: null,
      imageUrl,
      videoUrl: null,
      isLivePhoto: false,
      source: 'hdr',
      isHDR: true,
      hasGainMap,
      needsHDRRendering: hasGainMap, // 标记需要特殊渲染
      exif
    }
  }

  getPriority() {
    return 85 // 高于普通照片，低于 Live Photo
  }
}
