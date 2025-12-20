<template>
  <transition name="modal-fade">
    <div 
      v-if="currentPhoto"
      class="photo-modal"
      @click="handleModalClick"
    >
      <!-- 中间：图片区域 -->
      <div 
        class="image-container"
        :class="{ 'has-thumbnails': isMultiMode }"
        @click.stop
        @touchstart="handleImageTouchStart"
        @touchend="handleImageTouchEnd"
      >
        <!-- 左右切换按钮（多张模式，仅 PC 端显示） -->
        <button 
          v-if="isMultiMode && currentIndex > 0 && !isMobile"
          @click="prevPhoto"
          class="nav-btn nav-prev"
        >
          <Icon icon="mdi:chevron-left" :width="32" :height="32" />
        </button>
        
        <Transition 
          :name="transitionDirection === 'next' ? 'slide-next' : 'slide-prev'"
          mode="out-in"
        >
          <div :key="currentIndex" class="image-transition-wrapper">
            <img 
              v-show="!isPlayingLive"
              :src="currentPhoto.image_src" 
              :alt="currentPhoto.title"
              :class="{ 'hdr-enhanced': currentPhoto.is_hdr }"
              class="main-image"
            />
            
            <video
              v-if="currentPhoto.is_live_photo"
              v-show="isPlayingLive"
              ref="videoRef"
              :src="videoSrc"
              class="main-video"
              preload="auto"
              :muted="isMuted"
              :loop="!isMobile"
              playsinline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              @ended="handleVideoEnded"
            />
          </div>
        </Transition>
        
        <button 
          v-if="isMultiMode && currentIndex < photos.length - 1 && !isMobile"
          @click="nextPhoto"
          class="nav-btn nav-next"
        >
          <Icon icon="mdi:chevron-right" :width="32" :height="32" />
        </button>
        
        <!-- Live Photo 控制（左上角） -->
        <div v-if="currentPhoto.is_live_photo" class="live-controls-overlay">
          <div 
            class="live-badge"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
            @click="handleImageClick"
          >
            <!-- 播放中显示暂停图标（仅移动端） -->
            <svg v-if="isPlayingLive && isMobile" width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
              <rect x="11" y="10" width="3" height="12" fill="currentColor" rx="1.5"/>
              <rect x="18" y="10" width="3" height="12" fill="currentColor" rx="1.5"/>
            </svg>
            <!-- 未播放显示 LIVE 图标（Apple 风格） -->
            <svg v-else width="20" height="20" viewBox="0 0 32 32" fill="none">
              <!-- 外围虚线圆 -->
              <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
              <!-- 中间实心圆 -->
              <circle cx="16" cy="16" r="8" stroke="currentColor" stroke-width="2"/>
              <!-- 中心点 -->
              <circle cx="16" cy="16" r="3" fill="currentColor"/>
            </svg>
            <span>LIVE</span>
          </div>
          <button 
            class="mute-btn"
            @click.stop="toggleMute"
            :title="isMuted ? '取消静音' : '静音'"
          >
            <Icon :icon="isMuted ? 'mdi:volume-off' : 'mdi:volume-high'" :width="18" :height="18" />
          </button>
        </div>
      </div>

      <!-- 底部缩略图导航（多张模式） -->
      <div v-if="isMultiMode" class="thumbnail-nav" @click.stop>
        <div 
          class="thumbnail-scroll" 
          ref="thumbnailScroll" 
          @wheel="handleThumbnailWheel"
          @touchstart="handleThumbnailTouchStart"
          @touchmove="handleThumbnailTouchMove"
          @touchend="handleThumbnailTouchEnd"
          @mousedown="handleThumbnailTouchStart"
          @mousemove="handleThumbnailTouchMove"
          @mouseup="handleThumbnailTouchEnd"
          @mouseleave="handleThumbnailTouchEnd"
        >
          <div
            v-for="(photo, index) in photos"
            :key="index"
            @click="goToPhoto(index)"
            class="thumbnail-item"
            :class="{ active: index === currentIndex }"
          >
            <img :src="photo.thumbnail" :alt="photo.title" />
            <div v-if="photo.is_live_photo" class="thumb-live-icon">
              <svg width="12" height="12" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
                <circle cx="16" cy="16" r="8" stroke="currentColor" stroke-width="2"/>
                <circle cx="16" cy="16" r="3" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 右上：关闭按钮和信息按钮（移动端） -->
      <div class="top-bar" @click.stop>
        <button class="info-btn-mobile" @click="toggleMobileInfo">
          <Icon icon="mdi:information-outline" :width="24" :height="24" />
        </button>
        <button class="close-btn" @click="closeModal">
          <Icon icon="mdi:close" :width="24" :height="24" />
        </button>
      </div>

      <!-- 右侧：信息面板（Apple 液态玻璃风格） -->
      <div 
        ref="infoPanelRef"
        class="info-panel" 
        :class="{ 'mobile-open': showMobileInfo }" 
        :style="{ transform: panelTransform }"
        @click.stop
        @touchstart="handlePanelTouchStart"
        @touchmove="handlePanelTouchMove"
        @touchend="handlePanelTouchEnd"
      >
        <!-- 移动端拖动指示器 -->
        <div class="drag-indicator"></div>
        
        <!-- 标题和标签 -->
        <div class="info-section" v-if="currentPhoto.title">
          <h2 class="photo-title">{{ currentPhoto.title }}</h2>
          <div class="badge-section" v-if="currentPhoto.is_live_photo || currentPhoto.is_hdr">
            <span v-if="currentPhoto.is_live_photo" class="badge badge-live">Live Photo</span>
            <span v-if="currentPhoto.is_hdr" class="badge badge-hdr">HDR</span>
          </div>
        </div>

        <!-- 描述 -->
        <div class="info-section" v-if="currentPhoto.describe">
          <p class="description">{{ currentPhoto.describe }}</p>
        </div>

        <!-- 拍摄参数 -->
        <div class="info-section" v-if="currentPhoto.focal_length || currentPhoto.aperture || currentPhoto.shutter_speed">
          <h3 class="section-title">拍摄参数</h3>
          <div class="info-grid">
            <div class="info-row" v-if="currentPhoto.focal_length">
              <span class="info-label">焦距</span>
              <span class="info-value mono">{{ currentPhoto.focal_length }}</span>
            </div>
            <div class="info-row" v-if="currentPhoto.aperture">
              <span class="info-label">光圈</span>
              <span class="info-value mono">{{ currentPhoto.aperture }}</span>
            </div>
            <div class="info-row" v-if="currentPhoto.shutter_speed">
              <span class="info-label">快门</span>
              <span class="info-value mono">{{ currentPhoto.shutter_speed }}</span>
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="info-section" v-if="currentPhoto.model || currentPhoto.location || currentPhoto.category">
          <h3 class="section-title">详细信息</h3>
          <div class="info-grid">
            <div class="info-row" v-if="currentPhoto.model">
              <span class="info-label">设备</span>
              <span class="info-value">{{ currentPhoto.model }}</span>
            </div>
            <div class="info-row" v-if="currentPhoto.location">
              <span class="info-label">位置</span>
              <span class="info-value">{{ currentPhoto.location }}</span>
            </div>
            <div class="info-row" v-if="currentPhoto.category">
              <span class="info-label">分类</span>
              <span class="info-value">{{ currentPhoto.category }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { selectVideoSource } from '@/utils/videoCodec'

export default {
  name: 'PhotoModal',
  components: { Icon },
  props: {
    // 单张模式（向后兼容）
    photo: { type: Object, default: null },
    // 多张模式（相册用）
    photos: { type: Array, default: null },
    initialIndex: { type: Number, default: 0 }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const currentIndex = ref(props.initialIndex)
    const videoRef = ref(null)
    const isPlayingLive = ref(false)
    const isMuted = ref(true)
    const videoSrc = ref('')
    const isMobile = ref(false)
    const showMobileInfo = ref(false)
    const thumbnailScroll = ref(null)
    const transitionDirection = ref('next') // 'next' 或 'prev'
    
    // 判断是否为多张模式
    const isMultiMode = computed(() => props.photos && props.photos.length > 1)
    
    // 同步 initialIndex 的变化
    watch(() => props.initialIndex, (newIndex) => {
      currentIndex.value = newIndex
    })
    
    // 当前照片（兼容单张和多张模式）
    const currentPhoto = computed(() => {
      if (props.photos && props.photos.length > 0) {
        return props.photos[currentIndex.value]
      }
      return props.photo
    })
    
    // 面板拖动相关
    const panelStartY = ref(0)
    const panelCurrentY = ref(0)
    const panelTransform = ref('')
    const infoPanelRef = ref(null)
    
    // 图片滑动手势相关
    const touchStartX = ref(0)
    const touchStartY = ref(0)
    const touchEndX = ref(0)
    const touchEndY = ref(0)
    
    // 缩略图滚动手势相关
    const thumbTouchStartX = ref(0)
    const thumbIsDragging = ref(false)
    const thumbScrollStartLeft = ref(0)

    // 检测是否为移动设备
    const checkMobile = () => {
      isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth < 768
    }

    // 初始化时检测设备
    checkMobile()

    // 导航功能（多张模式）
    const prevPhoto = () => {
      if (isMultiMode.value && currentIndex.value > 0) {
        transitionDirection.value = 'prev'
        currentIndex.value--
      }
    }
    
    const nextPhoto = () => {
      if (isMultiMode.value && currentIndex.value < props.photos.length - 1) {
        transitionDirection.value = 'next'
        currentIndex.value++
      }
    }
    
    const goToPhoto = (index) => {
      if (isMultiMode.value) {
        transitionDirection.value = index > currentIndex.value ? 'next' : 'prev'
        currentIndex.value = index
      }
    }
    
    // 滚动到当前缩略图
    const scrollToThumbnail = async () => {
      await nextTick()
      if (thumbnailScroll.value) {
        const activeThumb = thumbnailScroll.value.querySelector('.thumbnail-item.active')
        if (activeThumb) {
          activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
      }
    }
    
    // 处理缩略图区域的滚轮事件（转换为横向滚动）
    const handleThumbnailWheel = (e) => {
      if (!thumbnailScroll.value) return
      
      e.preventDefault()
      
      // 将垂直滚动转换为横向滚动（降低速度，更舒适）
      const scrollAmount = e.deltaY * 0.8
      thumbnailScroll.value.scrollLeft += scrollAmount
    }
    
    // 缩略图触摸/鼠标拖动 - 开始
    const handleThumbnailTouchStart = (e) => {
      if (!thumbnailScroll.value) return
      
      thumbIsDragging.value = true
      thumbScrollStartLeft.value = thumbnailScroll.value.scrollLeft
      
      // 支持触摸和鼠标
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      thumbTouchStartX.value = clientX
      
      // 鼠标拖动时改变光标
      if (!e.touches) {
        thumbnailScroll.value.style.cursor = 'grabbing'
      }
    }
    
    // 缩略图触摸/鼠标拖动 - 移动
    const handleThumbnailTouchMove = (e) => {
      if (!thumbIsDragging.value || !thumbnailScroll.value) return
      
      e.preventDefault()
      
      // 支持触摸和鼠标
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const deltaX = thumbTouchStartX.value - clientX
      
      thumbnailScroll.value.scrollLeft = thumbScrollStartLeft.value + deltaX
    }
    
    // 缩略图触摸/鼠标拖动 - 结束
    const handleThumbnailTouchEnd = () => {
      thumbIsDragging.value = false
      
      // 恢复光标
      if (thumbnailScroll.value) {
        thumbnailScroll.value.style.cursor = 'grab'
      }
    }
    
    watch(currentPhoto, (newVal) => {
      if (newVal?.is_live_photo) {
        videoSrc.value = selectVideoSource(newVal)
      }
      isPlayingLive.value = false
      isMuted.value = true
      checkMobile()
      if (isMultiMode.value) {
        scrollToThumbnail()
      }
    }, { immediate: true })

    const closeModal = () => emit('close')

    // 点击模态框背景
    const handleModalClick = () => {
      // 如果移动端信息面板打开，先关闭面板
      if (showMobileInfo.value && isMobile.value) {
        showMobileInfo.value = false
        panelTransform.value = ''
      } else {
        // 否则关闭整个模态框
        closeModal()
      }
    }

    // 切换移动端信息面板
    const toggleMobileInfo = () => {
      showMobileInfo.value = !showMobileInfo.value
      if (!showMobileInfo.value) {
        panelTransform.value = ''
      } else {
        // 打开面板时，重置滚动位置到顶部
        setTimeout(() => {
          if (infoPanelRef.value) {
            infoPanelRef.value.scrollTop = 0
          }
        }, 50)
      }
    }

    // 面板触摸开始
    const handlePanelTouchStart = (e) => {
      if (!isMobile.value) return
      panelStartY.value = e.touches[0].clientY
      panelCurrentY.value = 0
    }

    // 面板触摸移动
    const handlePanelTouchMove = (e) => {
      if (!isMobile.value || !showMobileInfo.value) return
      
      const panel = infoPanelRef.value
      if (!panel) return
      
      const deltaY = e.touches[0].clientY - panelStartY.value
      
      // 只有在面板滚动到顶部且向下拖动时，才触发下拉关闭
      if (deltaY > 0 && panel.scrollTop === 0) {
        panelCurrentY.value = deltaY
        panelTransform.value = `translateY(${deltaY}px)`
        e.preventDefault()
      }
    }

    // 面板触摸结束
    const handlePanelTouchEnd = () => {
      if (!isMobile.value) return
      
      // 如果下拉超过 100px，关闭面板
      if (panelCurrentY.value > 100) {
        showMobileInfo.value = false
      }
      
      // 重置
      panelTransform.value = ''
      panelCurrentY.value = 0
    }
    
    // 图片滑动手势 - 触摸开始
    const handleImageTouchStart = (e) => {
      if (!isMobile.value || !isMultiMode.value) return
      touchStartX.value = e.touches[0].clientX
      touchStartY.value = e.touches[0].clientY
    }
    
    // 图片滑动手势 - 触摸结束
    const handleImageTouchEnd = (e) => {
      if (!isMobile.value || !isMultiMode.value) return
      touchEndX.value = e.changedTouches[0].clientX
      touchEndY.value = e.changedTouches[0].clientY
      handleSwipeGesture()
    }
    
    // 处理滑动手势
    const handleSwipeGesture = () => {
      const deltaX = touchEndX.value - touchStartX.value
      const deltaY = touchEndY.value - touchStartY.value
      const minSwipeDistance = 50 // 最小滑动距离
      
      // 判断是否为横向滑动（横向距离大于纵向距离）
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          // 右滑 - 上一张
          prevPhoto()
        } else {
          // 左滑 - 下一张
          nextPhoto()
        }
      }
    }

    // PC 端：鼠标悬停播放
    const handleMouseEnter = () => {
      if (!currentPhoto.value?.is_live_photo || isMobile.value) return
      
      const video = videoRef.value
      if (video) {
        video.currentTime = 0
        video.muted = isMuted.value
        video.play().catch(() => {})
        isPlayingLive.value = true
      }
    }

    // PC 端：鼠标移开暂停
    const handleMouseLeave = () => {
      if (!currentPhoto.value?.is_live_photo || isMobile.value) return
      
      const video = videoRef.value
      if (video) {
        video.pause()
        video.currentTime = 0
        isPlayingLive.value = false
      }
    }

    // 移动端：点击切换播放/暂停
    const handleImageClick = () => {
      if (!currentPhoto.value?.is_live_photo || !isMobile.value) return
      
      const video = videoRef.value
      if (!video) return
      
      if (isPlayingLive.value) {
        video.pause()
        video.currentTime = 0
        isPlayingLive.value = false
      } else {
        video.currentTime = 0
        video.muted = isMuted.value
        video.play().catch(() => {})
        isPlayingLive.value = true
      }
    }

    // 静音切换
    const toggleMute = () => {
      isMuted.value = !isMuted.value
      const video = videoRef.value
      if (video) {
        video.muted = isMuted.value
        console.log('静音状态:', isMuted.value ? '静音' : '有声')
      }
    }

    // 视频播放结束（仅移动端）
    const handleVideoEnded = () => {
      if (isMobile.value) {
        const video = videoRef.value
        if (video) {
          video.pause()
          video.currentTime = 0 // 重置到开头
        }
        isPlayingLive.value = false // 切换回显示图片
      }
    }

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal()
      } else if (e.key === 'ArrowLeft') {
        prevPhoto()
      } else if (e.key === 'ArrowRight') {
        nextPhoto()
      }
    }

    // 禁止/恢复背景滚动，添加键盘监听
    watch(currentPhoto, (newVal) => {
      if (newVal) {
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', handleKeydown)
      } else {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleKeydown)
      }
    }, { immediate: true }) // 立即执行一次

    onUnmounted(() => {
      // 组件卸载时恢复滚动
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      currentPhoto,
      currentIndex,
      isMultiMode,
      videoRef,
      infoPanelRef,
      thumbnailScroll,
      videoSrc,
      isPlayingLive,
      isMuted,
      isMobile,
      showMobileInfo,
      panelTransform,
      transitionDirection,
      prevPhoto,
      nextPhoto,
      goToPhoto,
      closeModal,
      handleModalClick,
      toggleMobileInfo,
      handlePanelTouchStart,
      handlePanelTouchMove,
      handlePanelTouchEnd,
      handleImageTouchStart,
      handleImageTouchEnd,
      handleMouseEnter,
      handleMouseLeave,
      handleImageClick,
      toggleMute,
      handleVideoEnded,
      handleThumbnailWheel,
      handleThumbnailTouchStart,
      handleThumbnailTouchMove,
      handleThumbnailTouchEnd
    }
  }
}
</script>

