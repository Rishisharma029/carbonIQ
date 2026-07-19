import { useNavigate } from 'react-router'
import { useAuthStore } from '@/store/authStore'
import PageHeader from '@/shared/components/PageHeader'
import Button from '@/shared/components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card'
import { LogOut, Mail, ShieldAlert, Award } from 'lucide-react'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="User Profile"
        description="Verify your user account parameters, credentials details, and session status."
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Profile' }]}
      />

      <Card className="border border-border/60 shadow-xs">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border-2 border-primary/20 shadow-inner">
            {userInitials}
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              {user?.name || 'Demo User'}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email || 'user@carboniq.com'}</span>
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                Premium Track
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            leftIcon={<LogOut className="w-4 h-4 text-danger" />}
            onClick={handleSignOut}
            className="text-danger border-danger/20 hover:bg-danger/5 hover:border-danger/35 font-bold cursor-pointer w-full sm:w-auto"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <span>Account Credentials</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-normal">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground font-semibold">User ID</span>
              <span className="font-mono text-foreground font-semibold">
                {user?.id || 'usr_demo123'}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground font-semibold">Security Role</span>
              <span className="text-foreground font-semibold">Standard User</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">MFA Authentication</span>
              <span className="text-muted-foreground font-semibold">Disabled</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Award className="w-4 h-4 text-primary" />
              <span>Platform Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-normal">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground font-semibold">Calculation Logs</span>
              <span className="text-foreground font-semibold">4 Entries Logged</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground font-semibold">Active Offsets</span>
              <span className="text-foreground font-semibold">3 Actions Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Average Value</span>
              <span className="text-primary font-bold">8.4 tons / year</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
