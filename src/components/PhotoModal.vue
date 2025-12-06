<template>
  <transition name="modal">
    <div 
      v-if="photo"
      class="fixed inset-0 z-50 bg-black flex items-center justify-center"
      @click="closeModal"
    >
      <!-- 关闭按钮 -->
      <button 
        @click="closeModal"
        class="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Icon icon="mdi:close" :width="20" :height="20" class="text-white" />
      </button>

      <!-- 图片 -->
      <img 
        :src="photo.image_src" 
        :alt="photo.title"
        class="max-w-full max-h-full object-contain"
        @click.stop
      />

      <!-- 底部信息栏 -->
      <div 
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-8 px-6"
        @click.stop
      >
        <div class="max-w-4xl mx-auto">
          <h2 class="text-[20px] md:text-[24px] font-semibold text-white mb-2">
            {{ photo.title }}
          </h2>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] md:text-[14px] text-white/70">
            <span v-if="photo.location">{{ photo.location }}</span>
            <span v-if="photo.model">{{ photo.model }}</span>
            <span v-if="photo.focal_length || photo.aperture || photo.shutter_speed" class="font-mono">
              {{ [photo.focal_length, photo.aperture, photo.shutter_speed].filter(Boolean).join(' · ') }}
            </span>
          </div>
          <p v-if="photo.describe" class="mt-3 text-[14px] text-white/60 leading-relaxed max-w-2xl">
            {{ photo.describe }}
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { watch, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

export default {
  name: 'PhotoModal',
  components: {
    Icon
  },
  props: {
    photo: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const closeModal = () => {
      emit('close')
    }

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }

    watch(() => props.photo, (newVal) => {
      if (newVal) {
        document.addEventListener('keydown', handleKeydown)
      } else {
        document.removeEventListener('keydown', handleKeydown)
      }
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      closeModal
    }
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
