<template>
  <div class="modern-admin">
    <!-- 未登录显示登录页 -->
    <Login v-if="!isAuthenticated" @login="onLogin" />
    
    <!-- 已登录显示管理页面 -->
    <template v-else>
      <header class="admin-header">
        <div class="header-left">
          <div class="logo-section">
            <el-icon class="logo-icon"><Camera /></el-icon>
            <span class="logo-text">摄影站管理后台</span>
          </div>
        </div>
        
        <div class="header-center">
          <div class="tab-nav">
            <div 
              class="tab-item" 
              :class="{ active: activeMenu === 'photos' }"
              @click="activeMenu = 'photos'"
            >
              <el-icon><Picture /></el-icon>
              <span>图片管理</span>
            </div>
            <div 
              class="tab-item" 
              :class="{ active: activeMenu === 'categories' }"
              @click="activeMenu = 'categories'"
            >
              <el-icon><Folder /></el-icon>
              <span>分类管理</span>
            </div>
            <div 
              class="tab-item" 
              :class="{ active: activeMenu === 'settings' }"
              @click="activeMenu = 'settings'"
            >
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <button @click="toggleTheme" class="theme-toggle">
            <el-icon v-if="isDark"><Sunny /></el-icon>
            <el-icon v-else><Moon /></el-icon>
          </button>
          <a href="/" target="_blank" class="back-btn">
            <el-icon><House /></el-icon>
            <span>返回前台</span>
          </a>
          <button @click="handleLogout" class="back-btn" style="color: var(--error-color);">
            <el-icon><SwitchButton /></el-icon>
            <span>退出</span>
          </button>
        </div>
      </header>

      <main class="admin-main">
        <div class="content-wrapper">
          <PhotosManager v-if="activeMenu === 'photos'" :token="authToken" />
          <CategoriesManager v-else-if="activeMenu === 'categories'" :token="authToken" />
          <SettingsManager v-else-if="activeMenu === 'settings'" />
        </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { Picture, Folder, House, Camera, Sunny, Moon, SwitchButton, Setting } from '@element-plus/icons-vue'
import PhotosManager from './PhotosManager.vue'
import CategoriesManager from './CategoriesManager.vue'
import SettingsManager from './SettingsManager.vue'
import Login from './Login.vue'

const activeMenu = ref('photos')
const isDark = ref(false)
const isAuthenticated = ref(false)
const authToken = ref(null)

const onLogin = (token) => {
  isAuthenticated.value = true
  authToken.value = token
}

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  isAuthenticated.value = false
  authToken.value = null
}

// 提供token给子组件
provide('authToken', authToken)

onMounted(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const savedTheme = localStorage.getItem('adminTheme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = prefersDark
  }
  applyTheme()

  // 检查登录状态
  const token = localStorage.getItem('admin_token')
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 > Date.now()) {
        isAuthenticated.value = true
        authToken.value = token
      } else {
        localStorage.removeItem('admin_token')
      }
    } catch {
      localStorage.removeItem('admin_token')
    }
  }
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('adminTheme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('admin-dark')
  } else {
    document.documentElement.classList.remove('admin-dark')
  }
}
</script>

<style>
/* 全局样式 - 不加 scoped */
:root {
  --primary-color: #007aff;
  --primary-hover: #0051d5;
  --primary-active: #004fc6;
  --primary-light: rgba(0, 122, 255, 0.1);
  --success-color: #34c759;
  --warning-color: #ff9500;
  --error-color: #ff3b30;
  --admin-bg: #f5f5f7;
  --admin-card-bg: #ffffff;
  --admin-text-primary: #1d1d1f;
  --admin-text-secondary: #86868b;
  --admin-border: #d2d2d7;
  --admin-hover-bg: rgba(0, 0, 0, 0.04);
  --admin-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --admin-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.12);
}

