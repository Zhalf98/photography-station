<template>
  <div class="admin-layout">
    <!-- 左侧导航 -->
    <aside class="admin-sidebar">
      <div class="sidebar-logo">
        <el-icon class="logo-icon"><Camera /></el-icon>
        <span class="logo-text">图片管理系统</span>
      </div>
      <nav class="sidebar-menu">
        <div 
          class="menu-item" 
          :class="{ active: activeMenu === 'photos' }"
          @click="activeMenu = 'photos'"
        >
          <el-icon><Picture /></el-icon>
          <span>图片管理</span>
        </div>
        <div 
          class="menu-item" 
          :class="{ active: activeMenu === 'categories' }"
          @click="activeMenu = 'categories'"
        >
          <el-icon><Folder /></el-icon>
          <span>分类管理</span>
        </div>
      </nav>
      <div class="sidebar-footer">
        <a href="/" target="_blank" class="back-link">
          <el-icon><House /></el-icon>
          <span>返回前台</span>
        </a>
      </div>
    </aside>

    <!-- 右侧内容 -->
    <div class="admin-content">
      <header class="content-header">
        <h2 class="header-title">{{ menuTitles[activeMenu] }}</h2>
        <el-tag type="success" size="small">本地开发模式</el-tag>
      </header>
      <main class="content-main">
        <PhotosManager v-if="activeMenu === 'photos'" />
        <CategoriesManager v-else-if="activeMenu === 'categories'" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Picture, Folder, House, Camera } from '@element-plus/icons-vue'
import PhotosManager from './PhotosManager.vue'
import CategoriesManager from './CategoriesManager.vue'

const activeMenu = ref('photos')

const menuTitles = {
  photos: '图片管理',
  categories: '分类管理'
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
}

/* 左侧导航 */
.admin-sidebar {
  width: 220px;
  background: #1d1e1f;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid #2d2e2f;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 22px;
  color: #409eff;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

.sidebar-menu {
  flex: 1;
  padding: 10px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  color: #a3a6ad;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  line-height: 1;
}

.menu-item .el-icon {
  font-size: 18px;
}

.menu-item:hover {
  background: #2d2e2f;
  color: #fff;
}

.menu-item.active {
  background: #409eff;
  color: #fff;
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid #2d2e2f;
  flex-shrink: 0;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a3a6ad;
  text-decoration: none;
  font-size: 14px;
  padding: 10px;
  border-radius: 6px;
  transition: all 0.2s;
  line-height: 1;
}

.back-link .el-icon {
  font-size: 16px;
}

.back-link:hover {
  background: #2d2e2f;
  color: #fff;
}

/* 右侧内容 */
.admin-content {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-header {
  height: 60px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.content-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
