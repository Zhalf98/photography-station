<template>
  <footer class="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] mt-20 md:mt-24">
    <div class="max-w-5xl mx-auto px-6 py-5">
      <!-- 访问统计 -->
      <div class="text-center pb-4 mb-4 border-b border-[var(--border-color)]">
        <BusuanziStats />
      </div>
      
      <!-- 版权和链接 -->
      <div class="text-center text-[11px] leading-relaxed text-[var(--text-secondary)]">
        <p>
          Copyright © {{ siteConfig.startYear }} {{ siteConfig.name }}. 
          <a 
            href="https://github.com/lyhxx/photography-station" 
            target="_blank" 
            rel="noopener noreferrer"
            class="hover:text-[var(--text-primary)] hover:underline"
          >v{{ version }}</a>
          <template v-if="siteConfig.icp">
            <span class="mx-1">|</span>
            <a 
              href="https://beian.miit.gov.cn/" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="hover:text-[var(--text-primary)] hover:underline"
            >{{ siteConfig.icp }}</a>
          </template>
        </p>
        <p class="mt-1 text-[10px] text-[var(--text-tertiary)]">用镜头记录美好瞬间，用照片讲述生活故事</p>
      </div>
    </div>
  </footer>
</template>

<script>
import BusuanziStats from './BusuanziStats.vue'
import { siteConfig } from '@/config/index.js'

export default {
  name: 'FooterSection',
  components: {
    BusuanziStats
  },
  setup() {
    // 从 package.json 读取版本号
    const version = '1.9.1'
    
    return { 
      siteConfig,
      version
    }
  }
}
</script>
