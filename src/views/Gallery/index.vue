<template>
  <div class="max-w-6xl mx-auto">
    <!-- 页面标题 -->
    <div class="mb-12 md:mb-16 text-center">
      <h1 class="text-[48px] md:text-[64px] font-semibold text-[var(--text-primary)] tracking-tight">
        相簿
      </h1>
    </div>

    <!-- 相册网格 -->
    <div class="album-grid">
      <div
        v-for="category in categoriesList"
        :key="category.id"
        @click="openAlbum(category.name)"
        class="album-card"
      >
        <!-- 文件夹层叠效果 -->
        <div class="folder-stack">
          <!-- 后面的层 -->
          <div class="folder-layer layer-3">
            <!-- photo 模式：显示第3张图片 -->
            <img 
              v-if="isPhotoMode && getCategoryPhotos(category.name)[2]"
              :src="getCategoryPhotos(category.name)[2].thumbnail" 
              :alt="category.name"
              class="layer-image"
            />
            <!-- color 模式或照片不足：显示彩虹渐变 -->
            <div v-else class="layer-gradient"></div>
          </div>
          <div class="folder-layer layer-2">
            <!-- photo 模式：显示第2张图片 -->
            <img 
              v-if="isPhotoMode && getCategoryPhotos(category.name)[1]"
              :src="getCategoryPhotos(category.name)[1].thumbnail" 
              :alt="category.name"
              class="layer-image"
            />
            <!-- color 模式或照片不足：显示彩虹渐变 -->
            <div v-else class="layer-gradient"></div>
          </div>
          <!-- 封面照片（第1张） -->
          <div class="folder-cover">
            <img 
              v-if="getCategoryPhotos(category.name)[0]"
              :src="getCategoryPhotos(category.name)[0].thumbnail" 
              :alt="category.name"
              class="cover-image"
            />
            <!-- 没有照片时显示彩虹渐变 + 提示 -->
            <div v-else class="cover-empty">
              <div class="layer-gradient"></div>
              <div class="empty-text">
                <Icon icon="mdi:image-off-outline" width="48" />
                <span>暂无照片</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 相册信息 -->
        <div class="album-info">
          <h3 class="album-title">{{ category.name }}</h3>
          <p class="album-count">{{ getCategoryPhotos(category.name).length }} 张照片</p>
          <p class="album-desc">{{ category.description }}</p>
        </div>
      </div>
    </div>

    <!-- 照片弹窗（带缩略图导航） -->
    <PhotoModal
      v-if="selectedPhotoIndex !== null && filteredPhotos.length > 0"
      :photos="filteredPhotos"
      :initialIndex="selectedPhotoIndex"
      @close="closePhotoModal"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import { photoGallery, categories } from '../../data/photos.js'
import { galleryConfig } from '../../config/index.js'
import { useSEO } from '../../composables/useSEO.js'
import PhotoModal from '../../components/PhotoModal.vue'
import { Icon } from '@iconify/vue'

export default {
  name: 'GalleryPage',
  components: {
    PhotoModal,
    Icon
  },
  setup() {
    const { setTitle, setDescription, setKeywords, setCanonical } = useSEO()
    const showToast = inject('showToast')
    
    const categoriesList = ref(categories)
    const selectedCategory = ref(null) // null 表示显示相册列表
    const selectedPhotoIndex = ref(null) // null 表示没有打开照片弹窗

    onMounted(() => {
      setTitle('相簿')
      setDescription('我的摄影作品集，用镜头记录生活中的每一个精彩瞬间。')
      setKeywords('摄影作品,作品集,照片,生活记录,相簿')
      setCanonical('/gallery')
    })
    
    /**
     * 判断是否使用照片模式
     */
    const isPhotoMode = computed(() => galleryConfig.albumLayerMode === 'photo')

    const filteredPhotos = computed(() => {
      console.log('计算 filteredPhotos, selectedCategory:', selectedCategory.value)
      if (!selectedCategory.value) return []
      const result = photoGallery.filter(photo => photo.category === selectedCategory.value)
      console.log('filteredPhotos 结果:', result)
      return result
    })

    const openAlbum = (categoryName) => {
      console.log('点击相簿:', categoryName)
      selectedCategory.value = categoryName
      // 只有当分类有照片时才打开弹窗
      const photos = getCategoryPhotos(categoryName)
      console.log('该分类的照片数量:', photos.length)
      console.log('照片列表:', photos)
      if (photos.length > 0) {
        selectedPhotoIndex.value = 0
        console.log('打开弹窗，索引:', 0)
      } else {
        console.log('没有照片，不打开弹窗')
        showToast('这个相簿还空空如也，快去添加照片吧', 'info')
      }
    }
    
    const getCategoryPhotos = (categoryName) => {
      return photoGallery.filter(photo => photo.category === categoryName)
    }

    const closePhotoModal = () => {
      selectedPhotoIndex.value = null
      selectedCategory.value = null
    }

    return {
      categoriesList,
      selectedCategory,
      selectedPhotoIndex,
      photoGallery,
      filteredPhotos,
      openAlbum,
      getCategoryPhotos,
      closePhotoModal,
      isPhotoMode
    }
  }
}
</script>

<style scoped>
/* 相册网格 */
.album-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 4rem;
}

@media (min-width: 640px) {
  .album-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .album-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 相册卡片 */
.album-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

/* 文件夹层叠效果 */
.folder-stack {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  margin-bottom: 1.5rem;
}

.folder-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.layer-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

.layer-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, 
    rgba(255, 107, 107, 0.85) 0%,
    rgba(255, 159, 64, 0.85) 20%,
    rgba(255, 234, 167, 0.85) 40%,
    rgba(72, 219, 251, 0.85) 60%,
    rgba(118, 75, 162, 0.85) 80%,
    rgba(255, 107, 107, 0.85) 100%
  );
  opacity: 0.5;
}

.folder-layer.layer-3 {
  top: -8px;
  left: -8px;
  transform: rotate(-3deg);
}

.folder-layer.layer-2 {
  top: -4px;
  left: -4px;
  transform: rotate(-1.5deg);
}

.folder-cover {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-empty {
  position: relative;
  width: 100%;
  height: 100%;
}

.cover-empty .layer-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.empty-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 悬停效果 */
.album-card:hover .folder-layer.layer-3 {
  top: -16px;
  left: -16px;
  transform: rotate(-6deg);
}

.album-card:hover .folder-layer.layer-2 {
  top: -8px;
  left: -8px;
  transform: rotate(-3deg);
}

.album-card:hover .layer-image {
  opacity: 1;
}

.album-card:hover .layer-gradient {
  opacity: 0.7;
}

.album-card:hover .folder-cover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
}

/* 相册信息 */
.album-info {
  padding: 0 0.5rem;
}

.album-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  transition: color 0.2s;
}

.album-card:hover .album-title {
  color: #ff2d55;
}

.album-count {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.album-desc {
  font-size: 14px;
  color: var(--text-tertiary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

</style>
