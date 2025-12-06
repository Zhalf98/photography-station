import { siteConfig } from '../config/index.js'

// SEO 优化工具函数
export function useSEO() {
  // 更新页面标题
  const setTitle = (title) => {
    const fullTitle = title 
      ? `${title} - ${siteConfig.name}` 
      : `${siteConfig.name} - 用镜头记录生活的美好瞬间`
    document.title = fullTitle
    
    // 更新 Open Graph 标题
    updateMetaTag('property', 'og:title', fullTitle)
    updateMetaTag('name', 'twitter:title', fullTitle)
  }

  // 更新页面描述
  const setDescription = (description) => {
    updateMetaTag('name', 'description', description)
    updateMetaTag('property', 'og:description', description)
    updateMetaTag('name', 'twitter:description', description)
  }

  // 更新关键词
  const setKeywords = (keywords) => {
    updateMetaTag('name', 'keywords', keywords)
  }

  // 更新 Canonical URL
  const setCanonical = (url) => {
    const fullUrl = `${siteConfig.domain}${url}`
    
    // 更新 canonical link
    let canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) {
      canonical.href = fullUrl
    }
    
    // 更新 Open Graph URL
    updateMetaTag('property', 'og:url', fullUrl)
    updateMetaTag('name', 'twitter:url', fullUrl)
  }

  // 添加结构化数据
  const addStructuredData = (data) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  // 辅助函数：更新或创建 meta 标签
  const updateMetaTag = (attr, attrValue, content) => {
    let element = document.querySelector(`meta[${attr}="${attrValue}"]`)
    if (element) {
      element.setAttribute('content', content)
    } else {
      element = document.createElement('meta')
      element.setAttribute(attr, attrValue)
      element.setAttribute('content', content)
      document.head.appendChild(element)
    }
  }

  return {
    setTitle,
    setDescription,
    setKeywords,
    setCanonical,
    addStructuredData
  }
}
