<template>
  <el-dialog
    v-model="visible"
    title="上传照片"
    :width="isMobile ? '100%' : '800px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @close="handleClose"
    class="upload-dialog"
  >
    <!-- 浏览器兼容性警告 -->
    <el-alert
      v-if="showBrowserWarning"
      type="warning"
      :closable="true"
      @close="dismissWarning"
      style="margin-bottom: 20px;"
    >
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-icon :size="18"><Warning /></el-icon>
          <span style="font-weight: 600;">浏览器兼容性提示</span>
        </div>
      </template>
      <div style="margin-top: 8px; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;">
          检测到您正在使用 <strong>Edge</strong> 或 <strong>Firefox</strong> 浏览器，Live Photo 预览功能可能无法正常工作。
        </p>
        <p style="margin: 0 0 8px 0;">
          <strong>推荐方案：</strong>
        </p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>使用 <strong style="color: #409eff;">Chrome 浏览器</strong> 以获得最佳体验</li>
          <li>或点击"下载视频"按钮，在本地播放器中测试视频</li>
          <li>预览失败不影响上传，前台展示应该正常</li>
        </ul>
      </div>
    </el-alert>
    
    <el-form :model="form" label-width="100px">
      <!-- 文件上传和预览 -->
      <el-form-item label="选择文件">
        <div class="upload-preview-row">
          <div class="upload-section">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="fileList"
              :show-file-list="false"
              accept="image/jpeg,image/png,image/jpg"
            >
              <el-button type="primary">
                <el-icon style="margin-right: 8px;"><upload-filled /></el-icon>
                选择文件
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持 JPG/PNG 图片，vivo 动态照片自动提取视频
                </div>
              </template>
            </el-upload>
            
            <!-- 照片类型标签 - 放在上传按钮下方 -->
            <div v-if="previewData" class="photo-tags" style="margin-top: 20px;">
              <div style="color: #909399; font-size: 13px; margin-bottom: 8px;">照片类型</div>
              <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
                <el-tag v-if="previewData.isLivePhoto" type="success" size="large">
                  Live Photo
                </el-tag>
                <el-tag v-if="previewData.isHDR" type="warning" size="large">
                  HDR
                </el-tag>
                <el-tag v-if="!previewData.isLivePhoto && !previewData.isHDR" type="info" size="large">
                  静态照片
                </el-tag>
                <el-tag type="primary" size="large">
                  {{ getSourceLabel(previewData.source) }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <!-- 预览区域 -->
          <div v-if="previewData" class="preview-section">
            <div class="preview-image-wrapper">
              <!-- HEIC 无法预览提示 -->
              <div v-if="previewData.needsServerConversion" class="heic-placeholder">
                <el-icon :size="48" color="#909399"><Picture /></el-icon>
                <p style="margin-top: 12px; color: #606266;">HEIC 格式无法预览</p>
                <p style="margin-top: 4px; color: #909399; font-size: 12px;">上传后会自动转换为 JPG</p>
                <p v-if="previewData.isLivePhoto" style="margin-top: 8px; color: #67c23a; font-size: 13px;">
                  ✓ 已检测到 Live Photo 视频
                </p>
              </div>
              
              <!-- HDR 照片使用特殊渲染 -->
              <HDRImageViewer
                v-else-if="previewData.needsHDRRendering"
                :image-url="previewData.imageUrl"
                :is-h-d-r="previewData.isHDR"
                class="preview-image"
              />
              <!-- 普通照片 -->
              <img
                v-else
                :src="previewData.imageUrl"
                class="preview-image"
                @error="handleImageError"
              />
              
              <!-- Live Photo 视频预览 -->
              <video
                v-if="previewData.isLivePhoto && previewData.videoUrl"
                ref="previewVideoRef"
                :src="previewData.videoUrl"
                class="preview-video"
                :style="{ opacity: isPreviewPlaying ? 1 : 0 }"
                loop
                playsinline
                preload="auto"
              />
              
              <!-- Live Photo 标记（左上角，仿 iOS） -->
              <div v-if="previewData.isLivePhoto" class="live-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
                <span>动态照片</span>
              </div>
              
              <!-- Live Photo 控制按钮（悬停显示） -->
              <div v-if="previewData.isLivePhoto && previewData.videoUrl" class="live-controls" :class="{ 'is-playing': isPreviewPlaying }">
                <div class="button-group">
                  <el-button
                    type="primary"
                    size="small"
                    @mousedown="startPreview"
                    @mouseup="stopPreview"
                    @mouseleave="stopPreview"
                    @touchstart.prevent="startPreview"
                    @touchend.prevent="stopPreview"
                  >
                    {{ isPreviewPlaying ? '播放中...' : '按住预览' }}
                  </el-button>
                  <el-button size="small" @click="downloadVideo">下载视频</el-button>
                  <el-button v-if="!previewData.needsServerConversion" size="small" @click="downloadImage">下载图片</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- EXIF 信息卡片 -->
      <el-form-item label="EXIF信息" v-if="previewData">
        <div class="exif-card">
          <el-row :gutter="12">
            <el-col :span="12">
              <div class="exif-item">
                <label>型号：</label>
                <el-input v-model="form.model" placeholder="vivo X200 Pro" size="small" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="exif-item">
                <label>地点：</label>
                <el-input v-model="form.location" placeholder="广东.惠州" size="small" />
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="12" style="margin-top: 10px;">
            <el-col :span="8">
              <div class="exif-item">
                <label>焦距：</label>
                <el-input v-model="form.focal_length" placeholder="230mm" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="exif-item">
                <label>光圈：</label>
                <el-input v-model="form.aperture" placeholder="f/2.7" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="exif-item">
                <label>快门：</label>
                <el-input v-model="form.shutter_speed" placeholder="1/100s" size="small" />
              </div>
            </el-col>
          </el-row>
        </div>
      </el-form-item>

      <!-- 照片信息 -->
      <el-form-item label="标题" required>
        <el-input v-model="form.title" placeholder="请输入图片标题" />
      </el-form-item>

      <el-form-item label="分类" required>
        <el-select v-model="form.category" placeholder="选择分类">
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.name"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.describe"
          type="textarea"
          :rows="4"
          placeholder="图片描述（可选）"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="uploading" @click="handleUpload">
        确认上传
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, VideoPlay, Warning, Sunny, Picture } from '@element-plus/icons-vue'
import { photoProcessorFactory } from '@/utils/photoProcessors'
import HDRImageViewer from '@/components/HDRImageViewer.vue'

