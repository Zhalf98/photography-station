<template>
  <div class="settings-manager">
    <div class="settings-card">
      <h3 class="section-title">
        <el-icon><Lock /></el-icon>
        修改密码
      </h3>
      <el-form :model="passwordForm" label-width="100px" class="settings-form">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password placeholder="输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="至少4位" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword" :loading="pwdLoading">修改密码</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="settings-card">
      <h3 class="section-title">
        <el-icon><Setting /></el-icon>
        后台路径
      </h3>
      <p class="hint">修改后刷新页面即可生效。当前路径：<code>/{{ currentPath }}</code></p>
      <el-form :model="pathForm" label-width="100px" class="settings-form">
        <el-form-item label="新路径">
          <el-input v-model="pathForm.newPath" placeholder="例如: my-admin">
            <template #prepend>/</template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePath" :loading="pathLoading">修改路径</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="pathChanged" type="warning" :closable="false" show-icon style="margin-top: 12px;">
        路径已改为 /{{ pathChanged }}，刷新页面即可生效。
      </el-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Setting } from '@element-plus/icons-vue'

const token = localStorage.getItem('admin_token')
const currentPath = ref('admin')
const pathChanged = ref(null)
const pwdLoading = ref(false)
const pathLoading = ref(false)
const buildLoading = ref(false)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pathForm = ref({
  newPath: ''
})

const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}

onMounted(async () => {
  try {
    const res = await fetch('/api/settings', { headers: authHeaders })
    const data = await res.json()
    if (data.adminPath) currentPath.value = data.adminPath
  } catch {}
})

const changePassword = async () => {
  const { currentPassword, newPassword, confirmPassword } = passwordForm.value
  if (!currentPassword || !newPassword) return ElMessage.warning('请填写完整')
  if (newPassword !== confirmPassword) return ElMessage.warning('两次密码不一致')
  if (newPassword.length < 4) return ElMessage.warning('新密码至少4位')
  
  pwdLoading.value = true
  try {
    const res = await fetch('/api/settings/password', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ currentPassword, newPassword })
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('密码已更新，下次登录生效')
      passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      ElMessage.error(data.error || '修改失败')
    }
  } catch (e) {
    ElMessage.error('请求失败')
  } finally {
    pwdLoading.value = false
  }
}

const changePath = async () => {
  const { newPath } = pathForm.value
  if (!newPath) return ElMessage.warning('请输入新路径')
  if (!/^[a-zA-Z0-9_-]+$/.test(newPath)) return ElMessage.warning('路径只能包含字母、数字、下划线和连字符')
  
  pathLoading.value = true
  try {
    const res = await fetch('/api/settings/admin-path', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ adminPath: newPath })
    })
    const data = await res.json()
    if (data.success) {
      currentPath.value = newPath
      pathChanged.value = newPath
      ElMessage.success(data.message)
      pathForm.value.newPath = ''
    } else {
      ElMessage.error(data.error || '修改失败')
    }
  } catch (e) {
    ElMessage.error('请求失败')
  } finally {
    pathLoading.value = false
  }
}

const rebuildFrontend = async () => {
  buildLoading.value = true
  ElMessage.info('正在构建，请稍候...')
  // 前端无法直接触发构建，提示用户手动操作或调用后端接口
  buildLoading.value = false
  ElMessage.warning('请联系管理员在服务器执行 npm run build 并重启服务')
}
</script>

<style scoped>
.settings-manager { display: flex; flex-direction: column; gap: 20px; }
.settings-card { background: var(--admin-card-bg); border-radius: 16px; padding: 24px; border: 1px solid var(--admin-border); }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; color: var(--admin-text-primary); margin-bottom: 20px; }
.section-title .el-icon { color: var(--primary-color); font-size: 20px; }
.settings-form { max-width: 480px; }
.hint { font-size: 13px; color: var(--admin-text-secondary); margin-bottom: 16px; }
.hint code { background: var(--admin-bg); padding: 2px 8px; border-radius: 4px; font-family: monospace; color: var(--primary-color); }
</style>
