import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import PublicLayout from '@/shared/ui/PublicLayout'
import AppLayout from '@/shared/ui/AppLayout'
import AuthGuard from '@/shared/ui/AuthGuard'

// Lazy load feature components
const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const AboutPage = lazy(() => import('@/features/home/pages/AboutPage'))
const NotFoundPage = lazy(() => import('@/features/home/pages/NotFoundPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const CalculatorPage = lazy(() => import('@/features/calculator/pages/CalculatorPage'))
const HistoryPage = lazy(() => import('@/features/history/pages/HistoryPage'))
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'))
const GoalsPage = lazy(() => import('@/features/goals/pages/GoalsPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const SettingsPage = lazy(() => import('@/features/profile/pages/SettingsPage'))
const EmissionFactorsPage = lazy(() => import('@/features/home/pages/EmissionFactorsPage'))

// Actionable loader UI fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

export const router = createBrowserRouter([
  // Public marketing & auth routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AboutPage />
          </Suspense>
        ),
      },
      // Auth routes accessible to guests only
      {
        element: <AuthGuard guestOnly />,
        children: [
          {
            path: 'login',
            element: (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: 'register',
            element: (
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  // Protected/App routing
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'calculator',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CalculatorPage />
              </Suspense>
            ),
          },
          {
            path: 'factors',
            element: (
              <Suspense fallback={<PageLoader />}>
                <EmissionFactorsPage />
              </Suspense>
            ),
          },
          {
            path: 'history',
            element: (
              <Suspense fallback={<PageLoader />}>
                <HistoryPage />
              </Suspense>
            ),
          },
          {
            path: 'reports',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            ),
          },
          {
            path: 'goals',
            element: (
              <Suspense fallback={<PageLoader />}>
                <GoalsPage />
              </Suspense>
            ),
          },
          {
            path: 'profile',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            ),
          },
          {
            path: '*',
            element: (
              <Suspense fallback={<PageLoader />}>
                <NotFoundPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
])
