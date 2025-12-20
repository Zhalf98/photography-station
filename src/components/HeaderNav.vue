<template>
  <header 
    class="fixed top-0 left-0 right-0 z-50 header-nav backdrop-blur-xl backdrop-saturate-150 border-b transition-all duration-500 ease-out"
    :class="scrolled ? 'border-[var(--border-color)] shadow-sm' : 'border-transparent'"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="flex justify-between items-center h-14">
        <!-- Logo 区域 -->
        <router-link to="/" class="flex items-center space-x-2.5 link-interactive">
          <img :src="siteConfig.logo" alt="Logo" class="w-7 h-7">
          <span class="font-semibold text-[19px] text-[var(--text-primary)] tracking-tight leading-none">{{ siteConfig.name }}</span>
        </router-link>

        <!-- 移动端菜单按钮 -->
        <button 
          @click.stop="toggleMenu" 
          class="md:hidden flex items-center justify-center w-9 h-9 rounded-full btn-icon-interactive text-[var(--text-primary)]"
        >
          <Icon v-if="!isMobileMenuOpen" icon="mdi:menu" :width="24" :height="24" />
          <Icon v-else icon="mdi:close" :width="20" :height="20" />
        </button>

        <!-- 桌面端导航 -->
        <nav class="hidden md:flex items-center space-x-1">
          <router-link 
            v-for="(item, index) in menuItems" 
            :key="'desktop-'+index" 
            :to="item.url"
            class="px-4 py-2 text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] link-underline-interactive transition-colors duration-200"
            active-class="!text-[var(--text-primary)] font-medium"
          >
            {{ item.name }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- 移动端菜单遮罩 -->
    <transition name="overlay">
      <div 
        v-if="isMobileMenuOpen" 
        class="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        @click="isMobileMenuOpen = false"
        @touchstart="handleMenuTouchStart"
        @touchmove="handleMenuTouchMove"
        @touchend="handleMenuTouchEnd"
      ></div>
    </transition>

    <!-- 移动端菜单 -->
    <transition name="menu">
      <div 
        v-if="isMobileMenuOpen" 
        class="md:hidden fixed left-0 right-0 z-50 mobile-menu"
        :style="{ transform: menuTransform }"
        @touchstart="handleMenuTouchStart"
        @touchmove="handleMenuTouchMove"
        @touchend="handleMenuTouchEnd"
      >
        <nav class="max-w-7xl mx-auto px-4 py-3 flex flex-col space-y-1">
          <router-link 
            v-for="(item, index) in menuItems" 
            :key="'mobile-'+index" 
            :to="item.url"
            class="menu-item"
            active-class="menu-item-active"
            @click="isMobileMenuOpen = false"
          >
            <Icon :icon="item.icon" :width="20" :height="20" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>
      </div>
    </transition>
  </header>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { siteConfig } from '@/config/index.js'

export default {
  name: 'HeaderNav',
  components: {
    Icon
  },
  setup() {
    const scrolled = ref(false)
    const isMobileMenuOpen = ref(false)
    const menuItems = ref([
      { name: '首页', url: '/', icon: 'mdi:home-outline' },
      { name: '相簿', url: '/gallery', icon: 'mdi:folder-multiple-image' },
      { name: '关于我', url: '/about', icon: 'mdi:account-circle-outline' }
    ])
    
    // 菜单滑动手势
    const menuStartY = ref(0)
    const menuCurrentY = ref(0)
    const menuTransform = ref('')

    // 监听滚动事件
    const handleScroll = () => {
      scrolled.value = window.scrollY > 20
    }

    // 切换移动端菜单
    const toggleMenu = () => {
      isMobileMenuOpen.value = !isMobileMenuOpen.value
      menuTransform.value = ''
    }
    
    // 菜单触摸开始
    const handleMenuTouchStart = (e) => {
      menuStartY.value = e.touches[0].clientY
      menuCurrentY.value = 0
    }
    
    // 菜单触摸移动
    const handleMenuTouchMove = (e) => {
      const deltaY = e.touches[0].clientY - menuStartY.value
      
      // 只允许向上滑动关闭
      if (deltaY < 0) {
        menuCurrentY.value = deltaY
        menuTransform.value = `translateY(${Math.abs(deltaY)}px)`
      }
    }
    
    // 菜单触摸结束
    const handleMenuTouchEnd = () => {
      // 如果向上滑动超过 80px，关闭菜单
      if (Math.abs(menuCurrentY.value) > 80) {
        isMobileMenuOpen.value = false
      }
      
      // 重置
      menuTransform.value = ''
      menuCurrentY.value = 0
    }

    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
      handleScroll()
    })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      siteConfig,
      scrolled,
      isMobileMenuOpen,
      menuItems,
      menuTransform,
      toggleMenu,
      handleMenuTouchStart,
      handleMenuTouchMove,
      handleMenuTouchEnd
    }
  }
}
</script>

<style scoped>
.header-nav {
  background-color: var(--nav-bg);
}

/* 移动端菜单 - 毛玻璃卡片 */
.mobile-menu {
  top: 56px; /* 导航栏高度 */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  border-top: none;
  transition: transform var(--duration-normal) var(--ease-out);
}

@media (prefers-color-scheme: dark) {
  .mobile-menu {
    background: rgba(28, 28, 30, 0.95);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }
}

/* 菜单项 */
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: var(--text-secondary);
  background: transparent;
  border-radius: 12px;
  transition: all var(--duration-normal) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.menu-item:active {
  transform: scale(var(--scale-active));
  background: rgba(0, 0, 0, 0.05);
  transition-duration: var(--duration-fast);
}

.menu-item-active {
  color: var(--text-primary);
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
}

@media (prefers-color-scheme: dark) {
  .menu-item:active {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .menu-item-active {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* 遮罩动画 */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* 菜单动画 */
.menu-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.menu-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
