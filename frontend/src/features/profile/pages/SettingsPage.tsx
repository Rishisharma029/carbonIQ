import { useState } from 'react'
import PageHeader from '@/shared/components/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card'
import { Select } from '@/shared/components/Select'
import { useThemeStore } from '@/store/themeStore'
import { Moon, Sun, Monitor, CheckCircle, Database } from 'lucide-react'

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore()
  const [units, setUnits] = useState(() => {
    return localStorage.getItem('carboniq-units') || 'metric'
  })

  const handleUnitChange = (val: string) => {
    setUnits(val)
    localStorage.setItem('carboniq-units', val)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Settings"
        description="Configure your visual themes, units configuration, and data variables."
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Settings' }]}
      />

      <div className="space-y-6">
        {/* Visual appearance */}
        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sun className="w-4 h-4 text-primary" />
              <span>Theme Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Adjust the styling format to light, dark, or system configurations.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 'light', label: 'Light', icon: Sun },
                { val: 'dark', label: 'Dark', icon: Moon },
                { val: 'system', label: 'System', icon: Monitor },
              ].map((item) => {
                const Icon = item.icon
                const isSelected = theme === item.val
                return (
                  <button
                    key={item.val}
                    onClick={() => setTheme(item.val as any)}
                    className={`flex flex-col items-center gap-2 p-3 border rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer
                      ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border/60 bg-card hover:bg-muted/10 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Units system config */}
        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Emissions Calculations Units</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Set your preferred calculation values (metric tons/kilograms vs. imperial pounds).
            </p>
            <Select
              id="unitSystem"
              label="Unit System"
              value={units}
              onChange={(e) => handleUnitChange(e.target.value)}
            >
              <option value="metric">Metric (Tons / Kilograms CO2e)</option>
              <option value="imperial">Imperial (Pounds / Short Tons CO2e)</option>
            </Select>
          </CardContent>
        </Card>

        {/* Sources database reference */}
        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Database className="w-4 h-4 text-primary" />
              <span>Vetted Conversion Indices</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>All calculations math and coefficients are vetted against official datasets:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>US EPA (Environmental Protection Agency)</strong>: Passenger vehicle factors and
                transit indices.
              </li>
              <li>
                <strong>UK DEFRA (Department for Environment, Food & Rural Affairs)</strong>: Air travel
                emission coefficients and organic supply metrics.
              </li>
              <li>
                <strong>IPCC (Intergovernmental Panel on Climate Change)</strong>: Nutritional diets and
                household waste landfills decay coefficients.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
