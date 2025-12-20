<template>
  <transition name="toast-slide">
    <div v-if="visible" class="custom-toast">
      <div class="toast-content" :class="`toast-${type}`">
        <div class="toast-icon">{{ iconMap[type] }}</div>
        <div class="toast-text">{{ message }}</div>
        <button @click="close" class="toast-close">
          <Icon icon="mdi:close" :width="18" :height="18" />
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

export default {
  name: 'Toast',
  components: { Icon },
  setup() {
    const visible = ref(false)
    const message = ref('')
    const type = ref('info')
    let timer = null

    const iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: '💡'
    }

    const show = (msg, msgType = 'info', duration = 2000) => {
      message.value = msg
      type.value = msgType
      visible.value = true

      if (timer) clearTimeout(timer)
      if (duration > 0) {
        timer = setTimeout(() => {
          close()
        }, duration)
      }
    }

    const close = () => {
      visible.value = false
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    return {
      visible,
      message,
      type,
      iconMap,
      show,
      close
    }
  }
}
</script>

<style scoped>
.custom-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 90%;
  width: auto;
  min-width: 300px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

@media (prefers-color-scheme: dark) {
  .toast-content {
    background: rgba(28, 28, 30, 0.95);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 2px 8px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
}

.toast-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.toast-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.5;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
  transform: scale(1.1);
}

@media (prefers-color-scheme: dark) {
  .toast-close:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.toast-close:active {
  transform: scale(0.95);
}

/* 动画 */
.toast-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .custom-toast {
    top: 70px;
    width: calc(100% - 32px);
    min-width: 0;
  }

  .toast-content {
    padding: 12px 16px;
    gap: 10px;
  }

  .toast-icon {
    font-size: 18px;
  }

  .toast-text {
    font-size: 13px;
  }
}
</style>