<style scoped>
/* 模态框容器 - 适配深色/浅色模式 */
.photo-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 浅色模式（默认） */
  --modal-bg: rgba(255, 255, 255, 0.3);
  --panel-bg: rgba(255, 255, 255, 0.85);
  --panel-border: rgba(0, 0, 0, 0.1);
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-tertiary: #86868b;
  --button-bg: rgba(0, 0, 0, 0.06);
  --button-border: rgba(0, 0, 0, 0.1);
  --button-hover: rgba(0, 0, 0, 0.12);
  --divider: rgba(0, 0, 0, 0.1);
  
  background: var(--modal-bg);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .photo-modal {
    --modal-bg: rgba(0, 0, 0, 0.5);
    --panel-bg: rgba(28, 28, 30, 0.85);
    --panel-border: rgba(255, 255, 255, 0.1);
    --text-primary: #f5f5f7;
    --text-secondary: #a1a1a6;
    --text-tertiary: #86868b;
    --button-bg: rgba(255, 255, 255, 0.1);
    --button-border: rgba(255, 255, 255, 0.15);
    --button-hover: rgba(255, 255, 255, 0.15);
    --divider: rgba(255, 255, 255, 0.1);
  }
}

/* 图片容器 */
.image-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 300px; /* 为右侧信息面板留出空间 */
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 130px 20px; /* 底部增加空间，为缩略图导航栏预留 */
  /* 禁用长按菜单 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* 图片过渡动画包裹器 */
