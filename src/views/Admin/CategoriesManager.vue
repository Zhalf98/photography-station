<template>
  <div class="categories-manager">
    <!-- 顶部操作栏 -->
    <el-card class="action-bar" shadow="never">
      <div class="action-bar-content">
        <div class="action-left">
          <span class="total-text">共 {{ categories.length }} 个分类</span>
        </div>
        <div class="action-right">
          <el-button type="primary" :icon="Plus" @click="addCategory">
            添加分类
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 分类卡片列表 -->
    <div class="category-grid">
      <el-card 
        v-for="(cat, index) in categories" 
        :key="cat.id" 
        class="category-card"
        shadow="hover"
      >
        <div class="card-header">
          <div class="card-icon">
            <Icon :icon="cat.icon" width="32" />
          </div>
          <div class="card-info">
            <div class="card-name">{{ cat.name }}</div>
            <div class="card-id">ID: {{ cat.id }}</div>
          </div>
          <el-dropdown trigger="click">
            <el-button :icon="MoreFilled" circle size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="Edit" @click="editCategory(cat, index)">编辑</el-dropdown-item>
                <el-dropdown-item :icon="Delete" @click="deleteCategory(index)" divided>
                  <span style="color: #f56c6c">删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="card-desc">{{ cat.description || '暂无描述' }}</div>
        <div class="card-footer">
          <el-tag v-if="getPhotoCount(cat.name) > 0" type="info" size="small">
            {{ getPhotoCount(cat.name) }} 张图片
          </el-tag>
          <el-tag v-else type="info" size="small" effect="plain">
            暂无图片
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="categories.length === 0" description="暂无分类，点击上方按钮添加" />

    <!-- 编辑/添加对话框 -->
    <el-dialog 
      v-model="showDialog" 
      :title="isEdit ? '编辑分类' : '添加分类'" 
      :width="isMobile ? '100%' : '500px'"
      :fullscreen="isMobile"
      @closed="resetForm"
    >
      <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
        <el-form-item label="ID" prop="id">
          <el-input 
            v-model="form.id" 
            placeholder="唯一标识，如: landscape" 
            :disabled="isEdit"
          />
          <div class="form-tip">用于内部标识，创建后不可修改</div>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="显示名称，如: 风景" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="mdi:image" />
          <div class="form-tip">
            Iconify 图标名称，如: mdi:image
            <a href="https://icon-sets.iconify.design/" target="_blank" class="icon-link" style="margin-left: 8px;">
              查找图标 →
            </a>
          </div>
          <div class="icon-preview" v-if="form.icon">
            <span>预览:</span>
            <Icon :icon="form.icon" width="24" />
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="分类描述（可选）" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Edit, Delete, MoreFilled } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = '/api'

const loading = ref(false)
const categories = ref([])
const photos = ref([])
const showDialog = ref(false)
const isEdit = ref(false)
const editIndex = ref(-1)
const formRef = ref(null)
const isMobile = ref(window.innerWidth <= 768)

const form = ref({
  id: '',
  name: '',
  icon: 'mdi:image',
  description: ''
})

const rules = {
  id: [{ required: true, message: '请输入ID', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const [categoriesRes, photosRes] = await Promise.all([
      fetch(`${API_BASE}/categories`).then(r => r.json()),
      fetch(`${API_BASE}/photos`).then(r => r.json())
    ])
    categories.value = categoriesRes
    photos.value = photosRes
  } catch (e) {
    ElMessage.error('加载数据失败: ' + e.message)
  }
  loading.value = false
}

// 获取分类下的图片数量
function getPhotoCount(categoryName) {
  return photos.value.filter(p => p.category === categoryName).length
}

// 重置表单
function resetForm() {
  form.value = { id: '', name: '', icon: 'mdi:image', description: '' }
  isEdit.value = false
}

// 添加分类
function addCategory() {
  isEdit.value = false
  form.value = { id: '', name: '', icon: 'mdi:image', description: '' }
  showDialog.value = true
  isMobile.value = window.innerWidth <= 768
}

// 编辑分类
function editCategory(category, index) {
  isEdit.value = true
  editIndex.value = index
  form.value = { ...category }
  showDialog.value = true
  isMobile.value = window.innerWidth <= 768
}

// 保存分类
async function saveCategory() {
  if (!form.value.id || !form.value.name) {
    ElMessage.warning('请填写ID和名称')
    return
  }

  if (isEdit.value) {
    categories.value[editIndex.value] = { ...form.value }
  } else {
    // 检查ID是否重复
    if (categories.value.some(c => c.id === form.value.id)) {
      ElMessage.warning('ID已存在，请使用其他ID')
      return
    }
    categories.value.push({ ...form.value })
  }

  try {
    await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categories.value)
    })
    ElMessage.success('保存成功')
    showDialog.value = false
  } catch (e) {
    ElMessage.error('保存失败: ' + e.message)
  }
}

