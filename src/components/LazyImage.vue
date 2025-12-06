<template>
  <div 
    class="lazy-image-container"
    :style="containerStyle"
  >
    <!-- 骨架屏 -->
    <div 
      v-if="!loaded && !error" 
      class="skeleton"
    ></div>
    
    <!-- 图片 -->
    <img
      :src="src"
      :alt="alt"
      class="lazy-image"
      :class="{ 'fade-in': loaded }"
      @load="onLoad"
      @error="onError"
      loading="lazy"
    />
    
    <!-- 错误状态 -->
    <div v-if="error" class="error-placeholder">
      <Icon icon="mdi:image-broken" :width="32" :height="32" />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

export default {
  name: 'LazyImage',
  components: { Icon },
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    fallbackRatio: { type: String, default: '4/3' }
  },
  emits: ['load', 'error'],
  setup(props, { emit }) {
    const loaded = ref(false)
    const error = ref(false)

    const containerStyle = computed(() => {
      if (props.width && props.height) {
        return { aspectRatio: `${props.width}/${props.height}` }
      }
      return { aspectRatio: props.fallbackRatio }
    })

    const onLoad = () => {
      loaded.value = true
      emit('load')
    }

    const onError = () => {
      error.value = true
      emit('error')
    }

    return { loaded, error, containerStyle, onLoad, onError }
  }
}
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--bg-secondary);
}

.skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.lazy-image {
  display: block;
  width: 100%;
  height: auto;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image.fade-in {
  opacity: 1;
}

.error-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
}
</style>
