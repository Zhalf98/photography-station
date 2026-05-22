import { createRouter, createWebHistory } from 'vue-router'

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

// 动态注册 admin 路由
// 用 Promise 确保路由注册完成后再导航
let adminRouteReady = fetch('/api/admin-path')
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    const adminPath = data?.adminPath || 'admin'
    router.addRoute({
      path: '/' + adminPath,
      name: 'Admin',
      component: () => import('../views/Admin/index.vue'),
      meta: { hideLayout: true }
    })
  })
  .catch(() => {
    router.addRoute({
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/Admin/index.vue'),
      meta: { hideLayout: true }
    })
  })

// 拦截导航：如果 admin 路由还没注册完，等一下再跳转
router.beforeEach((to, from, next) => {
  if (to.name === 'NotFound' && adminRouteReady) {
    adminRouteReady.then(() => {
      // 路由注册完了，重新匹配
      const matched = router.resolve(to.fullPath)
      if (matched.name !== 'NotFound') {
        next(matched.fullPath)
      } else {
        next()
      }
    })
  } else {
    next()
  }
})

export default router
