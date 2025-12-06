<template>
  <div class="photos-manager">
    <!-- 顶部操作栏 -->
    <el-card class="action-bar" shadow="never">
      <div class="action-bar-content">
        <div class="action-left">
          <el-input 
            v-model="searchText" 
            placeholder="搜索图片标题..." 
            clearable
            style="width: 250px"
            :prefix-icon="Search"
          />
          <el-select v-model="filterCategory" placeholder="筛选分类" clearable style="width: 150px">
            <el-option label="全部分类" value="" />
            <el-option 
              v-for="cat in categories" 
              :key="cat.id" 
              :label="cat.name" 
              :value="cat.name" 
            />
          </el-select>
        </div>
        <div class="action-right">
          <el-button type="primary" :icon="Plus" @click="showUploadDialog = true">
            上传图片
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 图片列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="paginatedPhotos" v-loading="loading" stripe style="width: 100%">
        <el-table-column width="130" label="缩略图">
          <template #default="{ row }">
            <el-image 
              :src="row.thumbnail" 
              fit="cover"
              class="thumb-img"
              lazy
              :preview-src-list="[row.image_src]"
              preview-teleported
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column label="标题" width="120">
          <template #default="{ row }">
            <div class="wrap-cell">{{ row.title }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="描述">
          <template #default="{ row }">
            <div class="wrap-cell">{{ row.describe || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="型号" width="130">
          <template #default="{ row }">
            <div class="wrap-cell">{{ row.model || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="focal_length" label="焦距" width="70" />
        <el-table-column prop="aperture" label="光圈" width="70" />
        <el-table-column prop="shutter_speed" label="快门" width="80" />
        <el-table-column label="地点" width="100">
          <template #default="{ row }">
            <div class="wrap-cell">{{ row.location || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editPhoto(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deletePhoto(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredPhotos.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传图片" width="650px" @closed="resetUploadForm">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="选择图片" required>
          <div class="upload-wrapper">
            <!-- 未选择图片时显示上传区域 -->
            <el-upload
              v-if="!uploadForm.previewUrl"
              ref="uploadRef"
              drag
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              accept="image/*"
              class="upload-area"
              :show-file-list="false"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽图片到此处，或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">支持 jpg/png/webp 格式，建议不超过 10MB</div>
              </template>
            </el-upload>
            <!-- 已选择图片时显示预览 -->
            <div v-else class="image-preview">
              <el-image :src="uploadForm.previewUrl" fit="contain" class="preview-img" />
              <div class="preview-actions">
                <el-button type="danger" size="small" @click="removeImage">
                  <el-icon><Delete /></el-icon> 移除
                </el-button>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- EXIF 信息预览 -->
        <el-form-item v-if="uploadForm.exifInfo" label="EXIF信息">
          <div class="exif-preview">
            <!-- 第一行：型号 + 地点 -->
            <div class="exif-row">
              <div class="exif-item flex-2">
                <span class="exif-label">型号：</span>
                <span class="exif-value">{{ uploadForm.exifInfo.model || '-' }}</span>
              </div>
              <div class="exif-item flex-1">
                <span class="exif-label">地点：</span>
                <span class="exif-value">
                  <span v-if="uploadForm.exifInfo.location">{{ uploadForm.exifInfo.location }}</span>
                  <span v-else-if="uploadForm.exifInfo.gps" class="loading-text">定位中...</span>
                  <span v-else>-</span>
                </span>
              </div>
            </div>
            <!-- 第二行：焦距 + 光圈 + 快门 -->
            <div class="exif-row">
              <div class="exif-item flex-1">
                <span class="exif-label">焦距：</span>
                <span class="exif-value">{{ uploadForm.exifInfo.focalLength || '-' }}</span>
              </div>
              <div class="exif-item flex-1">
                <span class="exif-label">光圈：</span>
                <span class="exif-value">{{ uploadForm.exifInfo.aperture || '-' }}</span>
              </div>
              <div class="exif-item flex-1">
                <span class="exif-label">快门：</span>
                <span class="exif-value">{{ uploadForm.exifInfo.shutterSpeed || '-' }}</span>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="uploadForm.title" placeholder="请输入图片标题" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="uploadForm.category" placeholder="选择分类" style="width: 100%">
            <el-option 
              v-for="cat in categories" 
              :key="cat.id" 
              :label="cat.name" 
              :value="cat.name" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.describe" type="textarea" :rows="4" placeholder="图片描述（可选）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">
          {{ uploading ? '上传中...' : '确认上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑图片" width="700px">
      <el-form :model="editForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题">
              <el-input v-model="editForm.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="editForm.category" style="width: 100%">
                <el-option 
                  v-for="cat in categories" 
                  :key="cat.id" 
                  :label="cat.name" 
                  :value="cat.name" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="editForm.describe" type="textarea" :rows="3" />
        </el-form-item>
        <el-divider content-position="left">EXIF 信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="型号">
              <el-input v-model="editForm.model" placeholder="如: vivo X200 Pro" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地点">
              <el-input v-model="editForm.location" placeholder="如: 广东.深圳" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="焦距">
              <el-input v-model="editForm.focal_length" placeholder="如: 23mm" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="光圈">
              <el-input v-model="editForm.aperture" placeholder="如: f/1.8" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="快门">
              <el-input v-model="editForm.shutter_speed" placeholder="如: 1/100s" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">图片预览</el-divider>
        <div class="edit-images-preview">
          <div class="preview-item">
            <div class="preview-label">缩略图</div>
            <el-image 
              v-if="editForm.thumbnail" 
              :src="editForm.thumbnail" 
              fit="contain" 
              class="preview-img"
              :preview-src-list="[editForm.thumbnail]"
            >
              <template #error>
                <div class="preview-error">加载失败</div>
              </template>
            </el-image>
            <div v-else class="preview-empty">暂无图片</div>
          </div>
          <div class="preview-item">
            <div class="preview-label">原图</div>
            <el-image 
              v-if="editForm.image_src" 
              :src="editForm.image_src" 
              fit="contain" 
              class="preview-img"
              :preview-src-list="[editForm.image_src]"
            >
              <template #error>
                <div class="preview-error">加载失败</div>
              </template>
            </el-image>
            <div v-else class="preview-empty">暂无图片</div>
          </div>
        </div>
        <el-divider content-position="left">图片地址</el-divider>
        <el-form-item label="缩略图">
          <el-input v-model="editForm.thumbnail" placeholder="缩略图URL" />
        </el-form-item>
        <el-form-item label="原图">
          <el-input v-model="editForm.image_src" placeholder="原图URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Delete, Picture, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import exifr from 'exifr'

const API_BASE = '/api'

const loading = ref(false)
const uploading = ref(false)
const photos = ref([])
const categories = ref([])
const config = ref({})
const searchText = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const showUploadDialog = ref(false)
const showEditDialog = ref(false)
const uploadRef = ref(null)

const uploadForm = ref({
  file: null,
  previewUrl: null,
  title: '',
  category: '',
  describe: '',
  exifInfo: null
})

const editForm = ref({})
const editIndex = ref(-1)



// 过滤后的图片列表
const filteredPhotos = computed(() => {
  return photos.value.filter(p => {
    const matchSearch = !searchText.value || p.title.includes(searchText.value)
    const matchCategory = !filterCategory.value || p.category === filterCategory.value
    return matchSearch && matchCategory
  })
})

// 分页后的图片列表
const paginatedPhotos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPhotos.value.slice(start, end)
})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const [photosRes, categoriesRes, configRes] = await Promise.all([
      fetch(`${API_BASE}/photos`).then(r => r.json()),
      fetch(`${API_BASE}/categories`).then(r => r.json()),
      fetch(`${API_BASE}/config`).then(r => r.json())
    ])
    photos.value = photosRes
    categories.value = categoriesRes
    config.value = configRes
  } catch (e) {
    ElMessage.error('加载数据失败: ' + e.message)
  }
  loading.value = false
}

// 文件选择处理
async function handleFileChange(uploadFile) {
  uploadForm.value.file = uploadFile.raw
  // 生成预览URL
  uploadForm.value.previewUrl = URL.createObjectURL(uploadFile.raw)
  
  // 读取 EXIF
  try {
    const exifData = await exifr.parse(uploadFile.raw, {
      pick: ['FNumber', 'ExposureTime', 'ShutterSpeedValue', 'FocalLengthIn35mmFormat', 'Model', 'Make', 'latitude', 'longitude'],
      tiff: true, gps: true, mergeOutput: true
    })
    
    if (exifData) {
      // 提取型号（保留品牌）
      let model = null
      if (exifData.Model) {
        const make = exifData.Make || ''
        // 如果型号里已经包含品牌名，就不重复添加
        if (exifData.Model.toLowerCase().includes(make.toLowerCase())) {
          model = exifData.Model.trim()
        } else {
          model = make ? `${make} ${exifData.Model}`.trim() : exifData.Model.trim()
        }
      }
      
      // 提取焦距
      const focalLength = exifData.FocalLengthIn35mmFormat ? `${Math.round(exifData.FocalLengthIn35mmFormat)}mm` : null
      
      // 提取光圈
      let aperture = null
      if (exifData.FNumber) {
        const fNum = exifData.FNumber
        aperture = `f/${fNum % 1 === 0 ? fNum : fNum.toFixed(1)}`
      }
      
      // 提取快门
      let shutterSpeed = null
      if (exifData.ShutterSpeedValue) {
        const exposure = Math.pow(2, -exifData.ShutterSpeedValue)
        shutterSpeed = exposure < 1 ? `1/${Math.round(1/exposure)}s` : `${exposure.toFixed(1)}s`
      } else if (exifData.ExposureTime) {
        const exp = exifData.ExposureTime
        shutterSpeed = exp < 1 ? `1/${Math.round(1/exp)}s` : `${exp}s`
      }
      
      // 组合相机信息
      const cameraInfoParts = [model, focalLength, aperture, shutterSpeed].filter(Boolean)
      
      // GPS 信息
      const gps = exifData.latitude && exifData.longitude 
        ? { lat: exifData.latitude, lng: exifData.longitude } 
        : null
      
      uploadForm.value.exifInfo = {
        model,
        focalLength,
        aperture,
        shutterSpeed,
        cameraInfo: cameraInfoParts.join(' · ') || null,
        gps,
        location: null
      }
      
      // 如果有 GPS，调用后端 API 获取地址（API Key 在后端配置）
      if (gps) {
        try {
          const geoRes = await fetch(`${API_BASE}/geocode?lat=${gps.lat}&lng=${gps.lng}`).then(r => r.json())
          if (geoRes.location) {
            uploadForm.value.exifInfo.location = geoRes.location
          }
        } catch (e) {
          console.warn('地理编码失败:', e)
        }
      }
    }
  } catch (e) {
    console.warn('EXIF读取失败:', e)
  }
}

function handleFileRemove() {
  if (uploadForm.value.previewUrl) {
    URL.revokeObjectURL(uploadForm.value.previewUrl)
  }
  uploadForm.value.file = null
  uploadForm.value.previewUrl = null
  uploadForm.value.exifInfo = null
}

// 移除已选图片
function removeImage() {
  handleFileRemove()
}

// 提交上传
async function submitUpload() {
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择图片')
    return
  }
  if (!uploadForm.value.title || !uploadForm.value.category) {
    ElMessage.warning('请填写标题和分类')
    return
  }

  uploading.value = true
  try {
    // 上传图片
    const formData = new FormData()
    formData.append('image', uploadForm.value.file)
    
    const uploadRes = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json())

    if (!uploadRes.success) {
      throw new Error(uploadRes.error)
    }

    // 构建新图片数据
    const exifInfo = uploadForm.value.exifInfo
    const newPhoto = {
      thumbnail: uploadRes.thumbnail,
      image_src: uploadRes.original,
      title: uploadForm.value.title,
      category: uploadForm.value.category,
      describe: uploadForm.value.describe || '',
      model: exifInfo?.model || '',
      focal_length: exifInfo?.focalLength || '',
      aperture: exifInfo?.aperture || '',
      shutter_speed: exifInfo?.shutterSpeed || '',
      location: exifInfo?.location || '',
      width: uploadRes.width || 0,
      height: uploadRes.height || 0
    }

    // 添加到列表
    photos.value.unshift(newPhoto)
    await fetch(`${API_BASE}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photos.value)
    })

    ElMessage.success('上传成功')
    showUploadDialog.value = false
    resetUploadForm()
  } catch (e) {
    ElMessage.error('上传失败: ' + e.message)
  }
  uploading.value = false
}

function resetUploadForm() {
  if (uploadForm.value.previewUrl) {
    URL.revokeObjectURL(uploadForm.value.previewUrl)
  }
  uploadForm.value = { file: null, previewUrl: null, title: '', category: '', describe: '', exifInfo: null }
  uploadRef.value?.clearFiles()
}

// 编辑图片
function editPhoto(photo) {
  editForm.value = { ...photo }
  editIndex.value = photos.value.findIndex(p => p.image_src === photo.image_src)
  showEditDialog.value = true
}

async function saveEdit() {
  photos.value[editIndex.value] = { ...editForm.value }
  try {
    await fetch(`${API_BASE}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photos.value)
    })
    ElMessage.success('保存成功')
    showEditDialog.value = false
  } catch (e) {
    ElMessage.error('保存失败: ' + e.message)
  }
}

// 删除图片
async function deletePhoto(photo) {
  try {
    await ElMessageBox.confirm('确定删除这张图片吗？此操作将同时删除图片文件，不可恢复', '删除确认', { 
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    const index = photos.value.findIndex(p => p.image_src === photo.image_src)
    if (index > -1) {
      // 调用 DELETE API，后端会同时删除图片文件
      const res = await fetch(`${API_BASE}/photos/${index}`, {
        method: 'DELETE'
      }).then(r => r.json())
      
      if (res.success) {
        photos.value.splice(index, 1)
        ElMessage.success('删除成功')
      } else {
        throw new Error(res.error || '删除失败')
      }
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败: ' + e.message)
    }
  }
}

onMounted(loadData)
</script>

<style scoped>
.photos-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-bar {
  border-radius: 8px;
}

.action-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  gap: 12px;
}

.wrap-cell {
  word-break: break-word;
  white-space: normal;
  line-height: 1.5;
  font-size: 13px;
  color: #606266;
}

.table-card {
  border-radius: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.thumb-img {
  width: 100px;
  height: 70px;
  border-radius: 6px;
  overflow: hidden;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 24px;
}

.upload-wrapper {
  width: 100%;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: 15px 0;
}

.upload-area :deep(.el-icon--upload) {
  font-size: 36px;
  margin-bottom: 6px;
}

.upload-area :deep(.el-upload__text) {
  font-size: 13px;
}

.image-preview {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 10px;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 15px;
}

.preview-img {
  width: 120px;
  height: 80px;
  border-radius: 4px;
  object-fit: contain;
}

.preview-actions {
  display: flex;
  align-items: center;
}

.exif-preview {
  width: 100%;
  padding: 6px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.exif-row {
  display: flex;
  gap: 8px;
}

.exif-item {
  background: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.exif-item.flex-1 {
  flex: 1;
}

.exif-item.flex-2 {
  flex: 2;
}

.exif-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.exif-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.loading-text {
  color: #409eff;
  font-size: 13px;
}

.no-data {
  color: #c0c4cc;
}

.edit-images-preview {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.preview-item {
  flex: 1;
  text-align: center;
}

.preview-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.preview-img {
  width: 100%;
  height: 120px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  cursor: pointer;
  background: #f5f7fa;
}

.preview-img :deep(img) {
  object-fit: contain !important;
}

.preview-empty,
.preview-error {
  width: 100%;
  height: 120px;
  border-radius: 6px;
  border: 1px dashed #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 13px;
  background: #fafafa;
}


</style>


