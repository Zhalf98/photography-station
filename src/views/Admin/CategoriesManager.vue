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
          <el-tag type="info" size="small">{{ getPhotoCount(cat.name) }} 张图片</el-tag>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="categories.length === 0" description="暂无分类，点击上方按钮添加" />

    <!-- 编辑/添加对话框 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑分类' : '添加分类'" width="500px" @closed="resetForm">
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
          <el-input v-model="form.icon" placeholder="Iconify图标，如: mdi:image">
            <template #append>
              <a href="https://icon-sets.iconify.design/" target="_blank" class="icon-link">
                查找图标
              </a>
            </template>
          </el-input>
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
}

// 编辑分类
function editCategory(category, index) {
  isEdit.value = true
  editIndex.value = index
  form.value = { ...category }
  showDialog.value = true
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

.total-text {
  color: #606266;
  font-size: 14px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.category-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.card-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.card-info {
  flex: 1;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-id {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.card-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.icon-link {
  color: #409eff;
  text-decoration: none;
  font-size: 12px;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}
</style>