.image-transition-wrapper {
  position: absolute;
  top: 80px; /* 顶部空间 */
  left: 20px;
  right: 20px;
  bottom: 80px; /* 单张模式默认底部空间，与顶部对称 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 多张模式 - 为缩略图导航栏预留空间 */
.image-container.has-thumbnails .image-transition-wrapper {
  bottom: 150px;
}

.main-image,
.main-video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  /* 禁用长按菜单和拖拽 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  pointer-events: auto;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
}

/* 视频特殊样式 - 隐藏原生控制条 */
.main-video {
  pointer-events: none; /* 禁用视频本身的交互 */
}

/* 隐藏视频控制条（各浏览器兼容） */
.main-video::-webkit-media-controls {
  display: none !important;
}

.main-video::-webkit-media-controls-enclosure {
  display: none !important;
}

.main-video::-webkit-media-controls-panel {
  display: none !important;
}

.main-video::-webkit-media-controls-play-button {
  display: none !important;
}

.main-video::-webkit-media-controls-start-playback-button {
  display: none !important;
}

/* Live Photo 控制（左上角） */
.live-controls-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 20;
}

/* LIVE 标记 */
.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  color: #1d1d1f;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  /* 禁用长按菜单 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.live-badge:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
}

.live-badge svg {
  flex-shrink: 0;
}