const props = defineProps({
  modelValue: Boolean,
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(false)
const uploadRef = ref(null)
const fileList = ref([])
const previewData = ref(null)
const previewVideoRef = ref(null)
const uploading = ref(false)
const isPreviewPlaying = ref(false)
const showBrowserWarning = ref(false)
const isMobile = ref(window.innerWidth <= 768)

const form = ref({
  title: '',
  category: '',
  describe: '',
  location: '',
  model: '',
  focal_length: '',
  aperture: '',
  shutter_speed: ''
})

// 检测浏览器并显示警告
const checkBrowserCompatibility = () => {
  const isEdge = /Edg/.test(navigator.userAgent)
  const isFirefox = /Firefox/.test(navigator.userAgent)
  
  // 检查是否已经关闭过警告
  const dismissed = localStorage.getItem('livePhotoWarningDismissed')
  
  if ((isEdge || isFirefox) && !dismissed) {
    showBrowserWarning.value = true
  }
}

// 关闭警告
const dismissWarning = () => {
  showBrowserWarning.value = false
  localStorage.setItem('livePhotoWarningDismissed', 'true')
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    checkBrowserCompatibility()
    // 检测屏幕尺寸
    isMobile.value = window.innerWidth <= 768
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 监听视频 URL 变化，预加载视频
watch(() => previewData.value?.videoUrl, async (newUrl) => {
  if (newUrl && previewVideoRef.value) {
    const video = previewVideoRef.value
    video.load()
  }
}, { flush: 'post' })

// 文件选择处理
const handleFileChange = async (file, fileListData) => {
  try {
    // 清理旧的 Blob URL（防止内存泄漏）
    if (previewData.value) {
      if (previewData.value.imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewData.value.imageUrl)
      }
      if (previewData.value.videoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewData.value.videoUrl)
      }
    }
    
    // 清空旧的文件列表，只保留新选择的文件
    fileList.value = [file]
    
    // 使用工厂自动选择处理器
    const result = await photoProcessorFactory.process(file.raw)
    
    previewData.value = result
    
    // 自动填充 EXIF 信息到表单
    if (result.exif) {
      const exif = result.exif
      
      // 相机型号
      if (exif.model) {
        form.value.model = exif.model
      }
      
      // 焦距
      if (exif.focalLength) {
        form.value.focal_length = `${Math.round(exif.focalLength)}mm`
      }
      
      // 光圈
      if (exif.aperture) {
        form.value.aperture = `f/${exif.aperture}`
      }
      
      // 快门速度
      if (exif.shutterSpeed) {
        const speed = exif.shutterSpeed
        if (speed < 1) {
          form.value.shutter_speed = `1/${Math.round(1/speed)}s`
        } else {
          form.value.shutter_speed = `${speed}s`
        }
      }
      
      // GPS 地理位置（静默获取，不显示提示）
      if (exif.gps) {
        try {
          const response = await fetch(`/api/geocode?lat=${exif.gps.latitude}&lng=${exif.gps.longitude}`)
          const data = await response.json()
          if (data.location) {
            form.value.location = data.location
          }
        } catch (err) {
          console.warn('地理编码失败:', err)
        }
      }
    }
    
  } catch (error) {
    console.error('文件处理失败:', error)
    ElMessage.error('文件处理失败：' + error.message)
  }
}

// 开始预览
const startPreview = () => {
  const video = previewVideoRef.value
  if (!video || isPreviewPlaying.value) return
  
  isPreviewPlaying.value = true
  video.currentTime = 0
  video.muted = false // 取消静音，播放声音
  video.volume = 1.0
  
  video.play().catch(err => {
    console.error('播放失败:', err)
    // 如果播放失败，可能是因为浏览器不允许自动播放有声音的视频
    // 尝试静音播放
    video.muted = true
    video.play().catch(err2 => {
      console.error('静音播放也失败:', err2)
      isPreviewPlaying.value = false
    })
  })
}

// 停止预览
const stopPreview = () => {
  const video = previewVideoRef.value
  if (!video || !isPreviewPlaying.value) return
  
  video.pause()
  video.currentTime = 0
  video.muted = true // 恢复静音
  isPreviewPlaying.value = false
}

// 获取来源标签
const getSourceLabel = (source) => {
  const sourceMap = {
    'vivo': 'vivo 手机',
    'google': 'Google/Samsung',
    'iphone': 'iPhone',
    'hdr': 'HDR 照片',
    'normal': '标准照片'
  }
  return sourceMap[source] || '未知来源'
}

// 上传
const handleUpload = async () => {
  if (!previewData.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  if (!form.value.title || !form.value.category) {
    ElMessage.warning('请填写标题和分类')
    return
  }
  
  uploading.value = true
  
  try {
    const formData = new FormData()
    formData.append('image', previewData.value.imageBlob, 'image.jpg')
    
    if (previewData.value.videoBlob) {
      formData.append('video', previewData.value.videoBlob, 'video.mp4')
    }
    
    // 传递前端检测到的信息
    formData.append('is_hdr', previewData.value.isHDR ? 'true' : 'false')
    formData.append('is_live_photo', previewData.value.isLivePhoto ? 'true' : 'false')
    formData.append('source', previewData.value.source || 'normal')
    
    // 上传文件
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    const uploadData = await uploadRes.json()
    
    if (!uploadData.success) {
      throw new Error(uploadData.error || '上传失败')
    }
    
    // 获取现有照片数据
    const photosRes = await fetch('/api/photos')
    const photos = await photosRes.json()
    
    // 添加新照片
    const newPhoto = {
      thumbnail: uploadData.thumbnail,
      image_src: uploadData.original,
      title: form.value.title,
      category: form.value.category,
      describe: form.value.describe,
      location: form.value.location,
      width: uploadData.width,
      height: uploadData.height,
      is_hdr: uploadData.is_hdr || false,
      color_space: uploadData.color_space || 'srgb',
      is_live_photo: uploadData.is_live_photo || false,
      live_video: uploadData.live_video || null,
      live_video_h264: uploadData.live_video_h264 || null,
      live_codec: uploadData.live_codec || null,
      live_duration: uploadData.live_duration || null,
      live_file_size: uploadData.live_file_size || null,
      live_has_audio: uploadData.live_has_audio || false,
      model: form.value.model || '',
      focal_length: form.value.focal_length || '',
      aperture: form.value.aperture || '',
      shutter_speed: form.value.shutter_speed || ''
    }
    
    photos.unshift(newPhoto)
    
    // 保存
    await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photos)
    })
    
    ElMessage.success('上传成功')
    emit('success')
    handleClose()
    
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败：' + error.message)
  } finally {
    uploading.value = false
  }
}

