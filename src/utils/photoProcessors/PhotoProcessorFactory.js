import { VivoMotionPhotoProcessor } from './VivoMotionPhotoProcessor.js'
import { GoogleMotionPhotoProcessor } from './GoogleMotionPhotoProcessor.js'
import { HDRPhotoProcessor } from './HDRPhotoProcessor.js'
import { NormalPhotoProcessor } from './NormalPhotoProcessor.js'

/**
 * 照片处理器工厂
 * 使用策略模式，根据文件类型自动选择合适的处理器
 */
export class PhotoProcessorFactory {
  constructor() {
    // 注册所有处理器（按优先级排序）
    this.processors = [
      new VivoMotionPhotoProcessor(),    // 100
      new GoogleMotionPhotoProcessor(),  // 90
      new HDRPhotoProcessor(),           // 85
      new NormalPhotoProcessor()         // 0
    ].sort((a, b) => b.getPriority() - a.getPriority())
  }

  /**
   * 注册新的处理器
   * @param {BasePhotoProcessor} processor - 处理器实例
   */
  register(processor) {
    this.processors.push(processor)
    this.processors.sort((a, b) => b.getPriority() - a.getPriority())
  }

  /**
   * 自动检测并处理文件
   * @param {File|File[]} files - 单个文件或文件数组
   * @returns {Promise<ProcessResult>}
   */
  async process(file) {
    console.log(`📸 开始处理文件: ${file.name}`)

    // 遍历所有处理器，找到第一个支持的
    for (const processor of this.processors) {
      try {
        console.log(`🔍 尝试处理器: ${processor.getName()} (优先级: ${processor.getPriority()})`)
        const canHandle = await processor.detect(file)
        
        if (canHandle) {
          console.log(`✅ 选择处理器: ${processor.getName()}`)
          
          try {
            return await processor.process(file)
          } catch (processError) {
            console.error(`❌ 处理器 ${processor.getName()} 处理失败:`, processError)
            // 如果是最后一个处理器（兜底处理器），直接抛出错误
            if (processor.getPriority() === 0) {
              throw processError
            }
            // 否则继续尝试下一个处理器
            console.log('⏭️ 尝试下一个处理器...')
            continue
          }
        }
      } catch (error) {
        console.warn(`处理器 ${processor.getName()} 检测失败:`, error)
        continue
      }
    }

    throw new Error('没有找到合适的处理器')
  }

  /**
   * 获取所有已注册的处理器
   * @returns {BasePhotoProcessor[]}
   */
  getProcessors() {
    return [...this.processors]
  }
}

// 导出单例
export const photoProcessorFactory = new PhotoProcessorFactory()
