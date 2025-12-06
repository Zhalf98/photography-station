/**
 * 生成 SEO 相关文件 (robots.txt, sitemap.xml)
 * 从配置文件读取域名等信息
 * 
 * 使用方法: node scripts/generateSeoFiles.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { siteConfig } from '../src/config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')

const domain = siteConfig.domain

// 获取当前日期 (YYYY-MM-DD)
const today = new Date().toISOString().split('T')[0]

// 生成 robots.txt
const robotsTxt = `# robots.txt for ${domain}/

User-agent: *
Allow: /

# 禁止抓取管理后台
Disallow: /admin

# 网站地图
Sitemap: ${domain}/sitemap.xml

# 抓取延迟（可选，单位：秒）
Crawl-delay: 1

# 针对百度爬虫的特殊规则
User-agent: Baiduspider
Allow: /

# 针对Google爬虫的特殊规则
User-agent: Googlebot
Allow: /
`

// 生成 sitemap.xml
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- 首页 -->
  <url>
    <loc>${domain}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 作品集页面 -->
  <url>
    <loc>${domain}/gallery</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- 关于我页面 -->
  <url>
    <loc>${domain}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- 联系方式页面 -->
  <url>
    <loc>${domain}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

</urlset>
`

// 写入文件
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt)
console.log('✅ 生成 robots.txt')

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml)
console.log('✅ 生成 sitemap.xml')

console.log(`\n📍 域名: ${domain}`)
console.log(`📅 日期: ${today}`)