// 下载视频
const downloadVideo = () => {
  if (!previewData.value?.videoBlob) {
    ElMessage.warning('没有视频可下载')
    return
  }
  
  const url = URL.createObjectURL(previewData.value.videoBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'live_photo_video.mp4'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('视频下载成功')
}

// 下载图片
const downloadImage = () => {
  if (!previewData.value?.imageBlob) {
    ElMessage.warning('没有图片可下载')
    return
  }
  
  const url = URL.createObjectURL(previewData.value.imageBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'live_photo_image.jpg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('图片下载成功')
}

const handleClose = () => {
  // 清理 Blob URL（防止内存泄漏）
  if (previewData.value) {
    if (previewData.value.imageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewData.value.imageUrl)
    }
    if (previewData.value.videoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewData.value.videoUrl)
    }
  }
  
  visible.value = false
  fileList.value = []
  previewData.value = null
  form.value = {
    title: '',
    category: '',
    describe: '',
    location: '',
    model: '',
    focal_length: '',
    aperture: '',
    shutter_speed: ''
  }
}

// 组件卸载时清理 Blob URL
onUnmounted(() => {
  if (previewData.value) {
    if (previewData.value.imageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewData.value.imageUrl)
    }
    if (previewData.value.videoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewData.value.videoUrl)
    }
  }
})
</script>

