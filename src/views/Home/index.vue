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
import { photoGallery } from '../../data/photos.js'
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
    const photos = ref(photoGallery)

    onMounted(() => {
      setTitle('')
      setDescription('用镜头记录生活的美好瞬间，分享我的摄影作品。')
      setKeywords('摄影,照片,生活记录,摄影作品')
      setCanonical('/')
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
</style>
