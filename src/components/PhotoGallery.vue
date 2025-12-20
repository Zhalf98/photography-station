<template>
  <div>
    <!-- 页面标题和描述 -->
    <div class="mb-12 md:mb-16">
      <h1 class="text-[40px] md:text-[56px] lg:text-[64px] font-semibold mb-4 md:mb-5 text-gray-900 tracking-tight leading-[1.1] -ml-0.5">
        摄影记录是<br class="md:hidden">生活的一部分
      </h1>
      <p class="text-[17px] md:text-[19px] lg:text-[21px] text-gray-600 leading-[1.47] max-w-3xl mb-8 font-normal">
        摄影已经成为我生活中不可或缺的一部分，我享受按下快门的那一刻，以及照片背后反映我对生活的感悟。
        每一张照片都是一个故事，一段回忆，一种情感的表达。
      </p>

      <!-- 视图切换按钮 -->
      <div class="flex justify-start mb-8">
        <div class="inline-flex rounded-[10px] bg-gray-100/80 p-0.5">
          <button 
            @click="$emit('set-view-mode', 'compact')"
            class="px-4 py-2 text-[13px] font-normal rounded-[8px] btn-secondary-interactive transition-all duration-300 ease-out"
            :class="viewMode === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
          >
            <span class="flex items-center gap-2">
              <Icon icon="mdi:view-grid" :width="15" :height="15" />
              紧凑视图
            </span>
          </button>
          <button 
            @click="$emit('set-view-mode', 'wide')"
            class="px-4 py-2 text-[13px] font-normal rounded-[8px] btn-secondary-interactive transition-all duration-300 ease-out"
            :class="viewMode === 'wide' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
          >
            <span class="flex items-center gap-2">
              <Icon icon="mdi:view-list" :width="15" :height="15" />
              广阔视图
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 图片瀑布流 -->
    <div :class="['masonry-grid', viewMode]">
      <div 
        v-for="(photo, index) in photos" 
        :key="index" 
        class="masonry-item card-interactive"
        @click="$emit('open-photo', photo)"
      >
        <div class="photo-card bg-white overflow-hidden rounded-[12px] border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 ease-out hover:shadow-lg">
          <div class="relative overflow-hidden rounded-t-[12px]">
            <div 
              v-if="!loadedImages[index] && !imageErrors[index]"
              class="absolute inset-0 flex items-center justify-center bg-gray-50"
            >
              <span class="loader"></span>
            </div>
            <div v-if="imageErrors[index]" class="image-error bg-gray-50">
              <div class="text-center">
                <Icon icon="mdi:image-off" :width="40" :height="40" class="text-gray-300 mb-2" />
                <p class="text-gray-400 text-[13px]">图片加载失败</p>
              </div>
            </div>
            <img 
              v-show="!imageErrors[index]" 
              :src="photo.thumbnail" 
              :alt="photo.title"
              class="w-full h-auto object-cover lazy-image" 
              :class="{'loaded': loadedImages[index]}"
              @load="handleImageLoad(index)" 
              @error="handleImageError(index)"
            />

            <!-- 左上角 LIVE 图标 -->
            <div v-if="photo.is_live_photo" class="live-indicator">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <!-- 外围虚线圆 -->
                <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
                <!-- 中间实心圆 -->
                <circle cx="16" cy="16" r="8" stroke="currentColor" stroke-width="2"/>
                <!-- 中心点 -->
                <circle cx="16" cy="16" r="3" fill="currentColor"/>
              </svg>
            </div>

            <!-- 图片悬停信息 -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 hover:opacity-100 transition-all duration-500 ease-out flex items-end"
            >
              <div class="p-4 md:p-5 text-white">
                <h3 class="font-semibold text-[15px] md:text-[17px] mb-1">{{ photo.title }}</h3>
                <p v-if="photo.location" class="text-[13px] opacity-90">{{ photo.location }}</p>
                <p v-else class="text-[13px] opacity-70 italic">位置未知</p>
              </div>
            </div>
          </div>

          <div class="p-3.5 md:p-4 photo-info">
            <!-- 标题和标签 -->
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-semibold text-[14px] md:text-[15px] text-gray-900 tracking-tight line-clamp-1 flex-1">
                {{ photo.title }}
              </h3>
              <div v-if="photo.is_live_photo || photo.is_hdr" class="flex gap-1.5 flex-shrink-0">
                <span v-if="photo.is_live_photo" class="badge badge-live">LIVE</span>
                <span v-if="photo.is_hdr" class="badge badge-hdr">HDR</span>
              </div>
            </div>
            
            <!-- 信息行 - 紧凑布局 -->
            <div class="space-y-1">
              <!-- 位置信息 -->
              <p v-if="photo.location" 
                 class="text-[11px] md:text-[12px] text-gray-500 flex items-center truncate">
                <Icon icon="mdi:map-marker" :width="12" :height="12" class="mr-1 flex-shrink-0" />
                <span class="truncate">{{ photo.location }}</span>
              </p>
              
              <!-- 设备信息 -->
              <p v-if="photo.model" 
                 class="text-[10px] md:text-[11px] text-gray-400 flex items-center truncate">
                <Icon icon="mdi:camera" :width="11" :height="11" class="mr-1 flex-shrink-0" />
                <span class="truncate">{{ formatCameraInfo(photo) }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

export default {
  name: 'PhotoGallery',
  components: {
    Icon
  },
  props: {
    photos: {
      type: Array,
      required: true
    },
    viewMode: {
      type: String,
      default: 'compact'
    }
  },
  emits: ['open-photo', 'set-view-mode'],
  setup(props) {
    const loadedImages = ref({})
    const imageErrors = ref({})

    const handleImageLoad = (index) => {
      loadedImages.value[index] = true
    }

    const handleImageError = (index) => {
      imageErrors.value[index] = true
    }

    // 设置图片加载超时
    const setImageTimeouts = () => {
      props.photos.forEach((_, index) => {
        setTimeout(() => {
          if (!loadedImages.value[index] && !imageErrors.value[index]) {
            imageErrors.value[index] = true
          }
        }, 10000) // 10秒超时
      })
    }

    onMounted(() => {
      setImageTimeouts()
    })

    // 格式化相机信息
    const formatCameraInfo = (photo) => {
      const parts = [photo.model, photo.focal_length, photo.aperture, photo.shutter_speed].filter(Boolean)
      return parts.join(' · ') || ''
    }

    return {
      loadedImages,
      imageErrors,
      handleImageLoad,
      handleImageError,
      formatCameraInfo
    }
  }
}
</script>



<style scoped>
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
}

/* 标题右侧标签 */
.badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.badge-live {
  background: #86868b;
  color: white;
}

.badge-hdr {
  background: #ffcc00;
  color: #1d1d1f;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .badge-live {
    background: rgba(255, 255, 255, 0.2);
    color: #f5f5f7;
  }
}

/* 悬停效果 */
.photo-card:hover .live-indicator {
  transform: scale(1.1);
}
</style>
