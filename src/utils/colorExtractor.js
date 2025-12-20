/**
 * 图片颜色提取工具
 * 用于从图片中提取主色调并生成渐变效果
 */

/**
 * 从图片中提取主色调
 * 
 * 工作原理：
 * 1. 使用 Canvas API 读取图片像素数据
 * 2. 对图片进行降采样（提高性能）
 * 3. 统计颜色分布，找出最常见的颜色
 * 4. 排除过暗、过亮、灰度色
 * 5. 返回最具代表性的主色调
 * 
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<string>} RGB颜色值，如 'rgb(255, 107, 107)'
 * 
 * 注意事项：
 * - 图片必须支持 CORS，否则会抛出安全错误
 * - 网络较慢时可能导致图片加载超时（设置了5秒超时）
 * - 每次调用都会重新提取，确保颜色准确
 */
export async function extractDominantColor(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous' // 允许跨域
    
    // 设置超时（5秒）
    const timeout = setTimeout(() => {
      reject(new Error('图片加载超时'))
    }, 5000)
    
    img.onload = () => {
      clearTimeout(timeout)
      
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // 降采样到 50x50 提高性能
        const size = 50
        canvas.width = size
        canvas.height = size
        
        ctx.drawImage(img, 0, 0, size, size)
        const imageData = ctx.getImageData(0, 0, size, size)
        const pixels = imageData.data
        
        // 统计颜色（重点关注中心区域和饱和度高的颜色）
        const colorMap = {}
        const centerWeight = 2 // 中心区域权重更高
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]
          
          // 跳过透明像素
          if (a < 128) continue
          
          // 跳过过暗或过亮的颜色
          const brightness = (r + g + b) / 3
          if (brightness < 40 || brightness > 230) continue
          
          // 计算饱和度
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          const saturation = max === 0 ? 0 : (max - min) / max
          
          // 跳过灰度色（饱和度太低）
          if (saturation < 0.25) continue
          
          // 量化颜色（减少颜色数量）
          const quantize = 40
          const qr = Math.round(r / quantize) * quantize
          const qg = Math.round(g / quantize) * quantize
          const qb = Math.round(b / quantize) * quantize
          const key = `${qr},${qg},${qb}`
          
          // 计算像素位置（中心区域权重更高）
          const pixelIndex = i / 4
          const x = pixelIndex % size
          const y = Math.floor(pixelIndex / size)
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - size / 2, 2) + Math.pow(y - size / 2, 2)
          )
          const maxDistance = size / 2
          const positionWeight = distanceFromCenter < maxDistance / 2 ? centerWeight : 1
          
          // 饱和度越高，权重越大
          const saturationWeight = 1 + saturation
          
          const weight = positionWeight * saturationWeight
          colorMap[key] = (colorMap[key] || 0) + weight
        }
        
        // 找出权重最高的颜色
        let dominantColor = null
        let maxWeight = 0
        
        for (const [color, weight] of Object.entries(colorMap)) {
          if (weight > maxWeight) {
            maxWeight = weight
            dominantColor = color
          }
        }
        
        if (dominantColor) {
          resolve(`rgb(${dominantColor})`)
        } else {
          reject(new Error('无法提取主色调'))
        }
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('图片加载失败'))
    }
    
    img.src = imageUrl
  })
}

/**
 * 根据主色调生成渐变色
 * 
 * 生成策略：
 * 1. 提取主色调的 HSL 值
 * 2. 生成同色系的深浅变化（调整亮度和饱和度）
 * 3. 创建 5 个渐变点，形成柔和的渐变效果
 * 
 * @param {string} rgbColor - RGB颜色值，如 'rgb(255, 107, 107)'
 * @returns {string} CSS 渐变字符串
 */
export function generateGradientFromColor(rgbColor) {
  // 解析 RGB
  const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return null
  
  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])
  
  // 转换为 HSL
  const hsl = rgbToHsl(r, g, b)
  
  // 生成同色系渐变（调整色相、饱和度和亮度，创造更丰富的渐变）
  const colors = [
    hslToRgb((hsl.h - 15 + 360) % 360, Math.min(hsl.s * 1.1, 90), Math.max(hsl.l * 0.9, 45)),
    hslToRgb(hsl.h, Math.min(hsl.s * 1.2, 95), hsl.l),
    hslToRgb((hsl.h + 10) % 360, Math.min(hsl.s, 85), Math.min(hsl.l * 1.15, 75)),
    hslToRgb((hsl.h + 20) % 360, Math.max(hsl.s * 0.8, 40), Math.min(hsl.l * 1.3, 85)),
    hslToRgb((hsl.h - 15 + 360) % 360, Math.min(hsl.s * 1.1, 90), Math.max(hsl.l * 0.9, 45)),
  ]
  
  return `linear-gradient(135deg, 
    ${colors[0]} 0%,
    ${colors[1]} 25%,
    ${colors[2]} 50%,
    ${colors[3]} 75%,
    ${colors[4]} 100%
  )`
}

/**
 * RGB 转 HSL
 */
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * HSL 转 RGB
 */
function hslToRgb(h, s, l) {
  h /= 360
  s /= 100
  l /= 100
  
  let r, g, b
  
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.6)`
}

/**
 * 获取相册颜色（实时提取）
 * 
 * @param {string} categoryName - 相册名称
 * @param {string} imageUrl - 封面图URL
 * @returns {Promise<string>} CSS 渐变字符串
 */
export async function getAlbumColor(categoryName, imageUrl) {
  try {
    // 提取颜色
    const dominantColor = await extractDominantColor(imageUrl)
    const gradient = generateGradientFromColor(dominantColor)
    
    return gradient
  } catch (error) {
    console.warn(`提取相册 "${categoryName}" 颜色失败:`, error.message)
    // 返回 null，让组件使用降级方案
    return null
  }
}
