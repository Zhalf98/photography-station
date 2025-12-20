/**
 * Live Photo 工具函数
 * 支持 iPhone Live Photo 和 Android Motion Photo
 * 
 * Android Motion Photo 检测原理：
 * 1. XMP 元数据检测（最可靠）：
 *    - vivo Live Photo: 查找 vivo:LivePhoto="1"
 *    - Google/Samsung: 查找 GCamera:MicroVideo="1"
 *    - 视频偏移量: 查找 GCamera:MicroVideoOffset
 * 
 * 2. 二进制特征检测（兜底）：
 *    - 查找 JPG 结束标记 (0xFF 0xD9)
 *    - 检测 MP4 文件头 (ftyp)
 *    - 检测 vivo 特有标记 (streamdata)
 * 
 * 文件结构：
 * [JPEG 数据] + [XMP 元数据] + [MP4 视频数据]
 */

/**
 * 检测是否为 Motion Photo（安卓）
 * 支持：vivo Live Photo、Google Motion Photo、Samsung Motion Photo
 */
export async function detectMotionPhoto(file) {
  if (file.type !== 'image/jpeg') {
    console.log('不是 JPEG 文件，跳过 Motion Photo 检测')
    return false
  }
  
  try {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    console.log(`文件大小: ${bytes.length} 字节`)
    
    // 方法一：检测 XMP 元数据标记（最可靠）
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const content = decoder.decode(bytes)
    
    // 📊 照片属性分析
    console.log('📊 照片属性分析:')
    const hasMotionPhoto = content.includes('Item:Semantic="MotionPhoto"')
    const hasItemLength = content.includes('Item:Length=')
    const hasVivoLivePhoto = content.includes('vivo:LivePhoto')
    const hasGainMap = content.includes('Item:Semantic="GainMap"')
    const hasHDRImage = content.includes('vivo:HDRImage')
    
    console.log(`  - Item:Semantic="MotionPhoto": ${hasMotionPhoto ? '✅' : '❌'}`)
    console.log(`  - Item:Length=: ${hasItemLength ? '✅' : '❌'}`)
    console.log(`  - vivo:LivePhoto: ${hasVivoLivePhoto ? '✅' : '❌'}`)
    console.log(`  - GainMap (HDR): ${hasGainMap ? '✅' : '❌'}`)
    console.log(`  - vivo:HDRImage: ${hasHDRImage ? '✅' : '❌'}`)
    
    // 检测 vivo X200 Pro 的 Item:Length 标记（最新格式）
    if (hasMotionPhoto && hasItemLength) {
      console.log('✅ 检测到 vivo X200 Pro Motion Photo (Item:Length 标记)！')
      return true
    }
    
    // 检测 vivo X200 Pro 的 MotionPhoto 标记（即使没有 Item:Length=）
    if (hasMotionPhoto) {
      console.log('✅ 检测到 Motion Photo (Item:Semantic 标记)！')
      return true
    }
    
    // 检测 vivo 旧版的 XMP 标记
    if (content.includes('vivo:LivePhoto="1"')) {
      console.log('✅ 检测到 vivo Live Photo (XMP 标记)！')
      return true
    }
    
    // 检测安卓通用的微视频标记（Google/Samsung）
    if (content.includes('GCamera:MicroVideo="1"')) {
      console.log('✅ 检测到 Google/Samsung Motion Photo (XMP 标记)！')
      return true
    }
    
    // 检测 GCamera:MicroVideoOffset（视频偏移量标记）
    if (content.includes('GCamera:MicroVideoOffset')) {
      console.log('✅ 检测到 Motion Photo (MicroVideoOffset 标记)！')
      return true
    }
    
    // 方法二：二进制特征检测（兜底方案）
    // 先找到 JPG 结束标记
    let jpgEnd = -1
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === 0xFF && bytes[i + 1] === 0xD9) {
        jpgEnd = i + 2
      }
    }
    
    console.log(`JPG 结束位置: ${jpgEnd}`)
    
    if (jpgEnd === -1) {
      console.log('没有找到 JPG 结束标记')
      return false
    }
    
    // 在 JPG 结束后查找 MP4 魔术字节（ftyp）
    const remainingBytes = bytes.slice(jpgEnd)
    console.log(`JPG 后剩余数据: ${remainingBytes.length} 字节`)
    
    // 如果剩余数据太少（小于 100 字节），不是 Motion Photo
    if (remainingBytes.length < 100) {
      console.log('剩余数据太少，不是 Motion Photo')
      return false
    }
    
    // 检测标准 Motion Photo（Google/Samsung）- ftyp 标记
    const ftypIndex = findBytes(remainingBytes, [0x66, 0x74, 0x79, 0x70])
    console.log(`ftyp 位置: ${ftypIndex}`)
    
    if (ftypIndex >= 0 && ftypIndex < 1000) {
      console.log('✅ 检测到标准 Motion Photo (ftyp 标记)！')
      return true
    }
    
    // 检测 vivo Live Photo（streamdata 标记）
    const vivoMarker = findBytes(remainingBytes, [0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x64, 0x61, 0x74, 0x61])
    console.log(`vivo streamdata 标记位置: ${vivoMarker}`)
    
    if (vivoMarker >= 0 && vivoMarker < 100) {
      console.log('✅ 检测到 vivo Live Photo (streamdata 标记)！')
      return true
    }
    
    console.log('不是 Motion Photo')
    return false
  } catch (error) {
    console.error('检测 Motion Photo 失败:', error)
    return false
  }
}

