<template>
  <!-- Admin 页面独立布局 -->
  <router-view v-if="isAdminPage" />
  
  <!-- 普通页面布局 -->
  <div v-else class="min-h-screen flex flex-col bg-[var(--bg-primary)] antialiased">
    <!-- 头部导航 -->
    <HeaderNav />

    <!-- 主内容区域 - 路由视图 -->
    <main class="max-w-7xl mx-auto px-6 lg:px-8 pt-24 md:pt-28 lg:pt-32 pb-16 md:pb-20 flex-grow w-full">
      <router-view />
    </main>

    <!-- 页脚 -->
    <FooterSection />

    <!-- 回到顶部 -->
    <BackToTop />

    <!-- 浏览器提示 -->
    <BrowserToast />
    
    <!-- 全局提示 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script>
import { computed, ref, provide } from 'vue'
import { useRoute } from 'vue-router'
import HeaderNav from './components/HeaderNav.vue'
import FooterSection from './components/FooterSection.vue'
import BackToTop from './components/BackToTop.vue'
import BrowserToast from './components/BrowserToast.vue'
import Toast from './components/Toast.vue'

export default {
  name: 'App',
  components: {
    HeaderNav,
    FooterSection,
    BackToTop,
    BrowserToast,
    Toast
  },
  setup() {
    const route = useRoute()
    const isAdminPage = computed(() => route.meta.hideLayout)
    const toastRef = ref(null)
    
    // 提供全局 toast 方法
    const showToast = (message, type = 'info', duration = 2000) => {
      if (toastRef.value) {
        toastRef.value.show(message, type, duration)
      }
    }
    
    provide('showToast', showToast)
    
    return { 
      isAdminPage,
      toastRef
    }
  }
}
</script>

