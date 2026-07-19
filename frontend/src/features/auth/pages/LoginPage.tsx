import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router'
import { loginSchema } from '../schemas/login.schema'
import { useLoginMutation } from '../hooks/useAuth'
import { Input } from '@/shared/components/Input'
import Button from '@/shared/components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card'
import { Shield } from 'lucide-react'

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        navigate('/dashboard', { replace: true })
      },
    })
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card className="border border-border/60 shadow-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Sign In to CarbonIQ
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Access your personalized carbon footprint analysis dashboard.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {loginMutation.isError && (
            <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-lg text-xs font-semibold">
              {loginMutation.error?.message || 'Authentication failed. Please verify credentials.'}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              label="Email Address"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              className="w-full cursor-pointer font-semibold"
              isLoading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline cursor-pointer">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
