/**
 * 工具函数集合
 */

/**
 * 查找字节序列
 * @param {Uint8Array} bytes - 字节数组
 * @param {number[]} pattern - 要查找的字节模式
 * @returns {number} 找到的位置，未找到返回 -1
 */
export function findBytes(bytes, pattern) {
  for (let i = 0; i < bytes.length - pattern.length; i++) {
    let match = true
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        match = false
        break
      }
    }
    if (match) return i
  }
  return -1
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

/**
 * HEIC 转 JPG
 * @param {File|Blob} heicFile - HEIC 文件
 * @returns {Promise<Blob>} JPG Blob
 */
export async function convertHEIC(heicFile) {
  try {
    const heic2any = (await import('heic2any')).default
    
    const jpgBlob = await heic2any({
      blob: heicFile,
      toType: 'image/jpeg',
      quality: 0.92
    })
    
    return Array.isArray(jpgBlob) ? jpgBlob[0] : jpgBlob
  } catch (error) {
    throw new Error('HEIC 转换失败: ' + error.message)
  }
}
