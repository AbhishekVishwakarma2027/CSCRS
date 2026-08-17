import { useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Lock, ShieldAlert } from 'lucide-react'

import { activateAccountSchema, type ActivateAccountFormValues } from '@/schemas/auth.schemas'
import { authService } from '@/features/auth/services/auth.service'
import { PATHS } from '@/routes/paths'

// Layout/branding components
import { AccessibilityBar, GovernmentHeader, Footer } from '@/components/landing'

// Custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ActivateAccountPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Token comes from the email link e.g., ?token=ABC123XYZ
  const tokenFromUrl = searchParams.get('token') || ''

  // Determine which role API to call based on the frontend route
  // e.g., "/admins/activate" -> rolePath = "admins"
  // API endpoints are: /api/v1/admins/activate, /api/v1/city-admins/activate, /api/v1/workers/activate
  const rolePath = location.pathname.split('/')[1] || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateAccountFormValues>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: '',
      confirm_password: '',
    },
  })

  const onSubmit = async (values: ActivateAccountFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await authService.activateAccount(rolePath, {
        token: values.token,
        password: values.password,
      })

      toast.success(response.message || 'Account activated successfully.')
      navigate(PATHS.LOGIN)
    } catch (error) {
      interface ValidationError {
        msg: string
      }
      const err = error as { response?: { data?: { detail?: string | ValidationError[] } } }
      let errorMessage =
        err.response?.data?.detail || 'Failed to activate account. The link may be expired.'

      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.map((e: ValidationError) => e.msg).join(', ')
      }

      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to activate account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
      {/* Accessibility Bar */}
      <AccessibilityBar />

      {/* Government Branding Header */}
      <GovernmentHeader />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex flex-grow flex-col items-center justify-center px-4 py-16 focus:outline-none"
      >
        {/* Card Component */}
        <Card className="w-full max-w-md border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4 text-center">
            <CardTitle className="text-xl font-extrabold tracking-tight text-[#0A3C7D]">
              Activate Your Account
            </CardTitle>
            <CardDescription className="mt-1 text-xs font-semibold text-neutral-500">
              Please securely set your new password to complete the activation of your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Hidden Token Input - or displayed if you want, but it's usually better hidden or read-only */}
              <div className="space-y-2">
                <Label htmlFor="token">Activation Token</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                  <Input
                    id="token"
                    type="text"
                    disabled={true}
                    className="bg-neutral-50 pl-9 font-mono text-sm tracking-wider text-neutral-500"
                    {...register('token')}
                  />
                </div>
                {errors.token && (
                  <p className="text-destructive mt-1 text-xs font-bold">{errors.token.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Set Password</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="pr-10 pl-9"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center rounded-sm pr-3 text-neutral-400 hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-[#0A3C7D] focus-visible:ring-offset-2 focus-visible:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive mt-1 text-xs font-bold">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="confirm_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="pr-10 pl-9"
                    aria-invalid={!!errors.confirm_password}
                    {...register('confirm_password')}
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-destructive mt-1 text-xs font-bold">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-[#0A3C7D] py-2 text-sm font-bold tracking-tight text-white shadow-sm transition-all hover:bg-[#0A3C7D]/95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <span>Activate Account</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Expanded Sitemap Footer */}
      <Footer />
    </div>
  )
}