/* 静音按钮 */
.mute-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  color: #1d1d1f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  /* 禁用长按菜单 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.mute-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
}

.mute-btn:active {
  transform: scale(0.95);
}

@media (prefers-color-scheme: dark) {
  .live-badge {
    background: rgba(28, 28, 30, 0.92);
    color: #f5f5f7;
  }
  
  .mute-btn {
    background: rgba(28, 28, 30, 0.92);
    color: #f5f5f7;
  }
  
  .mute-btn:hover {
    background: rgba(28, 28, 30, 1);
  }
}

.main-image,
.main-video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

/* HDR 增强 */
.main-image.hdr-enhanced {
  dynamic-range-limit: high;
  color-profile: display-p3;
  color-interpolation-filters: linearRGB;
  image-rendering: high-quality;
}

@media (dynamic-range: high) {
  .main-image.hdr-enhanced {
    filter: contrast(1.1) brightness(1.05);
  }
}

/* 顶部栏 */
.top-bar {
  position: fixed;
  top: 20px;
  right: 320px;
  display: flex;
  gap: 12px;
  z-index: 30;
}

.file-name {
  display: none; /* 隐藏文件名，避免混乱 */
}

/* 信息按钮（移动端） - 统一样式 */
.info-btn-mobile {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  color: #1d1d1f;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  /* 禁用长按菜单 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.info-btn-mobile:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
}