<style scoped>
.upload-dialog :deep(.el-form-item) {
  margin-bottom: 18px;
}

.upload-preview-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.upload-section {
  flex-shrink: 0;
}

.preview-section {
  flex: 1;
  min-width: 0;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-image-wrapper {
  position: relative;
  width: fit-content;
  max-width: 100%;
  border-radius: 8px;
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-image {
  display: block;
  max-height: 200px;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

.preview-image :deep(canvas),
.preview-image :deep(img) {
  max-height: 200px !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

.preview-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  transition: opacity 0.2s ease;
  z-index: 10;
}

/* Live 标记 - 左上角（仿 iOS 样式） */
.live-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #1d1d1f;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 3px;
  z-index: 30;
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.live-badge svg {
  flex-shrink: 0;
}

/* 控制按钮 - 底部，悬停显示 */
.live-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 20;
  pointer-events: none;
}

.preview-image-wrapper:hover .live-controls {
  opacity: 1;
}

/* 播放时隐藏按钮 */
.live-controls.is-playing {
  opacity: 0 !important;
}

.live-controls .button-group {
  display: flex;
  gap: 8px;
  justify-content: center;
  pointer-events: auto;
}

.file-info {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.exif-card {
  width: 100%;
  background: var(--admin-bg, #f5f7fa);
  border-radius: 8px;
  padding: 16px;
}

.exif-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exif-item label {
  color: var(--admin-text-secondary, #606266);
  font-size: 14px;
  white-space: nowrap;
  min-width: 48px;
}

.exif-item :deep(.el-input) {
  flex: 1;
}

.photo-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.photo-tags .el-tag {
  display: flex;
  align-items: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .upload-dialog :deep(.el-form-item__label) {
    float: none !important;
    display: block !important;
    width: 100% !important;
    text-align: left !important;
    margin-bottom: 8px !important;
    line-height: 1.5 !important;
  }
  
  .upload-dialog :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100% !important;
  }
  
  .upload-preview-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .upload-section {
    width: 100%;
  }
  
  .upload-section .photo-tags {
    margin-top: 16px !important;
  }
  
  .upload-section .photo-tags > div:first-child {
    margin-bottom: 8px;
  }
  
  .upload-section .photo-tags > div:last-child {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
  }
  
  .preview-section {
    width: 100%;
  }
  
  .exif-card {
    padding: 12px;
  }
  
  .exif-card :deep(.el-row) {
    margin: 0 !important;
  }
  
  .exif-card :deep(.el-col) {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
    margin-bottom: 10px;
  }
  
  .exif-card :deep(.el-col:last-child) {
    margin-bottom: 0;
  }
  
  .exif-item {
    width: 100%;
  }
  
  .exif-item label {
    min-width: 45px;
    font-size: 13px;
  }
  
  .exif-item :deep(.el-input) {
    flex: 1;
  }
  
  .live-controls .button-group {
    flex-direction: column;
    gap: 8px;
  }
  
  .live-controls .button-group .el-button {
    width: 100%;
  }
  
  .preview-image-wrapper {
    max-width: 100%;
  }
  
  .photo-tags {
    width: 100%;
  }
}
</style>
