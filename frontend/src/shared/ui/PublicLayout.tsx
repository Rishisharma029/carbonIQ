import { useEffect } from 'react'
import { Outlet, Link, NavLink } from 'react-router'
import { Sun, Moon, Monitor, Leaf } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export default function PublicLayout() {
  const { theme, setTheme, applyTheme } = useThemeStore()

  useEffect(() => {
    applyTheme()
  }, [theme, applyTheme])

  return (
    <div className="min-h-screen flex flex-col bg-mesh-light dark:bg-mesh-dark text-foreground transition-colors duration-200">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 select-none group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-primary">CarbonIQ</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }
            >
              About
            </NavLink>
            <a
              href="/#features"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Features
            </a>
            <a href="/#faq" className="text-muted-foreground transition-colors hover:text-primary">
              FAQ
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="flex items-center bg-muted rounded-full p-0.5 border border-border">
              {(['light', 'dark', 'system'] as const).map((t) => {
                const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor
                const isSelected = theme === t
                return (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-card text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={`${t.charAt(0).toUpperCase() + t.slice(1)} theme`}
                    aria-label={`Switch to ${t} theme`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>

            <Link
              to="/login"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              to="/calculator"
              className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all select-none active:scale-95 shadow-xs"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Marketing Views */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
                <Leaf className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-md tracking-tight text-primary">CarbonIQ</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Providing production-quality environmental metrics and carbon tracking workflows. All calculations are sourced from accredited public database models.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/calculator" className="hover:text-primary transition-colors">
                  Calculator
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard Demo
                </Link>
              </li>
              <li>
                <a href="/#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground mb-3">Vetted Sources</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a
                  href="https://www.ipcc.ch/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  IPCC Guidelines
                </a>
              </li>
              <li>
                <a
                  href="https://www.epa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  US EPA Registry
                </a>
              </li>
              <li>
                <a
                  href="https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  UK DEFRA Database
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-border/40 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CarbonIQ. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:underline">
              About
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <span className="select-none">Source-Verified Emission Factors</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
