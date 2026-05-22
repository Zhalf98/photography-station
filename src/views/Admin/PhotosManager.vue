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
              :preview-src-list="[row.image_src]"
              :preview-teleported="true"
              fit="cover"
              class="thumb-img"
              lazy
              style="cursor: pointer;"
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
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <el-tag v-if="row.is_live_photo" type="success" size="small">
                Live
              </el-tag>
              <el-tag v-if="row.is_hdr" type="warning" size="small">
                HDR
              </el-tag>
            </div>
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

    <!-- 上传对话框（支持 Live Photo） -->
    <LivePhotoUpload
      v-model="showUploadDialog"
      :categories="categories"
      @success="loadPhotos"
    />

    <!-- 编辑对话框 -->
    <el-dialog 
      v-model="showEditDialog" 
      title="编辑图片" 
      :width="isMobile ? '100%' : '750px'"
      :fullscreen="isMobile"
      align-center
      :top="isMobile ? '0' : '5vh'"
    >
      <el-form :model="editForm" label-width="70px" size="default">
        <!-- 基本信息 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标题">
              <el-input v-model="editForm.title" placeholder="请输入标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="editForm.category" placeholder="选择分类" style="width: 100%">
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
          <el-input v-model="editForm.describe" type="textarea" :rows="3" placeholder="图片描述（可选）" />
        </el-form-item>

        <!-- EXIF 信息卡片 -->
        <el-divider content-position="left" style="margin: 16px 0;">EXIF 信息</el-divider>
        <div class="exif-edit-card">
          <el-row :gutter="12">
            <el-col :span="12">
              <div class="exif-field">
                <label>型号</label>
                <el-input v-model="editForm.model" placeholder="vivo X200 Pro" size="small" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="exif-field">
                <label>地点</label>
                <el-input v-model="editForm.location" placeholder="广东.惠州" size="small" />
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="12" style="margin-top: 8px;">
            <el-col :span="8">
              <div class="exif-field">
                <label>焦距</label>
                <el-input v-model="editForm.focal_length" placeholder="46mm" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="exif-field">
                <label>光圈</label>
                <el-input v-model="editForm.aperture" placeholder="f/1.57" size="small" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="exif-field">
                <label>快门</label>
                <el-input v-model="editForm.shutter_speed" placeholder="1/627s" size="small" />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 图片预览 -->
        <el-divider content-position="left" style="margin: 16px 0;">图片预览</el-divider>
        <div class="edit-preview-grid">
          <!-- 缩略图 -->
          <div class="preview-card">
            <div class="preview-title">缩略图</div>
            <el-image 
              v-if="editForm.thumbnail" 
              :src="editForm.thumbnail" 
              fit="contain" 
              class="preview-image"
              :preview-src-list="[editForm.thumbnail]"
            >
              <template #error>
                <div class="image-error">加载失败</div>
              </template>
            </el-image>
            <div v-else class="image-empty">暂无图片</div>
          </div>

          <!-- 原图 -->
          <div class="preview-card">
            <div class="preview-title">原图</div>
            <el-image 
              v-if="editForm.image_src" 
              :src="editForm.image_src" 
              fit="contain" 
              class="preview-image"
              :preview-src-list="[editForm.image_src]"
            >
              <template #error>
                <div class="image-error">加载失败</div>
              </template>
            </el-image>
            <div v-else class="image-empty">暂无图片</div>
          </div>

          <!-- Live Photo 视频 -->
          <div v-if="editForm.is_live_photo && editForm.live_video" class="preview-card">
            <div class="preview-title">Live Photo 视频</div>
            <div class="video-preview-box">
              <video
                ref="editVideoRef"
                :src="editForm.live_video_h264 || editForm.live_video"
                class="preview-video"
                muted
                loop
                playsinline
                preload="metadata"
              />
              <div class="video-overlay">
                <el-button
                  type="primary"
                  size="small"
                  @mousedown="startEditVideoPreview"
                  @mouseup="stopEditVideoPreview"
                  @mouseleave="stopEditVideoPreview"
                  @touchstart.prevent="startEditVideoPreview"
                  @touchend.prevent="stopEditVideoPreview"
                >
                  {{ isEditVideoPlaying ? '播放中' : '按住预览' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>


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
import { Plus, Search, Delete, Picture, VideoPlay, Sunny } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import LivePhotoUpload from './LivePhotoUpload.vue'
import HDRImageViewer from '@/components/HDRImageViewer.vue'

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
const isMobile = ref(window.innerWidth <= 768)

const editForm = ref({})
const editIndex = ref(-1)
const editVideoRef = ref(null)
const isEditVideoPlaying = ref(false)



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

// 加载照片数据（供上传组件调用）
async function loadPhotos() {
  await loadData()
}

// 编辑图片
function editPhoto(photo) {
  editForm.value = { ...photo }
  editIndex.value = photos.value.findIndex(p => p.image_src === photo.image_src)
  showEditDialog.value = true
  // 检测屏幕尺寸
  isMobile.value = window.innerWidth <= 768
}

// 编辑对话框视频预览
function startEditVideoPreview() {
  const video = editVideoRef.value
  if (!video || isEditVideoPlaying.value) return
  
  isEditVideoPlaying.value = true
  video.currentTime = 0
  video.muted = false
  video.play().catch(err => {
    console.error('播放失败:', err)
    // 降级为静音播放
    video.muted = true
    video.play().catch(() => {
      isEditVideoPlaying.value = false
    })
  })
}

function stopEditVideoPreview() {
  const video = editVideoRef.value
  if (!video || !isEditVideoPlaying.value) return
  
  video.pause()
  video.currentTime = 0
  video.muted = true
  isEditVideoPlaying.value = false
}

async function saveEdit() {
  photos.value[editIndex.value] = { ...editForm.value }
  try {
    await fetch(`${API_BASE}/photos`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${localStorage.getItem("admin_token")}` 
      },
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
      headers: { "Authorization": `Bearer ${localStorage.getItem("admin_token")}` },
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
  gap: 20px;
}

/* 操作栏 */
.action-bar {
  border-radius: 16px;
  border: 1px solid var(--admin-border);
  box-shadow: var(--admin-shadow);
  transition: all 0.3s ease;
}

.action-bar:hover {
  box-shadow: var(--admin-shadow-hover);
}

.action-bar :deep(.el-card__body) {
  padding: 20px 24px;
}

.action-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.action-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Apple 风格输入框 */
.action-left :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: none;
  border: 1px solid var(--admin-border);
  background: var(--admin-bg);
  transition: all 0.25s ease;
}

.action-left :deep(.el-input__inner) {
  color: var(--admin-text-primary);
}

.action-left :deep(.el-input__wrapper:hover) {
  border-color: var(--admin-text-secondary);
}

.action-left :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px var(--primary-light);
}

/* Apple 风格选择器 */
.action-left :deep(.el-select .el-select__wrapper) {
  border-radius: 10px;
  background: var(--admin-bg) !important;
  border: 1px solid var(--admin-border) !important;
  box-shadow: none !important;
}

.action-left :deep(.el-select .el-input__wrapper) {
  border-radius: 10px;
  background: var(--admin-bg) !important;
  border: 1px solid var(--admin-border) !important;
}

.action-left :deep(.el-select .el-input__inner) {
  color: var(--admin-text-primary) !important;
}

.action-left :deep(.el-select .el-select__placeholder) {
  color: var(--admin-text-secondary) !important;
}

.action-left :deep(.el-select .el-input__suffix) {
  color: var(--admin-text-secondary) !important;
}

/* Apple 风格按钮 */
.action-right :deep(.el-button--primary) {
  background: var(--primary-color);
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-right :deep(.el-button--primary:hover) {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.35);
}

.action-right :deep(.el-button--primary:active) {
  transform: translateY(0);
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 20px;
  background: var(--admin-card-bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

:deep(.el-dialog__header) {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--admin-border);
}

:deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: var(--admin-text-primary);
}

:deep(.el-dialog__body) {
  padding: 24px;
  color: var(--admin-text-primary);
}

:deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--admin-border);
}

/* 表单样式 */
:deep(.el-form-item__label) {
  color: var(--admin-text-secondary);
  font-weight: 500;
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: none;
  border: 1px solid var(--admin-border);
  background: var(--admin-bg);
  transition: all 0.25s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--admin-text-secondary);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px var(--primary-light);
}

:deep(.el-textarea__inner) {
  border-radius: 10px;
  border: 1px solid var(--admin-border);
  background: var(--admin-bg);
  color: var(--admin-text-primary);
}

:deep(.el-textarea__inner:hover) {
  border-color: var(--admin-text-secondary);
}

:deep(.el-textarea__inner:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px var(--primary-light);
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 10px;
}

/* 对话框按钮 */
:deep(.el-dialog__footer .el-button) {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  border: none;
}

:deep(.el-dialog__footer .el-button--default) {
  background: var(--admin-bg);
  color: var(--admin-text-primary);
  border: 1px solid var(--admin-border);
}

:deep(.el-dialog__footer .el-button--default:hover) {
  background: var(--admin-hover-bg);
  border-color: var(--admin-text-secondary);
}

:deep(.el-dialog__footer .el-button--primary) {
  background: var(--primary-color);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
}

:deep(.el-dialog__footer .el-button--primary:hover) {
  background: var(--primary-hover);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.35);
}

.wrap-cell {
  word-break: break-word;
  white-space: normal;
  line-height: 1.5;
  font-size: 13px;
  color: var(--admin-text-primary);
}

/* 表格卡片 */
.table-card {
  border-radius: 16px;
  border: 1px solid var(--admin-border);
  box-shadow: var(--admin-shadow);
}

.table-card :deep(.el-card__body) {
  padding: 24px;
}

/* 表格样式优化 */
.table-card :deep(.el-table) {
  background: transparent;
  color: var(--admin-text-primary);
}

.table-card :deep(.el-table th) {
  background: var(--admin-bg);
  color: var(--admin-text-secondary);
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
}

.table-card :deep(.el-table td) {
  border-color: var(--admin-border);
}

.table-card :deep(.el-table__row:hover) {
  background: var(--admin-hover-bg);
}

.table-card :deep(.el-table--striped .el-table__body tr.el-table__row--striped) {
  background: var(--admin-bg);
}

/* 表格按钮 */
.table-card :deep(.el-button--primary) {
  background: var(--primary-color);
  border: none;
  border-radius: 8px;
  font-size: 13px;
  padding: 6px 12px;
}

.table-card :deep(.el-button--primary:hover) {
  background: var(--primary-hover);
}

.table-card :deep(.el-button--danger) {
  background: var(--error-color);
  border: none;
  border-radius: 8px;
  font-size: 13px;
  padding: 6px 12px;
}

.table-card :deep(.el-button--danger:hover) {
  background: #ff2d20;
}

/* Tag 样式 */
.table-card :deep(.el-tag) {
  border-radius: 6px;
  border: none;
  font-weight: 500;
}

.table-card :deep(.el-tag--success) {
  background: rgba(52, 199, 89, 0.15);
  color: var(--success-color);
}

.table-card :deep(.el-tag--warning) {
  background: rgba(255, 149, 0, 0.15);
  color: var(--warning-color);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--admin-border);
}

.pagination-wrap :deep(.el-pagination) {
  --el-pagination-button-bg-color: transparent;
  --el-pagination-hover-color: var(--primary-color);
}

.pagination-wrap :deep(.el-pagination .btn-prev),
.pagination-wrap :deep(.el-pagination .btn-next),
.pagination-wrap :deep(.el-pagination .el-pager li) {
  border-radius: 8px;
  background: transparent;
  color: var(--admin-text-secondary);
  font-weight: 500;
}

.pagination-wrap :deep(.el-pagination .el-select .el-select__wrapper) {
  background: var(--admin-bg) !important;
  border-color: var(--admin-border) !important;
}

.pagination-wrap :deep(.el-pagination .el-select .el-input__inner) {
  color: var(--admin-text-primary) !important;
}

.pagination-wrap :deep(.el-pagination__total),
.pagination-wrap :deep(.el-pagination__jump) {
  color: var(--admin-text-secondary);
}

.pagination-wrap :deep(.el-input__wrapper) {
  background: var(--admin-bg) !important;
  border-color: var(--admin-border) !important;
}

.pagination-wrap :deep(.el-input__inner) {
  color: var(--admin-text-primary) !important;
}

.pagination-wrap :deep(.el-pagination .el-pager li:hover),
.pagination-wrap :deep(.el-pagination .btn-prev:hover),
.pagination-wrap :deep(.el-pagination .btn-next:hover) {
  color: var(--primary-color);
  background: var(--primary-light);
}

.pagination-wrap :deep(.el-pagination .el-pager li.is-active) {
  background: var(--primary-color);
  color: #ffffff;
}

.thumb-img {
  width: 100px;
  height: 70px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.25s ease;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-bg);
  color: var(--admin-text-secondary);
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


.photo-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.photo-tags .el-tag {
  display: flex;
  align-items: center;
}

/* EXIF 编辑卡片 */
.exif-edit-card {
  background: var(--admin-bg);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--admin-border);
}

.exif-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exif-field label {
  color: var(--admin-text-secondary);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 40px;
}

/* 预览网格 */
.edit-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}

.preview-card {
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--admin-card-bg);
  box-shadow: var(--admin-shadow);
  transition: all 0.25s ease;
}

.preview-title {
  padding: 12px 16px;
  background: var(--admin-bg);
  font-size: 13px;
  color: var(--admin-text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--admin-border);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-image {
  width: 100%;
  height: 150px;
  display: block;
  background: var(--admin-bg);
}

.preview-image :deep(.el-image__inner) {
  object-fit: contain !important;
}

.preview-image :deep(img) {
  object-fit: contain !important;
}

.image-empty,
.image-error {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--admin-text-secondary);
  font-size: 13px;
  background: var(--admin-bg);
}

.image-error {
  color: var(--error-color);
}

/* 视频预览 */
.video-preview-box {
  position: relative;
  width: 100%;
  height: 150px;
  background: #000;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.25s ease;
}

.video-overlay:hover {
  background: rgba(0, 0, 0, 0.4);
}

.video-overlay .el-button {
  border-radius: 10px;
  background: var(--primary-color);
  border: none;
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
}

.video-overlay .el-button:hover {
  background: var(--primary-hover);
  transform: scale(1.05);
}

/* 响应式 */
@media (max-width: 768px) {
  .el-dialog :deep(.el-form-item) {
    display: block !important;
  }
  
  .el-dialog :deep(.el-form-item__label) {
    float: none !important;
    display: block !important;
    width: 100% !important;
    text-align: left !important;
    margin-bottom: 8px !important;
    line-height: 1.5 !important;
    padding: 0 !important;
  }
  
  .el-dialog :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100% !important;
    display: block !important;
  }
  
  .el-dialog :deep(.el-row) {
    display: block !important;
    margin: 0 !important;
  }
  
  .el-dialog :deep(.el-col) {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
    padding: 0 !important;
    margin-bottom: 12px !important;
    display: block !important;
  }
  
  .el-dialog :deep(.el-col:last-child) {
    margin-bottom: 0 !important;
  }
  
  .el-dialog :deep(.el-input),
  .el-dialog :deep(.el-select),
  .el-dialog :deep(.el-textarea) {
    width: 100% !important;
  }
  
  .edit-preview-grid {
    grid-template-columns: 1fr !important;
  }
  
  .exif-edit-card {
    padding: 12px !important;
  }
  
  .exif-edit-card :deep(.el-row) {
    display: block !important;
    margin: 0 !important;
  }
  
  .exif-edit-card :deep(.el-col) {
    width: 100% !important;
    max-width: 100% !important;
    display: block !important;
    margin-bottom: 10px !important;
    padding: 0 !important;
  }
  
  .exif-field {
    width: 100% !important;
    display: flex !important;
  }
  
  .exif-field label {
    min-width: 45px !important;
    flex-shrink: 0 !important;
  }
  
  .exif-field :deep(.el-input) {
    flex: 1 !important;
  }
  
  .action-bar-content {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  
  .action-left {
    width: 100% !important;
  }
  
  .action-left :deep(.el-input),
  .action-left :deep(.el-select) {
    width: 100% !important;
  }
  
  .action-right {
    width: 100% !important;
  }
  
  .action-right :deep(.el-button) {
    width: 100% !important;
  }
}
</style>


