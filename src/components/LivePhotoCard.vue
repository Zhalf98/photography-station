<template>
  <div 
    class="live-photo-card card-interactive"
    :class="{ 'is-playing': isPlaying }"
    @pointerdown="handlePressStart"
    @pointerup="handlePressEnd"
    @pointercancel="handlePressEnd"
    @pointerleave="handlePressEnd"
    @contextmenu.prevent
  >
    <!-- 静态图片 -->
    <img
      v-show="!isPlaying"
      :src="photo.thumbnail"
      :alt="photo.title"
      class="static-image"
    />
    
    <!-- 视频 -->
    <video
      v-show="isPlaying"
      ref="videoRef"
      :src="videoSrc"
      class="live-video"
      preload="auto"
      muted
      loop
      playsinline
    />
    
    <!-- 左上角 LIVE 图标 -->
    <div v-if="photo.is_live_photo" class="live-indicator" :class="{ 'is-active': isPlaying }">
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
        <!-- 外围虚线圆 -->
        <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
        <!-- 中间实心圆 -->
        <circle cx="16" cy="16" r="8" stroke="currentColor" stroke-width="2"/>
        <!-- 中心点 -->
        <circle cx="16" cy="16" r="3" fill="currentColor"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { selectVideoSource } from '@/utils/videoCodec'

const props = defineProps({
  photo: {
    type: Object,
    required: true
  }
})

const videoRef = ref(null)
const isPlaying = ref(false)
const pressTimer = ref(null)
const videoSrc = ref('')

// 根据浏览器支持选择视频源
onMounted(async () => {
  if (props.photo.is_live_photo) {
    videoSrc.value = await selectVideoSource(props.photo)
  }
})

const handlePressStart = (e) => {
  e.preventDefault()
  
  // 500ms 长按判定（iPhone 风格）
  pressTimer.value = setTimeout(() => {
    startPlaying()
  }, 500)
}

const handlePressEnd = () => {
  clearTimeout(pressTimer.value)
  
  if (isPlaying.value) {
    stopPlaying()
  }
}

const startPlaying = () => {
  // 触觉反馈
  if (navigator.vibrate) {
    navigator.vibrate(15)
  }
  
  // 播放视频
  const video = videoRef.value
  if (video) {
    video.muted = false
    video.currentTime = 0
    video.play().catch(err => {
      console.error('视频播放失败:', err)
    })
    isPlaying.value = true
  }
}

const stopPlaying = () => {
  const video = videoRef.value
  if (video) {
    video.pause()
    video.currentTime = 0
    video.muted = true
    isPlaying.value = false
  }
}
</script>

<style scoped>
.live-photo-card {
  position: relative;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  transition: transform 0.2s ease;
}

.live-photo-card.is-playing {
  transform: scale(0.98);
}

.static-image,
.live-video {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
}

/* 左上角 LIVE 同心圆图标 */
.live-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  color: #1d1d1f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 2;
}

.live-indicator svg {
  animation: pulse 2s ease-in-out infinite;
}

.live-indicator.is-active {
  background: rgba(255, 204, 0, 0.95);
  transform: scale(1.1);
}

.live-indicator.is-active svg {
  animation: none;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.7;
    transform: scale(0.95);
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .live-indicator {
    background: rgba(28, 28, 30, 0.95);
    color: #f5f5f7;
  }
  
  .live-indicator.is-active {
    background: rgba(255, 204, 0, 0.95);
    color: #1d1d1f;
  }
}

/* 悬停效果 */
.live-photo-card:hover .live-indicator {
  transform: scale(1.1);
}
</style>
