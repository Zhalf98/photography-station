<template>
  <div class="max-w-6xl mx-auto">
    <!-- 页面标题 -->
    <div class="mb-12 md:mb-16">
      <h1 class="text-[40px] md:text-[56px] lg:text-[64px] font-semibold text-[var(--text-primary)] tracking-tight leading-[1.05] mb-4">
        用镜头<br>记录生活
      </h1>
      <p class="text-[19px] md:text-[21px] text-[var(--text-secondary)] leading-relaxed max-w-xl">
        每一张照片都是一个故事，一段回忆，一种情感的表达。
      </p>
    </div>

    <!-- 瀑布流照片墙 -->
    <div class="masonry-grid">
      <div
        v-for="(photo, index) in photos"
        :key="index"
        @click="openPhotoModal(photo)"
        class="masonry-item group cursor-pointer"
      >
        <div class="rounded-2xl overflow-hidden mb-3 group-hover:scale-[1.02] transition-transform duration-500 relative">
          <LazyImage
            :src="photo.thumbnail"
            :alt="photo.title"
            :width="photo.width"
            :height="photo.height"
          />
          
          <!-- 左上角 LIVE 图标 -->
          <div v-if="photo.is_live_photo" class="live-indicator">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
              <circle cx="16" cy="16" r="8" stroke="currentColor" stroke-width="2"/>
              <circle cx="16" cy="16" r="3" fill="currentColor"/>
            </svg>
          </div>
        </div>
        
        <!-- 标题和标签 -->
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-[15px] md:text-[17px] font-medium text-[var(--text-primary)]">{{ photo.title }}</h3>
          <div v-if="photo.is_live_photo || photo.is_hdr" class="flex gap-1.5">
            <span v-if="photo.is_live_photo" class="badge badge-live">LIVE</span>
            <span v-if="photo.is_hdr" class="badge badge-hdr">HDR</span>
          </div>
        </div>
        <p v-if="photo.location" class="text-[13px] text-[var(--text-secondary)]">{{ photo.location }}</p>
      </div>
    </div>

    <!-- 照片弹窗 -->
    <PhotoModal 
      :photo="selectedPhoto"
      @close="closePhotoModal"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import PhotoModal from '../../components/PhotoModal.vue'
import LazyImage from '../../components/LazyImage.vue'
import { useSEO } from '../../composables/useSEO.js'

export default {
  name: 'HomePage',
  components: {
    PhotoModal,
    LazyImage
  },
  setup() {
    const { setTitle, setDescription, setKeywords, setCanonical } = useSEO()
    
    const selectedPhoto = ref(null)
    const photos = ref([])

    onMounted(async () => {
      setTitle('')
      setDescription('用镜头记录生活的美好瞬间，分享我的摄影作品。')
      setKeywords('摄影,照片,生活记录,摄影作品')
      setCanonical('/')
      
      try {
        const res = await fetch('/api/photos')
        photos.value = await res.json()
      } catch (e) {
        console.error('Failed to load photos:', e)
      }
    })

    const openPhotoModal = (photo) => selectedPhoto.value = photo
    const closePhotoModal = () => selectedPhoto.value = null

    return {
      photos,
      selectedPhoto,
      openPhotoModal,
      closePhotoModal
    }
  }
}
</script>

<style scoped>
.masonry-grid {
  columns: 1;
  column-gap: 1.5rem;
}

@media (min-width: 640px) {
  .masonry-grid {
    columns: 2;
  }
}

@media (min-width: 1024px) {
  .masonry-grid {
    columns: 3;
  }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1.5rem;
}

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

.group:hover .live-indicator {
  transform: scale(1.1);
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

@media (prefers-color-scheme: dark) {
  .live-indicator {
    background: rgba(28, 28, 30, 0.95);
    color: #f5f5f7;
  }
}

.badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.badge-live { background: var(--text-tertiary); color: white; }
.badge-hdr { background: #ffcc00; color: #1d1d1f; }

@media (prefers-color-scheme: dark) {
  .badge-live { background: rgba(255, 255, 255, 0.2); color: var(--text-primary); }
}
</style>
