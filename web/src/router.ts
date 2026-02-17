import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Edit',
    component: () => import('./pages/Edit/Index.vue')
  },
  { path: '/index', redirect: '/' },
  {
    path: '/doc/zh',
    component: () => import('./pages/Doc.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
