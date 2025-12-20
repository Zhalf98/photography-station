/**
 * 视频编码支持检测工具（简化版）
 */

/**
 * 根据浏览器支持情况选择视频源
 * @param {Object} photo 照片对象
 * @returns {string} 视频 URL
 */
export function selectVideoSource(photo) {
  if (!photo.is_live_photo) {
    return null
  }
  
  // 优先使用 H.264 版本（兼容性最好）
  if (photo.live_video_h264) {
    return photo.live_video_h264
  }
  
  // 如果没有 H.264 版本，使用原始视频
  return photo.live_video
}
