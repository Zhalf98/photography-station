<template>
  <div class="hdr-viewer">
    <!-- 使用浏览器原生 HDR 渲染，根据 isHDR 动态绑定样式 -->
    <img 
      :src="imageUrl" 
      :alt="alt"
      :class="['viewer-image', { 'hdr-enhanced': isHDR }]"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在加载图像...</span>
    </div>
    <div v-if="error" class="error-overlay">
      <el-icon><WarningFilled /></el-icon>
      <span>图片加载失败</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Loading, WarningFilled } from '@element-plus/icons-vue'

const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Image'
  },
  isHDR: {
    type: Boolean,
    default: true // 默认当作 HDR 处理
  }
})

const loading = ref(true)
const error = ref(false)

const handleLoad = () => {
  loading.value = false
  if (props.isHDR) {
    console.log('✅ HDR 图像加载成功（浏览器原生渲染 + CSS 增强）')
  } else {
    console.log('✅ 图像加载成功')
  }
}

const handleError = () => {
  loading.value = false
  error.value = true
  console.error('❌ HDR 图像加载失败')
}
</script>

<style scoped>
.hdr-viewer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}

/* 基础图片样式 */
.viewer-image {
  display: block;
  max-width: calc(100vw - 360px - 40px);
  max-height: calc(100vh - 40px);
  width: auto !important;
  height: auto !important;
  object-fit: contain;
  
  /* 自动处理 EXIF 方向信息 */
  image-orientation: from-image;
}

/* HDR 增强样式 - 最完整的自动 HDR CSS 组合 */
.viewer-image.hdr-enhanced {
  /* 1. 核心：解除亮度限制，允许激发屏幕峰值亮度 */
  dynamic-range-limit: high;
  
  /* 2. 基础：确保色彩不缩水 */
  color-profile: display-p3;
  color-interpolation-filters: linearRGB;
  
  /* 3. 优化：确保高像素大图渲染不发虚 */
  image-rendering: high-quality;
}

/* 4. 硬件侦测加力：只在 HDR 显示器上触发 */
@media (dynamic-range: high) {
  .viewer-image.hdr-enhanced {
    /* 在 HDR 屏幕上，适度提升对比度会更容易诱发硬件的"激发亮度" */
    /* 1.05 到 1.1 是安全范围，既能变亮又不会导致颜色断层 */
    filter: contrast(1.1) brightness(1.05);
    
    /* 强制开启硬件加速 */
    will-change: filter;
  }
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 14px;
}

.loading-overlay .el-icon {
  font-size: 32px;
}

.error-overlay {
  color: #f56c6c;
}

.error-overlay .el-icon {
  font-size: 32px;
}
</style>