/**
 * 分离 Motion Photo 中的图片和视频
 * 支持两种方式：
 * 1. 从 XMP 元数据读取视频偏移量（推荐）
 * 2. 查找 JPG 结束标记（兜底）
 */
export async function extractMotionPhoto(file) {
  const fileSize = file.size
  console.log(`📁 文件总大小: ${fileSize} 字节`)
  
  // 方法一：尝试从 XMP 元数据读取视频偏移量
  // 只读取前 256KB（XMP 元数据通常在文件头部，优化大文件处理）
  const headerSize = Math.min(256 * 1024, fileSize)
  const headerBlob = file.slice(0, headerSize)
  const headerText = await headerBlob.text()
  
  // 🔍 调试：打印所有相关的元数据标记
  console.log('🔍 开始搜索元数据标记...')
  const allMatches = headerText.match(/[\x20-\x7E]{4,}/g) || []
  const relevantTags = allMatches.filter(s => /vivo|Motion|Video|Item|Length|Offset|Camera|stream/i.test(s))
  console.log('📋 找到的相关元数据标记:', relevantTags.slice(0, 20)) // 只显示前20个
  
  // 特别查找可能的偏移量标记
  const offsetTags = allMatches.filter(s => /offset|length|size/i.test(s))
  console.log('📏 可能的偏移量标记:', offsetTags)
  
  // 方法 1: 查找 vivo X200 Pro 的 Item:Length 标记
  // 格式可能是：
  // <Container:Item Item:Semantic="MotionPhoto" Item:Mime="video/mp4" Item:Length="xxxx"/>
  // 或者 Item:Length= 后面没有引号
  let itemLengthMatch = headerText.match(/Item:Semantic="MotionPhoto"[^>]+Item:Length="(\d+)"/)
  
  // 如果没找到带引号的，尝试不带引号的
  if (!itemLengthMatch) {
    itemLengthMatch = headerText.match(/Item:Semantic="MotionPhoto"[^>]+Item:Length=(\d+)/)
  }
  
  // 也尝试反向匹配（Length 在前，Semantic 在后）
  if (!itemLengthMatch) {
    itemLengthMatch = headerText.match(/Item:Length="(\d+)"[^>]+Item:Semantic="MotionPhoto"/)
  }
  
  if (!itemLengthMatch) {
    itemLengthMatch = headerText.match(/Item:Length=(\d+)[^>]+Item:Semantic="MotionPhoto"/)
  }
  
  if (itemLengthMatch) {
    const videoLength = parseInt(itemLengthMatch[1])
    const videoStart = fileSize - videoLength
    
    console.log(`📍 从 Item:Length 读取到视频长度: ${videoLength}`)
    console.log(`📍 计算的视频起始位置: ${videoStart}`)
    
    if (videoStart > 0 && videoStart < fileSize && videoLength > 100) {
      // 不指定 MIME 类型，让浏览器自动检测
      const imageBlob = file.slice(0, videoStart)
      const videoBlob = file.slice(videoStart, fileSize)
      
      // 手动创建正确的 Blob
      const imageBlobWithType = new Blob([imageBlob], { type: 'image/jpeg' })
      const videoBlobWithType = new Blob([videoBlob], { type: 'video/mp4' })
      
      console.log(`✅ 分离结果 (Item:Length 方式) - 图片: ${imageBlobWithType.size} 字节, 视频: ${videoBlobWithType.size} 字节`)
      
      return { image: imageBlobWithType, video: videoBlobWithType }
    }
  }
  
  // 方法 2: 查找 GCamera:MicroVideoOffset（Google/Samsung 标准格式）
  const offsetMatch = headerText.match(/GCamera:MicroVideoOffset="(\d+)"/)
  
  if (offsetMatch) {
    const offset = parseInt(offsetMatch[1])
    console.log(`📍 从 XMP 读取到视频偏移量: ${offset}`)
    
    // 视频起始位置 = 文件总大小 - 偏移量
    let videoStart = fileSize - offset
    console.log(`📍 初步计算的视频起始位置: ${videoStart}`)
    console.log(`📍 视频大小: ${offset} 字节`)
    
    if (videoStart > 0 && videoStart < fileSize && offset > 100) {
      // 【关键校验】在计算出的位置附近 ±50 字节范围内搜索 ftyp 标记
      // 防止因 XMP 长度计算导致的 1-2 字节误差
      const searchStart = Math.max(0, videoStart - 50)
      const searchEnd = Math.min(fileSize, videoStart + 50)
      const searchSize = searchEnd - searchStart
      
      console.log(`🔍 在 ${searchStart} - ${searchEnd} 范围内搜索 ftyp 标记...`)
      
      const searchBlob = file.slice(searchStart, searchEnd)
      const searchBuffer = await searchBlob.arrayBuffer()
      const searchBytes = new Uint8Array(searchBuffer)
      
      // 查找 ftyp (0x66 0x74 0x79 0x70)
      const ftypIndex = findBytes(searchBytes, [0x66, 0x74, 0x79, 0x70])
      
      if (ftypIndex >= 0) {
        // 找到 ftyp，往前推 4 字节（MP4 的 size 字段）
        const actualStart = searchStart + Math.max(0, ftypIndex - 4)
        console.log(`✅ 找到 ftyp 标记，实际视频起始位置: ${actualStart}`)
        videoStart = actualStart
      } else {
        console.log(`ℹ️ 未找到 ftyp 标记，使用计算的偏移量位置`)
      }
      
      // 使用 slice 直接切割
      const imageBlob = file.slice(0, videoStart, 'image/jpeg')
      const videoBlob = file.slice(videoStart, fileSize, 'video/mp4')
      
      console.log(`✅ 分离结果 (XMP 方式) - 图片: ${imageBlob.size} 字节, 视频: ${videoBlob.size} 字节`)
      
      return { image: imageBlob, video: videoBlob }
    } else {
      console.warn(`⚠️ 计算的视频起始位置无效: ${videoStart}, 偏移量: ${offset}`)
    }
  } else {
    console.log(`ℹ️ 未找到 GCamera:MicroVideoOffset，尝试其他方式`)
  }
  
  // 方法二：查找 JPG 结束标记（兜底方案）
  // 这种方式需要读取整个文件
  console.log('使用 JPG 结束标记方式分离...')
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  
  // 方法二：查找 JPG 结束标记（兜底方案）
  console.log('使用 JPG 结束标记方式分离...')
  
  let jpgEnd = -1
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD9) {
      jpgEnd = i + 2
    }
  }
  
  if (jpgEnd === -1) {
    throw new Error('无法找到 JPG 结束标记')
  }
  
  console.log(`JPG 结束位置: ${jpgEnd}`)
  
  // 在 JPG 结束后查找 MP4 起始位置（ftyp 标记）
  const remainingBytes = bytes.slice(jpgEnd)
  
  // 先查找 streamdata 标记（vivo 特有）
  const streamdataIndex = findBytes(remainingBytes, [0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x64, 0x61, 0x74, 0x61])
  
  // 然后查找 ftyp 标记（MP4 真正的起始）
  const ftypIndex = findBytes(remainingBytes, [0x66, 0x74, 0x79, 0x70])
  
  let videoStart = jpgEnd
  
  if (ftypIndex >= 0) {
    // 找到 ftyp，往前推 4 字节找到真正的起始位置
    // MP4 格式: [size(4字节)][type(4字节，即ftyp)]
    videoStart = jpgEnd + Math.max(0, ftypIndex - 4)
    console.log(`✅ 找到 ftyp 标记在偏移 ${ftypIndex}，视频起始位置: ${videoStart}`)
    
    if (streamdataIndex >= 0 && streamdataIndex < ftypIndex) {
      console.log(`ℹ️ 检测到 vivo streamdata 标记在偏移 ${streamdataIndex}，ftyp 在其后 ${ftypIndex - streamdataIndex} 字节`)
    }
  } else if (streamdataIndex >= 0) {
    // 只找到 streamdata，没找到 ftyp
    // 尝试在 streamdata 后面继续查找
    console.log(`⚠️ 找到 streamdata 标记在偏移 ${streamdataIndex}，但未找到 ftyp`)
    console.log(`尝试在 streamdata 后查找 MP4 数据...`)
    
    // 从 streamdata 后面开始查找 ftyp
    const afterStreamdata = remainingBytes.slice(streamdataIndex + 100)
    const ftypIndex2 = findBytes(afterStreamdata, [0x66, 0x74, 0x79, 0x70])
    
    if (ftypIndex2 >= 0) {
      videoStart = jpgEnd + streamdataIndex + 100 + Math.max(0, ftypIndex2 - 4)
      console.log(`✅ 在 streamdata 后找到 ftyp，视频起始位置: ${videoStart}`)
    } else {
      console.log(`❌ 未找到 ftyp 标记，使用 JPG 结束位置作为视频起始`)
    }
  } else {
    console.log(`❌ 未找到 ftyp 或 streamdata 标记，使用 JPG 结束位置作为视频起始`)
  }
  
  // 分离图片和视频
  const imageBlob = new Blob([bytes.slice(0, jpgEnd)], { type: 'image/jpeg' })
  const videoBlob = new Blob([bytes.slice(videoStart)], { type: 'video/mp4' })
  
  console.log(`分离结果 (标记方式) - 图片: ${imageBlob.size} 字节, 视频: ${videoBlob.size} 字节`)
  
  // 验证视频大小（至少 100 字节）
  if (videoBlob.size < 100) {
    throw new Error('视频数据无效')
  }
  
  return { image: imageBlob, video: videoBlob }
}

