<template>
  <div class="max-w-6xl mx-auto">
    <!-- 页面标题 -->
    <div class="mb-10 md:mb-14">
      <h1 class="text-[36px] md:text-[48px] font-semibold text-[var(--text-primary)] tracking-tight mb-3">
        作品集
      </h1>
      <p class="text-[17px] md:text-[19px] text-[var(--text-secondary)]">
        共 {{ photoGallery.length }} 张作品，{{ uniqueLocations }} 个拍摄地点
      </p>
    </div>

    <!-- 分类筛选 -->
    <div class="flex items-center gap-3 mb-10 overflow-x-auto pb-2">
      <button
        v-for="category in categoriesList"
        :key="category.id"
        @click="handleCategoryChange(category.name)"
        class="category-btn"
        :class="{ active: selectedCategory === category.name }"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- 瀑布流照片墙 -->
    <div class="masonry-grid">
      <div
        v-for="(photo, index) in filteredPhotos"
        :key="`${selectedCategory}-${index}`"
        @click="openModal(photo)"
        class="masonry-item group cursor-pointer"
      >
        <div class="rounded-2xl overflow-hidden mb-3 group-hover:scale-[1.02] transition-transform duration-500">
          <LazyImage
            :src="photo.thumbnail"
            :alt="photo.title"
            :width="photo.width"
            :height="photo.height"
          />
        </div>
        <h3 class="text-[15px] md:text-[17px] font-medium text-[var(--text-primary)] mb-1">{{ photo.title }}</h3>
        <p v-if="photo.location" class="text-[13px] text-[var(--text-secondary)]">{{ photo.location }}</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredPhotos.length === 0" class="text-center py-20">
      <p class="text-[17px] text-[var(--text-secondary)]">暂无作品</p>
    </div>

    <!-- 照片弹窗 -->
    <PhotoModal 
      :photo="selectedPhoto"
      @close="closeModal"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { photoGallery, categories } from '../../data/photos.js'
import { useSEO } from '../../composables/useSEO.js'
import PhotoModal from '../../components/PhotoModal.vue'
import LazyImage from '../../components/LazyImage.vue'

export default {
  name: 'GalleryPage',
  components: {
    PhotoModal,
    LazyImage
  },
  setup() {
    const { setTitle, setDescription, setKeywords, setCanonical } = useSEO()
    
    const categoriesList = ref(categories)
    const selectedCategory = ref(categories[0]?.name || '')
    const selectedPhoto = ref(null)

    onMounted(() => {
      setTitle('作品集')
      setDescription('我的摄影作品集，用镜头记录生活中的每一个精彩瞬间。')
      setKeywords('摄影作品,作品集,照片,生活记录')
      setCanonical('/gallery')
    })

    const uniqueLocations = computed(() => {
      const locations = new Set(
        photoGallery
          .map(photo => photo.location)
          .filter(Boolean)
          .map(loc => loc.split('.')[0])
      )
      return locations.size
    })

    const filteredPhotos = computed(() => {
      return photoGallery.filter(photo => photo.category === selectedCategory.value)
    })

    const handleCategoryChange = (category) => {
      selectedCategory.value = category
    }

    const openModal = (photo) => {
      selectedPhoto.value = photo
    }

    const closeModal = () => {
      selectedPhoto.value = null
    }

    return {
      categoriesList,
      selectedCategory,
      photoGallery,
      uniqueLocations,
      filteredPhotos,
      handleCategoryChange,
      selectedPhoto,
      openModal,
      closeModal
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

.category-btn {
  padding: 0.5rem 1.25rem;
  font-size: 15px;
  border-radius: 9999px;
  white-space: nowrap;
  transition: all 0.2s;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.category-btn:hover {
  background: var(--bg-tertiary);
}

.category-btn.active {
  background: var(--text-primary);
  color: var(--bg-primary);
}
</style>
