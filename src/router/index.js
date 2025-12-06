import { createRouter, createWebHistory } from 'vue-router'

// 基础路由
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home/index.vue')
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('../views/Gallery/index.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About/index.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound/index.vue')
  }
]

// 开发环境才添加 admin 路由
if (import.meta.env.DEV) {
  routes.splice(3, 0, {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin/index.vue'),
    meta: { hideLayout: true }
  })
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router