/**
 * 检测 iPhone Live Photo（配对文件）
 */
export function detectLivePhoto(files) {
  const images = files.filter(f => 
    f.type === 'image/heic' || 
    f.type === 'image/jpeg' ||
    f.name.toLowerCase().endsWith('.heic') ||
    f.name.toLowerCase().endsWith('.jpg')
  )
  
  const videos = files.filter(f => 
    f.type === 'video/quicktime' || 
    f.name.toLowerCase().endsWith('.mov')
  )
  
  // 匹配文件名
  for (const img of images) {
    const baseName = img.name.replace(/\.(heic|jpg|jpeg)$/i, '')
    const matchedVideo = videos.find(v => 
      v.name.toLowerCase().startsWith(baseName.toLowerCase())
    )
    if (matchedVideo) {
      return { image: img, video: matchedVideo }
    }
  }
  
  return null
}

/**
 * HEIC 转 JPG
 */
export async function convertHEIC(heicFile) {
  try {
    const heic2any = (await import('heic2any')).default
    
    const jpgBlob = await heic2any({
      blob: heicFile,
      toType: 'image/jpeg',
      quality: 0.92
    })
    
    return Array.isArray(jpgBlob) ? jpgBlob[0] : jpgBlob
  } catch (error) {
    throw new Error('HEIC 转换失败: ' + error.message)
  }
}

/**
 * 辅助函数：查找字节序列
 */
function findBytes(bytes, pattern) {
  for (let i = 0; i < bytes.length - pattern.length; i++) {
    let match = true
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        match = false
        break
      }
    }
    if (match) return i
  }
  return -1
}