.info-btn-mobile:active {
  transform: scale(0.95);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  color: #1d1d1f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  /* 禁用长按菜单 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
}

.close-btn:active {
  transform: scale(0.95);
}

@media (prefers-color-scheme: dark) {
  .info-btn-mobile,
  .close-btn {
    background: rgba(28, 28, 30, 0.92);
    color: #f5f5f7;
  }
  
  .info-btn-mobile:hover,
  .close-btn:hover {
    background: rgba(28, 28, 30, 1);
  }
}

/* 信息面板 - Apple 液态玻璃风格 */
.info-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100vh;
  background: var(--panel-bg);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-left: 1px solid var(--panel-border);
  overflow-y: auto;
  padding: 20px;
  color: var(--text-primary);
  z-index: 10;
}

/* 信息面板滚动条样式 */
.info-panel::-webkit-scrollbar {
  width: 6px;
}

.info-panel::-webkit-scrollbar-track {
  background: transparent;
}

.info-panel::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 3px;
  opacity: 0.3;
}

.info-panel::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Firefox 滚动条 */
.info-panel {
  scrollbar-width: thin;
  scrollbar-color: var(--text-tertiary) transparent;
}

/* 标签区域（标题下方） */
.badge-section {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background: var(--button-bg);
  color: var(--text-primary);
  border: 1px solid var(--button-border);
}