:root.admin-dark {
  --admin-bg: #000000;
  --admin-card-bg: #1c1c1e;
  --admin-text-primary: #f5f5f7;
  --admin-text-secondary: #98989d;
  --admin-border: #38383a;
  --admin-hover-bg: rgba(255, 255, 255, 0.08);
  --admin-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --admin-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.admin-dark .el-select-dropdown { background: #1c1c1e !important; border-color: #38383a !important; }
.admin-dark .el-select-dropdown__item { color: #f5f5f7 !important; }
.admin-dark .el-select-dropdown__item:hover { background: rgba(255, 255, 255, 0.08) !important; }
.admin-dark .el-select-dropdown__item.is-selected { color: #007aff !important; background: rgba(0, 122, 255, 0.1) !important; }
.admin-dark .el-popper { background: #1c1c1e !important; border-color: #38383a !important; }
.admin-dark .el-select .el-input__wrapper { background: #000000 !important; border-color: #38383a !important; }
.admin-dark .el-select .el-input__inner { color: #f5f5f7 !important; }
.admin-dark .el-select .el-input__suffix { color: #98989d !important; }
.admin-dark .el-select .el-select__placeholder { color: #98989d !important; }
.admin-dark .el-input__wrapper { background: #000000 !important; border-color: #38383a !important; }
.admin-dark .el-input__inner { color: #f5f5f7 !important; }
.admin-dark .el-input__prefix, .admin-dark .el-input__suffix { color: #98989d !important; }
.admin-dark .el-textarea__inner { background: #000000 !important; border-color: #38383a !important; color: #f5f5f7 !important; }
.admin-dark .el-select__wrapper { background: #000000 !important; border-color: #38383a !important; }
.admin-dark .el-pagination__total, .admin-dark .el-pagination__jump { color: #98989d !important; }
.admin-dark .el-pagination .el-input__wrapper { background: #000000 !important; border-color: #38383a !important; }
.admin-dark .el-pagination .el-select__wrapper { background: #000000 !important; border-color: #38383a !important; }
.admin-dark .el-dropdown-menu { background: #1c1c1e !important; border-color: #38383a !important; }
.admin-dark .el-dropdown-menu__item { color: #f5f5f7 !important; }
.admin-dark .el-dropdown-menu__item:hover { background: rgba(255, 255, 255, 0.08) !important; color: #007aff !important; }
.admin-dark .el-dropdown-menu__item--divided { border-top-color: #38383a !important; }
.admin-dark .el-input-group__append { background: #1c1c1e !important; border-color: #38383a !important; color: #007aff !important; box-shadow: none !important; }
.admin-dark .el-input-group__append:hover { background: rgba(255, 255, 255, 0.08) !important; }
.admin-dark .el-input-group > .el-input__wrapper { border-right: none !important; }
.admin-dark .el-input-group__append { border-left: none !important; }
.admin-dark .el-empty__description { color: #98989d !important; }
.admin-dark .el-empty__image svg { fill: #98989d !important; }
.admin-dark .el-image-viewer__wrapper { background: rgba(0, 0, 0, 0.9) !important; }
.admin-dark .el-image-viewer__mask { background: rgba(0, 0, 0, 0.9) !important; }
.admin-dark .el-image-viewer__btn { background: rgba(28, 28, 30, 0.8) !important; color: #f5f5f7 !important; }
.admin-dark .el-image-viewer__close { color: #f5f5f7 !important; }
</style>

<style scoped>
.modern-admin { min-height: 100vh; background: var(--admin-bg); display: flex; flex-direction: column; transition: background 0.3s ease; }
.admin-header { height: 64px; background: var(--admin-card-bg); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; position: sticky; top: 0; z-index: 100; transition: all 0.3s ease; }
:root.admin-dark .admin-header { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
.header-left { flex: 1; }
.logo-section { display: flex; align-items: center; gap: 12px; }
.logo-icon { font-size: 28px; color: var(--primary-color); }
.logo-text { font-size: 18px; font-weight: 700; color: var(--admin-text-primary); letter-spacing: -0.5px; }
.header-center { flex: 0 0 auto; }
.tab-nav { display: flex; gap: 8px; background: var(--admin-bg); padding: 4px; border-radius: 12px; transition: background 0.3s ease; }
.tab-item { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 15px; font-weight: 500; color: var(--admin-text-secondary); cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; }
.tab-item .el-icon { font-size: 18px; }
.tab-item:hover { color: var(--admin-text-primary); background: var(--admin-hover-bg); }
.tab-item.active { background: rgba(0, 122, 255, 0.12) !important; color: var(--primary-color) !important; box-shadow: none; }
.tab-item.active span, .tab-item.active .el-icon { color: var(--primary-color) !important; }
.header-right { flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
.theme-toggle { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid var(--admin-border); background: transparent; color: var(--admin-text-secondary); cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); font-size: 18px; }
.theme-toggle:hover { color: var(--admin-text-primary); border-color: var(--admin-text-secondary); transform: translateY(-2px) rotate(15deg); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
:root.admin-dark .theme-toggle:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
.back-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; color: var(--admin-text-secondary); text-decoration: none; border: 1px solid var(--admin-border); background: transparent; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.back-btn .el-icon { font-size: 16px; }
.back-btn:hover { color: var(--admin-text-primary); border-color: var(--admin-text-secondary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
:root.admin-dark .back-btn:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
.admin-main { flex: 1; padding: 24px 32px; overflow-y: auto; }
.content-wrapper { max-width: 1400px; margin: 0 auto; }

:deep(.el-card) { background: var(--admin-card-bg); border-color: var(--admin-border); color: var(--admin-text-primary); }
:deep(.el-input__inner) { color: var(--admin-text-primary); background: var(--admin-bg); }
:deep(.el-table) { background: var(--admin-card-bg) !important; color: var(--admin-text-primary) !important; }
:deep(.el-table tr) { background: var(--admin-card-bg) !important; }
:deep(.el-table th.el-table__cell) { background: var(--admin-bg) !important; color: var(--admin-text-secondary) !important; }
:deep(.el-table td.el-table__cell) { background: var(--admin-card-bg) !important; color: var(--admin-text-primary) !important; border-color: var(--admin-border) !important; }
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) { background: var(--admin-bg) !important; }
:deep(.el-table__body tr:hover > td) { background: var(--admin-hover-bg) !important; }
:deep(.el-table__empty-block) { background: var(--admin-card-bg) !important; }
:deep(.el-table__empty-text) { color: var(--admin-text-secondary) !important; }
:deep(.el-select-dropdown) { background: var(--admin-card-bg) !important; border-color: var(--admin-border) !important; border-radius: 12px; box-shadow: var(--admin-shadow-hover); }
:deep(.el-select-dropdown__item) { color: var(--admin-text-primary) !important; }
:deep(.el-select-dropdown__item:hover) { background: var(--admin-hover-bg) !important; }
:deep(.el-select-dropdown__item.selected) { color: var(--primary-color) !important; font-weight: 600; }
:deep(.el-select-dropdown__item.is-selected) { color: var(--primary-color) !important; font-weight: 600; background: var(--primary-light) !important; }
:deep(.el-popper) { background: var(--admin-card-bg); border-color: var(--admin-border); }
:deep(.el-message-box) { background: var(--admin-card-bg); border-color: var(--admin-border); border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
:deep(.el-message-box__title) { color: var(--admin-text-primary); }
:deep(.el-message-box__content) { color: var(--admin-text-secondary); }
:deep(.el-message-box__btns .el-button) { border-radius: 10px; font-weight: 500; }
:deep(.el-message-box__btns .el-button--primary) { background: var(--primary-color); border: none; }
:deep(.el-message-box__btns .el-button--primary:hover) { background: var(--primary-hover); }
:deep(.el-loading-mask) { background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); }
:deep(.el-pagination) { color: var(--admin-text-primary); }
:deep(.el-pagination button) { background: var(--admin-card-bg) !important; color: var(--admin-text-secondary) !important; }
:deep(.el-pagination button:hover) { color: var(--primary-color) !important; }
:deep(.el-pager li) { background: var(--admin-card-bg) !important; color: var(--admin-text-secondary) !important; }
:deep(.el-pager li:hover) { color: var(--primary-color) !important; }
:deep(.el-pager li.is-active) { background: var(--primary-color) !important; color: #ffffff !important; }
:deep(.el-dialog) { background: var(--admin-card-bg) !important; border: 1px solid var(--admin-border); }
:deep(.el-dialog__header) { background: var(--admin-card-bg); border-bottom-color: var(--admin-border); }
:deep(.el-dialog__title) { color: var(--admin-text-primary); }
:deep(.el-dialog__body) { background: var(--admin-card-bg); color: var(--admin-text-primary); }
:deep(.el-dialog__footer) { background: var(--admin-card-bg); border-top-color: var(--admin-border); }
:deep(.el-form-item__label) { color: var(--admin-text-secondary); }
:deep(.el-input__wrapper) { background: var(--admin-bg) !important; border-color: var(--admin-border) !important; box-shadow: none !important; }
:deep(.el-input__inner) { color: var(--admin-text-primary) !important; background: transparent !important; }
:deep(.el-input__wrapper.is-focus) { border-color: var(--primary-color) !important; box-shadow: 0 0 0 4px var(--primary-light) !important; }
:deep(.el-textarea__inner) { background: var(--admin-bg) !important; border-color: var(--admin-border) !important; color: var(--admin-text-primary) !important; }
:deep(.el-textarea__inner:focus) { border-color: var(--primary-color) !important; box-shadow: 0 0 0 4px var(--primary-light) !important; }
:deep(.el-select .el-input__wrapper) { background: var(--admin-bg) !important; }
:deep(.el-select .el-input__inner) { color: var(--admin-text-primary) !important; }
:deep(.el-divider) { border-color: var(--admin-border); }
:deep(.el-divider__text) { background: var(--admin-card-bg); color: var(--admin-text-secondary); }
:deep(.el-button) { border-color: var(--admin-border); }
:deep(.el-button--default) { background: var(--admin-bg); color: var(--admin-text-primary); border-color: var(--admin-border); }
:deep(.el-button--default:hover) { background: var(--admin-hover-bg); border-color: var(--admin-text-secondary); }

@media (max-width: 1024px) {
  .admin-header { padding: 0 20px; }
  .logo-text { display: none; }
  .admin-main { padding: 20px; }
}
@media (max-width: 768px) {
  .admin-header { padding: 0 12px; gap: 0; justify-content: space-between; }
  .header-left { flex: 0 0 auto; width: 60px; }
  .header-center { flex: 1; display: flex; justify-content: center; align-items: center; }
  .header-right { flex: 0 0 auto; gap: 8px; width: auto; min-width: 108px; justify-content: flex-end; }
  .tab-nav { width: auto; gap: 6px; }
  .tab-item { padding: 10px 12px; }
  .tab-item span { display: none; }
  .theme-toggle { width: 44px; height: 44px; }
  .back-btn { padding: 10px 12px; }
  .back-btn span { display: none; }
  .admin-main { padding: 16px; }
}
</style>
