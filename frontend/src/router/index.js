import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue')
    },
    {
      path: '/monthly',
      name: 'monthly',
      component: () => import('../views/MonthlyView.vue')
    },
    {
      path: '/daily',
      name: 'daily',
      component: () => import('../views/DailyView.vue')
    },
    {
      path: '/wallets',
      name: 'wallets',
      component: () => import('../views/WalletsView.vue')
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('../views/AnalyticsView.vue')
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: () => import('../views/AlertsView.vue')
    }
  ]
})

export default router