/* 拖动指示器（移动端） */
.drag-indicator {
  display: none;
  width: 36px;
  height: 4px;
  background: var(--text-tertiary);
  border-radius: 2px;
  margin: 12px auto 20px;
  opacity: 0.3;
}

/* 照片标题 */
.photo-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

/* 信息区块 */
.info-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--divider);
}

.info-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  text-align: right;
}

.info-value.mono {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
}

.description {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* Live Photo 按钮 */
.live-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: var(--button-bg);
  border: 1px solid var(--button-border);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.live-btn:hover {
  background: var(--button-hover);
}

.live-btn.is-playing {
  background: var(--button-hover);
  opacity: 0.8;
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 图片切换动画 - 下一张（左滑） */
.slide-next-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-next-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

/* 图片切换动画 - 上一张（右滑） */
.slide-prev-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-prev-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-50px);
}

.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(50px);
}

/* 导航按钮 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  color: #1d1d1f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 20;
}

.nav-prev {
  left: 20px;
}

.nav-next {
  right: 20px;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-50%) scale(1.1);
}

@media (prefers-color-scheme: dark) {
  .nav-btn {
    background: rgba(28, 28, 30, 0.92);
    color: #f5f5f7;
  }
  
  .nav-btn:hover {
    background: rgba(28, 28, 30, 1);
  }
}

/* 缩略图导航 - 液态玻璃效果 */
.thumbnail-nav {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 320px;
  display: flex;
  justify-content: center;
  z-index: 20;
}

