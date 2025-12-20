import exifr from 'exifr'

/**
 * 提取照片 EXIF 信息
 * @param {File|Blob} file - 图片文件
 * @returns {Promise<Object>} EXIF 数据
 */
export async function extractEXIF(file) {
  try {
    const exifData = await exifr.parse(file, {
      pick: [
        'Make', 'Model',
        'FNumber', 'FocalLength', 'FocalLengthIn35mmFormat',
        'ExposureTime', 'ShutterSpeedValue',
        'ISO', 'ISOSpeedRatings',
        'DateTime', 'DateTimeOriginal',
        'GPSLatitude', 'GPSLongitude', 'latitude', 'longitude',
        'LensModel', 'LensMake'
      ],
      tiff: true,
      gps: true,
      mergeOutput: true
    })

    if (!exifData) {
      return null
    }

    // 格式化相机信息
    const cameraInfo = formatCameraInfo(exifData)
    
    // 格式化 GPS 信息
    const gpsInfo = formatGPS(exifData)

    return {
      raw: exifData,
      camera: cameraInfo,
      gps: gpsInfo,
      // 单独提取常用字段
      make: exifData.Make,
      model: exifData.Model,
      focalLength: exifData.FocalLengthIn35mmFormat || exifData.FocalLength,
      aperture: exifData.FNumber,
      shutterSpeed: exifData.ExposureTime,
      iso: exifData.ISO || exifData.ISOSpeedRatings,
      lens: exifData.LensModel,
      dateTime: exifData.DateTimeOriginal || exifData.DateTime
    }
  } catch (error) {
    console.warn('EXIF 提取失败:', error.message)
    return null
  }
}

/**
 * 格式化相机信息为显示字符串
 */
function formatCameraInfo(exifData) {
  const parts = []
  
  // 型号
  if (exifData.Model) {
    const model = exifData.Model.replace(exifData.Make || '', '').trim()
    if (model) parts.push(model)
  }
  
  // 焦距
  if (exifData.FocalLengthIn35mmFormat) {
    parts.push(`${Math.round(exifData.FocalLengthIn35mmFormat)}mm`)
  } else if (exifData.FocalLength) {
    parts.push(`${Math.round(exifData.FocalLength)}mm`)
  }
  
  // 光圈
  if (exifData.FNumber) {
    parts.push(`f/${exifData.FNumber}`)
  }
  
  // 快门
  if (exifData.ExposureTime) {
    const exp = exifData.ExposureTime
    if (exp < 1) {
      parts.push(`1/${Math.round(1/exp)}s`)
    } else {
      parts.push(`${exp}s`)
    }
  }
  
  // ISO
  const iso = exifData.ISO || exifData.ISOSpeedRatings
  if (iso) {
    parts.push(`ISO ${iso}`)
  }
  
  return parts.length > 0 ? parts.join(' · ') : null
}

/**
 * 格式化 GPS 信息
 */
function formatGPS(exifData) {
  const lat = exifData.latitude || exifData.GPSLatitude
  const lng = exifData.longitude || exifData.GPSLongitude
  
  if (lat && lng) {
    return { latitude: lat, longitude: lng }
  }
  return null
}

/**
 * 通过 GPS 坐标获取地理位置（需要后端支持）
 * @param {number} lat - 纬度
 * @param {number} lng - 经度
 * @returns {Promise<string|null>} 地理位置
 */
export async function getLocationFromGPS(lat, lng) {
  try {
    const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
    const data = await response.json()
    return data.location || null
  } catch (error) {
    console.warn('地理编码失败:', error)
    return null
  }
}
