<template>
  <transition name="toast-slide">
    <div v-if="showToast" class="browser-toast">
      <div class="toast-content">
        <div class="toast-icon">🌟</div>
        <div class="toast-text">
          <div class="toast-title">嘿，发现你在用 {{ browserName }} 浏览器</div>
          <div class="toast-desc">推荐使用 Chrome 浏览器以获得最佳体验，Live Photo 可能无法正常播放哦～</div>
        </div>
        <button @click="closeToast" class="toast-close">
          <Icon icon="mdi:close" :width="18" :height="18" />
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

export default {
  name: 'BrowserToast',
  components: {
    Icon
  },
  setup() {
    const showToast = ref(false)
    const browserName = ref('')

    const detectBrowser = () => {
      const ua = navigator.userAgent
      
      // Chrome (包括 Edge Chromium)
      if (ua.includes('Chrome') && !ua.includes('Edg')) {
        return null // Chrome 不显示提示
      }
      
      // Edge
      if (ua.includes('Edg')) {
        return 'Edge'
      }
      
      // Safari
      if (ua.includes('Safari') && !ua.includes('Chrome')) {
        return 'Safari'
      }
      
      // Firefox
      if (ua.includes('Firefox')) {
        return 'Firefox'
      }
      
      // 其他浏览器
      return '其他'
    }

    const closeToast = () => {
      showToast.value = false
      // 记住用户选择，7天内不再提示
      const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000
      localStorage.setItem('browser-toast-closed', expireTime.toString())
    }

    onMounted(() => {
      // 检查是否已经关闭过
      const closedTime = localStorage.getItem('browser-toast-closed')
      if (closedTime && Date.now() < parseInt(closedTime)) {
        return // 7天内不再显示
      }

      // 检测浏览器
      const browser = detectBrowser()
      if (browser) {
        browserName.value = browser
        // 延迟 1 秒显示，让页面先加载
        setTimeout(() => {
          showToast.value = true
          // 10 秒后自动关闭
          setTimeout(() => {
            if (showToast.value) {
              closeToast()
            }
          }, 10000)
        }, 1000)
      }
    })

    return {
      showToast,
      browserName,
      closeToast
    }
  }
}
</script>

<style scoped>
.browser-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 90%;
  width: 600px;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 16px;
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
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.toast-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.toast-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
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
  .browser-toast {
    top: 70px;
    width: calc(100% - 32px);
    max-width: none;
  }

  .toast-content {
    padding: 14px 16px;
    gap: 10px;
  }

  .toast-icon {
    font-size: 20px;
  }

  .toast-title {
    font-size: 14px;
  }

  .toast-desc {
    font-size: 12px;
  }
}
</style>
