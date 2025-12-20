/**
 * 照片处理器模块
 * 使用策略模式处理不同格式的照片
 * 
 * 使用示例：
 * ```js
 * import { photoProcessorFactory } from '@/utils/photoProcessors'
 * 
 * // 处理单个文件
 * const result = await photoProcessorFactory.process(file)
 * 
 * // 处理多个文件（iPhone Live Photo）
 * const result = await photoProcessorFactory.process([imageFile, videoFile])
 * 
 * // 注册自定义处理器
 * import { MyCustomProcessor } from './MyCustomProcessor'
 * photoProcessorFactory.register(new MyCustomProcessor())
 * ```
 * 
 * 扩展新格式：
 * 1. 继承 BasePhotoProcessor
 * 2. 实现 detect() 和 process() 方法
 * 3. 设置 getPriority() 返回优先级
 * 4. 在工厂中注册
 */

export { BasePhotoProcessor } from './BasePhotoProcessor.js'
export { VivoMotionPhotoProcessor } from './VivoMotionPhotoProcessor.js'
export { GoogleMotionPhotoProcessor } from './GoogleMotionPhotoProcessor.js'
export { IPhoneLivePhotoProcessor } from './IPhoneLivePhotoProcessor.js'
export { HDRPhotoProcessor } from './HDRPhotoProcessor.js'
export { NormalPhotoProcessor } from './NormalPhotoProcessor.js'
export { PhotoProcessorFactory, photoProcessorFactory } from './PhotoProcessorFactory.js'
export { findBytes, convertHEIC, formatFileSize } from './utils.js'