.thumbnail-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: auto;
  /* 完全隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  /* 内容自适应宽度 */
  width: fit-content;
  max-width: 100%; /* 使用父容器的 100% 宽度 */
  /* 可拖动光标 */
  cursor: grab;
  user-select: none;
  /* 增强液态玻璃背景 */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.6) 100%
  );
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
  /* 玻璃边框 - 渐变效果 */
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 12px 16px; /* 左右增加 padding，更对称 */
  /* 多层阴影 - 增强立体感 */
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(255, 255, 255, 0.2);
  /* 微妙的内部高光 */
  position: relative;
}

/* 增强玻璃高光效果 */
.thumbnail-scroll::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 20px 20px 0 0;
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .thumbnail-scroll {
    background: linear-gradient(
      135deg,
      rgba(28, 28, 30, 0.85) 0%,
      rgba(28, 28, 30, 0.7) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 2px 8px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  }
  
  .thumbnail-scroll::before {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 100%
    );
  }
}

.thumbnail-scroll::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.thumbnail-item {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 2.5px solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
  /* 禁止拖拽 */
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
  pointer-events: none; /* 防止图片被拖拽 */
}

.thumbnail-item.active {
  border-color: rgba(255, 255, 255, 0.9);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (prefers-color-scheme: dark) {
  .thumbnail-item.active {
    border-color: rgba(255, 255, 255, 0.8);
  }
}

.thumbnail-item:hover:not(.active) {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.03);
}

.thumbnail-item:hover img {
  transform: scale(1.05);
}

.thumb-live-icon {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d1d1f;
}

@media (prefers-color-scheme: dark) {
  .thumb-live-icon {
    background: rgba(28, 28, 30, 0.9);
    color: #f5f5f7;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .image-container {
    right: 0;
    padding: 20px 20px 80px 20px; /* 移动端底部增加 padding，视觉居中 */
  }
  
  .image-transition-wrapper {
    top: 70px; /* 移动端顶部空间 */
    left: 20px;
    right: 20px;
    bottom: 20px; /* 移动端单张模式默认底部空间 */
  }
  
  /* 移动端多张模式 - 为缩略图导航栏预留空间 */
  .image-container.has-thumbnails .image-transition-wrapper {
    bottom: 100px;
  }
  
  /* 移动端信息面板 - 从底部弹出，覆盖在缩略图导航栏上方 */
  .info-panel {
    position: fixed;
    top: auto;
    bottom: 0; /* 从屏幕底部弹出 */
    left: 0;
    right: 0;
    width: 100%;
    height: 75vh;
    max-height: 75vh;
    border-left: none;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    padding: 0 24px 24px;
    transform: translateY(100%); /* 完全隐藏到屏幕下方 */
    transition: transform 0.3s ease;
    z-index: 30; /* 高于缩略图导航栏（z-index: 20） */
  }
  
  .info-panel.mobile-open {
    transform: translateY(0);
  }
  
  .drag-indicator {
    display: block;
  }
  
  /* 移动端优化字体和间距 */
  .photo-title {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.2;
  }
  
  .badge-section {
    margin-top: 16px;
  }
  
  .description {
    font-size: 15px;
    line-height: 1.8;
  }
  
  .info-section {
    margin-bottom: 32px;
    padding-bottom: 32px;
  }
  
  .info-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  .section-title {
    font-size: 13px;
    margin-bottom: 16px;
  }
  
  .info-grid {
    gap: 16px;
  }
  
  .info-row {
    font-size: 15px;
    padding: 4px 0;
  }
  
  .info-value.mono {
    font-size: 14px;
  }
  
  .top-bar {
    right: 20px;
  }
  
  .info-btn-mobile {
    display: flex;
  }
  
  /* 移动端导航按钮 */
  .nav-btn {
    width: 40px;
    height: 40px;
  }
  
  .nav-prev {
    left: 12px;
  }
  
  .nav-next {
    right: 12px;
  }
  
  /* 移动端缩略图 */
  .thumbnail-nav {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
  
  .thumbnail-scroll {
    max-width: 100%; /* 移动端使用父容器的 100% 宽度 */
  }
  
  .thumbnail-item {
    width: 60px;
    height: 60px;
  }
}
</style>