// 删除分类
async function deleteCategory(index) {
  const category = categories.value[index]
  const count = getPhotoCount(category.name)
  
  if (count > 0) {
    ElMessage.warning(`该分类下还有 ${count} 张图片，请先移除或更改图片分类`)
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定删除分类「${category.name}」吗？`, 
      '删除确认', 
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
    categories.value.splice(index, 1)
    await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categories.value)
    })
    ElMessage.success('删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败: ' + e.message)
    }
  }
}

onMounted(loadData)
</script>

<style scoped>
.categories-manager {
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
}

.total-text {
  color: var(--admin-text-secondary);
  font-size: 14px;
  font-weight: 500;
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

/* 分类卡片网格 */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.category-card {
  border-radius: 16px;
  border: 1px solid var(--admin-border);
  box-shadow: var(--admin-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--admin-card-bg);
}

.category-card:hover {
  box-shadow: var(--admin-shadow-hover);
  transform: translateY(-4px);
  border-color: var(--primary-color);
}

.category-card :deep(.el-card__body) {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.card-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
}

.category-card:hover .card-icon {
  transform: scale(1.05) rotate(5deg);
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--admin-text-primary);
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}

.card-id {
  font-size: 12px;
  color: var(--admin-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 下拉菜单按钮 */
.card-header :deep(.el-button) {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--admin-border);
  background: transparent;
  color: var(--admin-text-secondary);
  transition: all 0.25s ease;
}

.card-header :deep(.el-button:hover) {
  background: var(--admin-hover-bg);
  border-color: var(--admin-text-secondary);
  color: var(--admin-text-primary);
  transform: scale(1.1);
}

.card-desc {
  font-size: 14px;
  color: var(--admin-text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
}

.card-footer {
  padding-top: 16px;
  border-top: 1px solid var(--admin-border);
}

.card-footer :deep(.el-tag) {
  border-radius: 8px;
  border: none;
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
  padding: 6px 12px;
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

:deep(.el-input__wrapper.is-disabled) {
  background: var(--admin-hover-bg);
  cursor: not-allowed;
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

.form-tip {
  font-size: 12px;
  color: var(--admin-text-secondary);
  margin-top: 6px;
  line-height: 1.5;
}

.icon-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.25s ease;
}

.icon-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--admin-bg);
  border-radius: 10px;
  border: 1px solid var(--admin-border);
  font-size: 14px;
  color: var(--admin-text-secondary);
  font-weight: 500;
}

.icon-preview :deep(.iconify) {
  color: var(--primary-color);
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  border-radius: 12px;
  border: 1px solid var(--admin-border);
  box-shadow: var(--admin-shadow-hover);
  background: var(--admin-card-bg);
  padding: 8px;
}

:deep(.el-dropdown-menu__item) {
  border-radius: 8px;
  color: var(--admin-text-primary);
  padding: 10px 16px;
  font-size: 14px;
  transition: all 0.2s ease;
}

:deep(.el-dropdown-menu__item:hover) {
  background: var(--admin-hover-bg);
  color: var(--primary-color);
}

:deep(.el-dropdown-menu__item.is-divided) {
  margin-top: 8px;
  border-top: 1px solid var(--admin-border);
  padding-top: 16px;
}

/* 空状态 */
:deep(.el-empty) {
  padding: 60px 0;
}

:deep(.el-empty__description) {
  color: var(--admin-text-secondary);
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .el-dialog :deep(.el-form-item__label) {
    float: none !important;
    display: block !important;
    width: 100% !important;
    text-align: left !important;
    margin-bottom: 8px !important;
    line-height: 1.5 !important;
  }
  
  .el-dialog :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100% !important;
  }
  
  .category-grid {
    grid-template-columns: 1fr;
  }
  
  .action-bar-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .action-right {
    width: 100%;
  }
  
  .action-right :deep(.el-button) {
    width: 100%;
  }
}
</style>
