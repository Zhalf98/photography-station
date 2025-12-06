<template>
  <transition name="fade">
    <button
      v-if="visible"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 w-11 h-11 bg-[#1d1d1f] hover:bg-[#1d1d1f]/80 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-40"
    >
      <Icon icon="mdi:chevron-up" :width="24" :height="24" />
    </button>
  </transition>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

export default {
  name: 'BackToTop',
  components: {
    Icon
  },
  setup() {
    const visible = ref(false)

    const handleScroll = () => {
      visible.value = window.scrollY > 400
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
    })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      visible,
      scrollToTop
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
