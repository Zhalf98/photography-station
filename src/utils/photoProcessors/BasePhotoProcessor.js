import { extractEXIF } from './exifUtils.js'

/**
 * 照片处理器基类
 * 定义统一的处理接口
 */
export class BasePhotoProcessor {
  /**
   * 检测是否支持该文件
   * @param {File} file - 文件对象
   * @returns {Promise<boolean>}
   */
  async detect(file) {
    throw new Error('detect() 必须被子类实现')
  }

  /**
   * 处理文件
   * @param {File|File[]} file - 文件对象或文件数组
   * @returns {Promise<ProcessResult>}
   */
  async process(file) {
    throw new Error('process() 必须被子类实现')
  }

  /**
   * 提取 EXIF 信息（通用方法）
   * @param {File|Blob} file - 图片文件
   * @returns {Promise<Object|null>}
   */
  async extractEXIF(file) {
    return await extractEXIF(file)
  }

  /**
   * 获取处理器名称
   * @returns {string}
   */
  getName() {
    return this.constructor.name
  }

  /**
   * 获取处理器优先级（数字越大优先级越高）
   * @returns {number}
   */
  getPriority() {
    return 0
  }
}

/**
 * 处理结果类型定义
 * @typedef {Object} ProcessResult
 * @property {Blob} imageBlob - 图片 Blob
 * @property {Blob|null} videoBlob - 视频 Blob（可选）
 * @property {string} imageUrl - 图片 URL
 * @property {string|null} videoUrl - 视频 URL（可选）
 * @property {boolean} isLivePhoto - 是否为 Live Photo
 * @property {string} source - 来源标识
 * @property {Object|null} exif - EXIF 信息（可选）
 * @property {boolean} isHDR - 是否为 HDR（可选）
 * @property {boolean} hasGainMap - 是否有 GainMap（可选）
 * @property {boolean} needsHDRRendering - 是否需要 HDR 渲染（可选）
 */
