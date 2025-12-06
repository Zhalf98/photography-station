<template>
  <div class="max-w-4xl mx-auto">
    <!-- 页面标题 + 头像 -->
    <section class="mb-16 md:mb-20">
      <div class="flex items-center gap-6 mb-6">
        <img 
          v-if="aboutConfig.avatar" 
          :src="aboutConfig.avatar" 
          :alt="aboutConfig.nickname"
          class="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover"
        />
        <div>
          <h1 class="text-[36px] md:text-[48px] font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
            {{ aboutConfig.title }}
          </h1>
          <p class="text-[17px] md:text-[19px] text-[var(--text-secondary)] mt-1">{{ aboutConfig.nickname }}</p>
        </div>
      </div>
      <p class="text-[19px] md:text-[21px] text-[var(--text-tertiary)] leading-relaxed">
        {{ aboutConfig.bio }}
      </p>
    </section>

    <!-- 我的故事 -->
    <section class="mb-16 md:mb-20">
      <h2 class="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)] mb-6">我的故事</h2>
      <div class="text-[17px] md:text-[19px] text-[var(--text-tertiary)] leading-relaxed space-y-5">
        <p v-for="(paragraph, index) in aboutConfig.story" :key="index">{{ paragraph }}</p>
      </div>
    </section>

    <!-- 摄影器材 -->
    <section class="mb-16 md:mb-20">
      <h2 class="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)] mb-6">摄影器材</h2>
      <div class="space-y-4">
        <div 
          v-for="item in aboutConfig.equipment" 
          :key="item.name"
          class="flex items-center space-x-3"
        >
          <Icon 
            :icon="item.type === '手机' ? 'mdi:cellphone' : 'mdi:camera'" 
            :width="24" 
            :height="24" 
            class="text-[var(--text-secondary)]" 
          />
          <span class="text-[17px] md:text-[19px] text-[var(--text-tertiary)]">{{ item.name }}</span>
        </div>
      </div>
    </section>

    <!-- 拍摄足迹 -->
    <section class="mb-16 md:mb-20">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)]">拍摄足迹</h2>
        <span v-if="locations.length > 0" class="text-[15px] text-[var(--text-secondary)]">
          {{ locations.length }} 个地区
        </span>
      </div>
      
      <div v-if="locations.length > 0" class="flex flex-wrap gap-3">
        <span 
          v-for="location in locations" 
          :key="location" 
          class="px-4 py-2 bg-[var(--bg-secondary)] rounded-full text-[15px] md:text-[17px] text-[var(--text-tertiary)]"
        >
          {{ location }}
        </span>
      </div>
      
      <div v-else class="text-[var(--text-secondary)] text-[17px]">
        暂无拍摄足迹数据
      </div>
    </section>

    <!-- 联系方式 -->
    <section>
      <h2 class="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)] mb-6">联系方式</h2>
      <div class="space-y-4">
        <a v-for="item in socialLinks" :key="item.key" :href="item.href" target="_blank" class="flex items-center space-x-4 group">
          <Icon :icon="item.icon" :width="24" :height="24" :class="item.color" />
          <span class="text-[17px] md:text-[19px] text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">{{ item.label }}</span>
        </a>
      </div>
    </section>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useSEO } from '../../composables/useSEO.js'
import { photoGallery } from '../../data/photos.js'
import { pageConfig } from '../../config/index.js'

// 社交链接配置
const socialMap = {
  email: { icon: 'mdi:email', color: 'text-blue-600', label: (v) => v, href: (v) => `mailto:${v}` },
  github: { icon: 'mdi:github', color: 'text-gray-700', label: () => 'GitHub', href: (v) => v },
  wechat: { icon: 'mdi:wechat', color: 'text-green-600', label: () => '微信', href: (v) => v },
  weibo: { icon: 'mdi:sina-weibo', color: 'text-red-500', label: () => '微博', href: (v) => v },
  xiaohongshu: { icon: 'simple-icons:xiaohongshu', color: 'text-red-600', label: () => '小红书', href: (v) => v },
  douyin: { icon: 'simple-icons:tiktok', color: 'text-gray-900', label: () => '抖音', href: (v) => v },
  bilibili: { icon: 'simple-icons:bilibili', color: 'text-pink-500', label: () => 'B站', href: (v) => v },
  qq: { icon: 'mdi:qqchat', color: 'text-blue-500', label: () => 'QQ', href: (v) => v },
}

export default {
  name: 'AboutPage',
  components: {
    Icon
  },
  setup() {
    const { setTitle, setDescription, setKeywords, setCanonical } = useSEO()
    const aboutConfig = pageConfig.about
    const contactConfig = pageConfig.contact
    
    // 从照片数据中提取唯一的省市级别位置
    const locations = computed(() => {
      const locationSet = new Set()
      
      photoGallery.forEach(photo => {
        if (photo.location) {
          const parts = photo.location.split('.')
          if (parts.length >= 2) {
            locationSet.add(`${parts[0]}·${parts[1]}`)
          } else if (parts[0].trim()) {
            locationSet.add(parts[0].trim())
          }
        }
      })
      
      return Array.from(locationSet).sort()
    })

    // 生成社交链接列表
    const socialLinks = computed(() => {
      return Object.entries(contactConfig)
        .filter(([_, value]) => value)
        .map(([key, value]) => {
          const config = socialMap[key]
          if (!config) return null
          return {
            key,
            icon: config.icon,
            color: config.color,
            label: config.label(value),
            href: config.href(value)
          }
        })
        .filter(Boolean)
    })
    
    onMounted(() => {
      setTitle(aboutConfig.title)
      setDescription(`${aboutConfig.bio} 分享摄影器材、拍摄足迹和联系方式。`)
      setKeywords('关于摄影,摄影师介绍,摄影器材,拍摄足迹,联系方式')
      setCanonical('/about')
    })

    return {
      aboutConfig,
      locations,
      socialLinks
    }
  }
}
</script>
