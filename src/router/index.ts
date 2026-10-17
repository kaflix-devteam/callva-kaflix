import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { site } from '@/data/site'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },
  { path: '/features', name: 'features', component: () => import('@/pages/FeaturesPage.vue'), meta: { title: '기능 소개' } },
  { path: '/use-cases', name: 'use-cases', component: () => import('@/pages/UseCasesPage.vue'), meta: { title: '활용 사례' } },
  { path: '/cases', redirect: '/use-cases' },
  { path: '/pricing', name: 'pricing', component: () => import('@/pages/PricingPage.vue'), meta: { title: '요금 안내' } },
  { path: '/compare', name: 'compare', component: () => import('@/pages/ComparePage.vue'), meta: { title: '솔루션 비교' } },
  { path: '/about', name: 'about', component: () => import('@/pages/AboutPage.vue'), meta: { title: '회사 소개' } },
  { path: '/faq', name: 'faq', component: () => import('@/pages/FaqPage.vue'), meta: { title: '자주 묻는 질문' } },
  { path: '/contact', name: 'contact', component: () => import('@/pages/ContactPage.vue'), meta: { title: '도입 문의' } },
  { path: '/consultation', name: 'consultation', component: () => import('@/pages/ConsultationPage.vue'), meta: { title: '무료 진단' } },
  { path: '/for/:slug', name: 'industry', component: () => import('@/pages/IndustryPage.vue'), props: true, meta: { title: '업종별 안내' } },
  { path: '/terms', name: 'terms', component: () => import('@/pages/TermsPage.vue'), meta: { title: '이용약관' } },
  { path: '/privacy', name: 'privacy', component: () => import('@/pages/PrivacyPage.vue'), meta: { title: '개인정보처리방침' } },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue'), meta: { title: '대시보드' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue'), meta: { title: '페이지를 찾을 수 없습니다' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | ${site.name}` : site.title
})

export default router
