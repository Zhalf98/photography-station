<template>
  <div class="max-w-4xl mx-auto">
    <!-- 页面标题 + 头像 -->
    <section class="mb-16 md:mb-20 fade-in-up" style="animation-delay: 0s">
      <div class="flex items-center gap-6 mb-6">
        <img 
          v-if="aboutConfig.avatar" 
          :src="aboutConfig.avatar" 
          :alt="aboutConfig.nickname"
          class="avatar w-24 h-24 md:w-28 md:h-28 rounded-full object-cover"
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
    <section class="mb-16 md:mb-20 fade-in-up" style="animation-delay: 0.1s">
      <h2 class="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)] mb-6">我的故事</h2>
      <div class="text-[17px] md:text-[19px] text-[var(--text-tertiary)] leading-relaxed space-y-5">
        <p v-for="(paragraph, index) in aboutConfig.story" :key="index">{{ paragraph }}</p>
      </div>
    </section>

    <!-- 摄影器材 -->
    <section class="mb-16 md:mb-20 fade-in-up" style="animation-delay: 0.2s">
      <h2 class="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)] mb-6">摄影器材</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div 
          v-for="item in aboutConfig.equipment" 
          :key="item.name"
          class="equipment-card"
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
    <section class="mb-16 md:mb-20 fade-in-up" style="animation-delay: 0.3s">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)]">拍摄足迹</h2>
        <span v-if="locations.length > 0" class="text-[15px] text-[var(--text-secondary)]">
          {{ locations.length }} 个地区
        </span>
      </div>
      
      <div v-if="locations.length > 0" class="flex flex-wrap gap-3">
        <router-link
          v-for="location in locations" 
          :key="location"
          to="/gallery"
          class="location-tag"
        >
          {{ location }}
        </router-link>
      </div>
      
      <div v-else class="text-[var(--text-secondary)] text-[17px]">
        暂无拍摄足迹数据
      </div>
    </section>

    <!-- 联系方式 -->
    <section class="fade-in-up" style="animation-delay: 0.4s">
      <h2 class="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)] mb-6">联系方式</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a 
          v-for="item in socialLinks" 
          :key="item.key" 
          :href="item.href" 
          target="_blank"
          rel="noopener noreferrer"
          class="social-card"
        >
          <Icon :icon="item.icon" :width="28" :height="28" :class="item.color" />
          <span class="text-[17px] md:text-[19px] text-[var(--text-tertiary)]">{{ item.label }}</span>
          <Icon icon="mdi:chevron-right" :width="20" :height="20" class="text-[var(--text-secondary)] ml-auto" />
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


<style scoped>
/* 头像悬停效果 */
.avatar {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar:hover {
  transform: scale(1.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

@media (prefers-color-scheme: dark) {
  .avatar {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .avatar:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
}

/* 摄影器材卡片 */
.equipment-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: var(--bg-primary);
}

@media (prefers-color-scheme: dark) {
  .equipment-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

/* 拍摄足迹标签 */
.location-tag {
  display: inline-block;
  padding: 10px 18px;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 15px;
  color: var(--text-tertiary);
  border: 1px solid var(--border-color);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-decoration: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.location-tag:hover {
  transform: translateY(-2px) scale(1.05);
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--text-secondary);
}

.location-tag:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
}

@media (max-width: 768px) {
  .location-tag {
    font-size: 14px;
    padding: 8px 16px;
  }
}

@media (prefers-color-scheme: dark) {
  .location-tag:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

/* 联系方式卡片 */
.social-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: var(--bg-secondary);
  border-radius: 14px;
  border: 1px solid var(--border-color);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.social-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  background: var(--bg-primary);
  border-color: var(--text-secondary);
}

.social-card:hover span {
  color: var(--text-primary);
}

.social-card:active {
  transform: translateY(-2px) scale(0.98);
  transition-duration: 0.1s;
}

@media (prefers-color-scheme: dark) {
  .social-card:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  }
}

/* 渐进式动画 */
.fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .equipment-card {
    padding: 14px 16px;
  }
  
  .social-card {
    padding: 16px 18px;
  }
}
</style>
