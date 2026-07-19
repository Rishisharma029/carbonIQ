import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import {
  Calculator,
  Target,
  BarChart3,
  Database,
  ArrowRight,
  ChevronDown,
  Globe,
  Flame,
  Milestone,
  CheckCircle2,
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip } from 'recharts'
import Button from '@/shared/components/Button'
import { Card, CardContent } from '@/shared/components/Card'
import Badge from '@/shared/components/Badge'

// Mock chart data for Dashboard Preview
const mockEmissionsHistory = [
  { month: 'Jan', co2e: 520 },
  { month: 'Feb', co2e: 490 },
  { month: 'Mar', co2e: 470 },
  { month: 'Apr', co2e: 410 },
  { month: 'May', co2e: 360 },
  { month: 'Jun', co2e: 310 },
]

export default function HomePage() {
  // Calculator Preview State
  const [carMiles, setCarMiles] = useState(120) // weekly car miles
  const [electricityKwh, setElectricityKwh] = useState(350) // monthly kWh
  const [meatMeals, setMeatMeals] = useState(7) // weekly meat meals

  // FAQ state: tracks open index
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null)

  // Calculations (Emission factors sourced from EPA & DEFRA)
  // Car: 0.404 kg CO2e per mile
  // Electricity: 0.380 kg CO2e per kWh
  // Meat meal: 2.100 kg CO2e per meal
  const annualEmissions = useMemo(() => {
    const carAnnual = carMiles * 52 * 0.404
    const elecAnnual = electricityKwh * 12 * 0.38
    const dietAnnual = meatMeals * 52 * 2.1
    return Math.round((carAnnual + elecAnnual + dietAnnual) / 100) / 10 // round to 1 decimal place, convert to metric tons
  }, [carMiles, electricityKwh, meatMeals])

  // Average US emission is around 16.0 tons, EU is 7.5 tons
  const comparisonPercentage = useMemo(() => {
    const avgUs = 16.0
    return Math.round((annualEmissions / avgUs) * 100)
  }, [annualEmissions])

  const faqs = [
    {
      q: 'Where do your carbon emission factors come from?',
      a: 'All our conversion factors are sourced directly from publicly accessible registries, including the US Environmental Protection Agency (EPA), the UK Department for Environment, Food & Rural Affairs (DEFRA), and the Intergovernmental Panel on Climate Change (IPCC). You can inspect the source registry link attached to every calculator step.',
    },
    {
      q: 'Is my input data saved securely?',
      a: 'Yes, your draft progress is stored locally in your browser session using state management libraries (Zustand). It is only uploaded to the servers once you register and submit a completed logging entry.',
    },
    {
      q: 'Can I track historical reductions and milestones?',
      a: 'Absolutely. CarbonIQ is built specifically for longitudinal tracking. You can visualize trends over months, isolate emission categories, and set realistic target reduction percentages mapped to goals.',
    },
    {
      q: 'Is the calculator mobile-responsive?',
      a: 'Yes, the entire layout, from calculator wizard steps to Recharts charts dashboards, is built using mobile-first Tailwind CSS v4 design rules and keyboard accessible controls.',
    },
  ]

  return (
    <div className="space-y-24 py-10 px-4 md:px-0">
      {/* 1. Hero Section */}
      <section className="max-w-5xl mx-auto text-center space-y-8 py-12">
        <Badge variant="primary" className="py-1 px-3 text-xs">
          Now Live: Track Vetted Emissions Workflows
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Track, Analyze, and Reduce Your{' '}
          <span className="text-primary bg-primary/5 px-2 py-1 rounded-lg">Carbon Footprint</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          A production-quality carbon accounting tracker utilizing sourced registries. Start logging your transportation, electricity, food, and waste footprint in minutes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="/calculator">
            <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Free Calculation
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Live Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Trusted Data Sources */}
      <section className="max-w-5xl mx-auto border-y border-border/40 py-8">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-6">
          Calculations Verified Against Vetted Registries
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center opacity-70">
          <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
            <Database className="w-4 h-4 text-primary" />
            <span>US EPA Registry</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
            <Globe className="w-4 h-4 text-primary" />
            <span>UK DEFRA</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
            <Flame className="w-4 h-4 text-primary" />
            <span>IPCC Guidelines</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
            <Milestone className="w-4 h-4 text-primary" />
            <span>EEA Database</span>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="max-w-6xl mx-auto space-y-12 scroll-mt-20">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Structured For Continuous Reduction</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Providing actionable workflows to help you measure, forecast, and reduce emissions over time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">1. Wizard Calculator</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Step-by-step calculation workflow targeting travel, home utilities, nutrition, and waste with instant validation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">2. Trend Analytics</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visualise monthly data changes with category breakdowns and forecast metrics to see your trajectory.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">3. Action Goals</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set milestones, receive automated mitigation recommendations, and log reductions against historical bounds.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. Calculator Preview Section */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <Badge variant="primary">Interactive Sandbox</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight">Estimate Your Impact Instantly</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tweak the sliders to see a live estimation of your annual footprint based on standard emissions indexes. This represents a preview of our step-by-step tracking calculator.
          </p>

          <div className="space-y-5">
            {/* Slider 1 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Weekly Car Travel</span>
                <span className="text-primary">{carMiles} miles</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                value={carMiles}
                onChange={(e) => setCarMiles(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Slider 2 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Monthly Home Electricity</span>
                <span className="text-primary">{electricityKwh} kWh</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={electricityKwh}
                onChange={(e) => setElectricityKwh(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Slider 3 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Weekly High-Carbon Meals</span>
                <span className="text-primary">{meatMeals} meals</span>
              </div>
              <input
                type="range"
                min="0"
                max="21"
                value={meatMeals}
                onChange={(e) => setMeatMeals(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Display calculation */}
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-8 flex flex-col justify-center items-center text-center space-y-6">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Estimated Footprint
            </p>
            <div className="space-y-1">
              <span className="text-5xl md:text-6xl font-black text-primary">{annualEmissions}</span>
              <span className="text-sm font-semibold text-muted-foreground block">
                Metric Tons CO2e / year
              </span>
            </div>
            <div className="w-full border-t border-border/40 pt-4 text-xs space-y-2 text-muted-foreground text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  Equivalent to <strong>{comparisonPercentage}%</strong> of the national average (16.0 tons).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Utilizing official EPA conversion factors.</span>
              </div>
            </div>
            <Link to="/calculator" className="w-full">
              <Button className="w-full">Run Full Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* 5. Dashboard Preview Section */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight">Longitudinal Analytics Demo</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Preview of your dashboard trend page. Track reductions monthly across customizable milestones.
          </p>
        </div>

        <Card className="p-6">
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockEmissionsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit=" kg" />
                <ChartTooltip
                  contentStyle={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    fontSize: '11px',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="co2e"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCo2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* 6. FAQ Accordion */}
      <section id="faq" className="max-w-3xl mx-auto space-y-8 scroll-mt-20">
        <h2 className="text-3xl font-bold tracking-tight text-center">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx
            return (
              <div key={idx} className="border border-border rounded-lg bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 font-semibold text-sm text-foreground text-left cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/20">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 7. CTA Footer Callout */}
      <section className="max-w-4xl mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Ready to log your first source-verified footprint?
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Start utilizing our emissions wizard now. Save drafts locally and manage target goals against real-world metrics.
        </p>
        <div className="flex justify-center">
          <Link to="/calculator">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
