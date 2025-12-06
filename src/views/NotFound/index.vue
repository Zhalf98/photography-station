<template>
  <div class="not-found">
    <div class="content">
      <!-- 可爱的相机图标 -->
      <div class="camera-icon">
        <span class="camera">📷</span>
        <span class="question">❓</span>
      </div>
      
      <!-- 404 数字 -->
      <h1 class="error-code">404</h1>
      
      <!-- 提示文字 -->
      <p class="message">哎呀，这个页面走丢了~</p>
      <p class="sub-message">可能是镜头盖没打开，什么都没拍到 😅</p>
      
      <!-- 返回按钮 -->
      <div class="actions">
        <router-link to="/" class="home-btn">
          <Icon icon="mdi:home" :width="20" :height="20" />
          <span>回到首页</span>
        </router-link>
        <router-link to="/gallery" class="gallery-btn">
          <Icon icon="mdi:image-multiple" :width="20" :height="20" />
          <span>看看作品</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useSEO } from '../../composables/useSEO.js'

export default {
  name: 'NotFoundPage',
  components: { Icon },
  setup() {
    const { setTitle } = useSEO()
    
    onMounted(() => {
      setTitle('页面未找到')
    })

    return {}
  }
}
</script>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.content {
  max-width: 400px;
}

.camera-icon {
  position: relative;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.camera {
  font-size: 80px;
  display: block;
  animation: bounce 2s ease-in-out infinite;
}

.question {
  position: absolute;
  top: -10px;
  right: -20px;
  font-size: 32px;
  animation: shake 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 1rem;
  opacity: 0.1;
}

.message {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.sub-message {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.home-btn, .gallery-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
}

.home-btn {
  background: var(--text-primary);
  color: var(--bg-primary);
}

.home-btn:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.gallery-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.gallery-btn:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}
</style>
