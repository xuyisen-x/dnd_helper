import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/main',
    },
    {
      path: '/main',
      name: 'main',
      redirect: '/main/character-sheet',
      component: () => import('../views/MainLayout.vue'),
      children: [
        {
          path: 'character-sheet',
          name: 'character-sheet',
          component: () => import('../views/MainLayout/CharacterSheetView.vue'),
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('../views/MainLayout/AboutView.vue'),
        },
      ],
    },
  ],
})

export default router
