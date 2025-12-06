<template>
  <header 
    class="fixed top-0 left-0 right-0 z-50 header-nav backdrop-blur-xl backdrop-saturate-150 border-b transition-all duration-500 ease-out"
    :class="scrolled ? 'border-[var(--border-color)] shadow-sm' : 'border-transparent'"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="flex justify-between items-center h-14">
        <!-- Logo 区域 -->
        <router-link to="/" class="flex items-center space-x-2.5 hover:opacity-80 transition-opacity">
          <img :src="siteConfig.logo" alt="Logo" class="w-7 h-7">
          <span class="font-semibold text-[19px] text-[var(--text-primary)] tracking-tight leading-none">{{ siteConfig.name }}</span>
        </router-link>

        <!-- 移动端菜单按钮 -->
        <button 
          @click.stop="toggleMenu" 
          class="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all duration-200"
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
            class="px-4 py-2 text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
            active-class="!text-[var(--text-primary)] font-medium"
          >
            {{ item.name }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <transition name="menu">
      <div v-if="isMobileMenuOpen" class="md:hidden mobile-menu backdrop-blur-xl border-t border-[var(--border-color)]">
        <nav class="max-w-7xl mx-auto px-6 py-3 flex flex-col space-y-1">
          <router-link 
            v-for="(item, index) in menuItems" 
            :key="'mobile-'+index" 
            :to="item.url"
            class="px-4 py-2.5 text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)] transition-all duration-200 font-normal rounded-lg"
            active-class="!text-[var(--text-primary)] font-medium bg-[var(--bg-secondary)]"
            @click="isMobileMenuOpen = false"
          >
            {{ item.name }}
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
      { name: '首页', url: '/' },
      { name: '作品集', url: '/gallery' },
      { name: '关于我', url: '/about' }
    ])

    // 监听滚动事件
    const handleScroll = () => {
      scrolled.value = window.scrollY > 20
    }

    // 切换移动端菜单
    const toggleMenu = () => {
      isMobileMenuOpen.value = !isMobileMenuOpen.value
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
      toggleMenu
    }
  }
}
</script>

<style scoped>
.header-nav {
  background-color: var(--nav-bg);
}

.mobile-menu {
  background-color: var(--nav-bg);
}
</style>
