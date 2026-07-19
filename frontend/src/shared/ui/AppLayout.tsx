import { useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router'
import {
  Home,
  LayoutDashboard,
  Calculator,
  History,
  BarChart3,
  Target,
  User,
  Settings,
  Info,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react'
import { useSidebarStore } from '@/store/sidebarStore'
import { useThemeStore } from '@/store/themeStore'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calculator', label: 'Calculator', icon: Calculator },
  { path: '/factors', label: 'Emission Factors', icon: Database },
  { path: '/history', label: 'History', icon: History },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
]

export default function Layout() {
  const location = useLocation()
  const { isOpen, isCollapsed, toggleOpen, toggleCollapsed, setOpen } = useSidebarStore()
  const { theme, setTheme, applyTheme } = useThemeStore()

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme()
  }, [theme, applyTheme])

  // Close mobile sidebar on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, setOpen])

  const activePageLabel = navItems.find((item) => item.path === location.pathname)?.label || 'CarbonIQ'

  return (
    <div className="min-h-screen flex bg-mesh-light dark:bg-mesh-dark text-foreground transition-colors duration-200">
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Drawer & Desktop Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card/90 backdrop-blur-md border-r border-border transition-all duration-300 lg:sticky
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'w-64'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
              C
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-xl tracking-tight text-primary whitespace-nowrap">
                CarbonIQ
              </span>
            )}
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Desktop Collapse Toggle Footer */}
        <div className="hidden lg:flex p-4 border-t border-border justify-center">
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-card/75 backdrop-blur-md border-b border-border/80">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={toggleOpen}
              className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight">{activePageLabel}</h2>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Selector UI */}
            <div className="flex items-center bg-muted rounded-full p-0.5 border border-border">
              {(['light', 'dark', 'system'] as const).map((t) => {
                const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor
                const isSelected = theme === t
                return (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-1.5 rounded-full transition-all duration-150 ${
                      isSelected
                        ? 'bg-card text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={`${t.charAt(0).toUpperCase() + t.slice(1)} theme`}
                    aria-label={`Switch to ${t} theme`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        {/* Dynamic Route Pages Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
