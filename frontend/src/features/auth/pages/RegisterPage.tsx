import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router'
import { registerSchema } from '../schemas/register.schema'
import { useRegisterMutation } from '../hooks/useAuth'
import { Input } from '@/shared/components/Input'
import Button from '@/shared/components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card'
import { ShieldCheck } from 'lucide-react'

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
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
            <ShieldCheck className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create an Account
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Register to set carbon limits and track emissions goals.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {registerMutation.isError && (
            <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-lg text-xs font-semibold">
              {registerMutation.error?.message || 'Registration failed. Please verify fields.'}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Full Name"
              type="text"
              error={errors.name?.message}
              {...register('name')}
            />

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

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              className="w-full cursor-pointer font-semibold"
              isLoading={registerMutation.isPending}
            >
              Sign Up
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline cursor-pointer">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
