import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schemas'
import { authService } from '@/features/auth/services/auth.service'
import { apiClient, tokenStore } from '@/services/api'
import { PATHS } from '@/routes/paths'
import { UserRole } from '@/types/auth.types'

const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.CITY_ADMIN,
  UserRole.DEPARTMENT_ADMIN,
]

// Layout/branding components
import { AccessibilityBar, GovernmentHeader, Footer } from '@/components/landing'

// Custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      // 1. Authenticate with backend and obtain tokens
      const tokenData = await authService.login(values.username, values.password)

      // 2. Temporarily set token in tokenStore so subsequent apiClient calls attach authorization header
      tokenStore.setTokens(tokenData.access_token, tokenData.refresh_token)

      try {
        // 3. Fetch authenticated user profile details
        const { data: profileData } = await apiClient.get('/api/v1/auth/me')

        // 4. Verify user has an authorized administrative role
        if (!ADMIN_ROLES.includes(profileData.role)) {
          tokenStore.clearTokens()
          toast.error(
            'Access Denied: The administrative portal is restricted to Super Admin, City Admin, and Department Admin accounts.'
          )
          return
        }

        // 5. Update the global react auth context
        setAuth(tokenData.access_token, tokenData.refresh_token, profileData)

        toast.success(`Welcome back, ${profileData.name || 'User'}`)
        navigate(PATHS.DASHBOARD)
      } catch (profileError) {
        // Clear tokens if user profile fetch fails
        tokenStore.clearTokens()
        throw profileError
      }
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string | Array<{ msg?: string }> } } }
      const rawDetail = err.response?.data?.detail
      let errorMessage = 'Authentication failed. Please check your credentials.'
      if (typeof rawDetail === 'string') {
        errorMessage = rawDetail
      } else if (Array.isArray(rawDetail) && rawDetail.length > 0 && rawDetail[0]?.msg) {
        errorMessage = rawDetail[0].msg
      }
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
      {/* Top Accessibility Bar */}
      <AccessibilityBar />

      {/* Government Branding Header */}
      <GovernmentHeader />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex flex-grow flex-col items-center justify-center px-4 py-16 focus:outline-none"
      >
        {/* Simple Link to Return to top landing portal */}
        <div className="mb-6">
          <Link
            to={PATHS.ROOT}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-500 uppercase transition-colors hover:text-[#0A3C7D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Landing Portal</span>
          </Link>
        </div>

        {/* Card Component */}
        <Card className="w-full max-w-md border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4 text-center">
            <CardTitle className="text-xl font-extrabold tracking-tight text-[#0A3C7D]">
              Administrative Portal Login
            </CardTitle>
            <CardDescription className="mt-1 text-xs font-semibold text-neutral-500">
              Authorized municipal administrators & department workers only
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email / Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">Email Address</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    id="username"
                    type="email"
                    placeholder="name@agency.gov"
                    disabled={isSubmitting}
                    className="pl-9"
                    aria-invalid={!!errors.username}
                    {...register('username')}
                  />
                </div>
                {errors.username && (
                  <p className="text-destructive mt-1 flex items-center gap-1 text-xs font-bold">
                    <span>{errors.username.message}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Security Password</Label>
                  <Link
                    to={PATHS.FORGOT_PASSWORD}
                    className="text-xs font-bold text-[#0A3C7D] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
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
                  <p className="text-destructive mt-1 flex items-center gap-1 text-xs font-bold">
                    <span>{errors.password.message}</span>
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
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <span>Login</span>
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
