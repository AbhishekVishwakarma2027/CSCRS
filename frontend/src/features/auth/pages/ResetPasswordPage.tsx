import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldAlert, ArrowLeft } from 'lucide-react'

import { resetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth.schemas'
import { authService } from '@/features/auth/services/auth.service'
import { PATHS } from '@/routes/paths'

// Layout/branding components
import { AccessibilityBar, GovernmentHeader, Footer } from '@/components/landing'

// Custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailFromUrl = searchParams.get('email') || ''

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromUrl,
      otp: '',
      new_password: '',
      confirm_password: '',
    },
  })

  // Sync email input if URL query param updates
  useEffect(() => {
    if (emailFromUrl) {
      setValue('email', emailFromUrl)
    }
  }, [emailFromUrl, setValue])

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await authService.resetPassword(
        values.email,
        values.otp,
        values.new_password
      )

      toast.success(response.message || 'Password reset successfully.')
      navigate(PATHS.LOGIN)
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } }
      const errorMessage =
        err.response?.data?.detail || 'Failed to reset password. Ensure verification is complete.'
      toast.error(errorMessage)
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
        {/* Back Link to OTP Verification */}
        <div className="mb-6">
          <Link
            to={`${PATHS.VERIFY_RESET_OTP}?email=${encodeURIComponent(emailFromUrl)}`}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-500 uppercase transition-colors hover:text-[#0A3C7D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Verify OTP Again</span>
          </Link>
        </div>

        {/* Card Component */}
        <Card className="w-full max-w-md border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4 text-center">
            <CardTitle className="text-xl font-extrabold tracking-tight text-[#0A3C7D]">
              Reset Account Password
            </CardTitle>
            <CardDescription className="mt-1 text-xs font-semibold text-neutral-500">
              Provide email, the verification OTP code, and enter your new security password
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@agency.gov"
                    disabled={isSubmitting}
                    className="bg-neutral-50 pl-9"
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive mt-1 text-xs font-bold">{errors.email.message}</p>
                )}
              </div>

              {/* Reset OTP (collected again from the user) */}
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code (OTP)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    disabled={isSubmitting}
                    className="pl-9 text-center font-mono text-lg tracking-widest"
                    aria-invalid={!!errors.otp}
                    {...register('otp')}
                  />
                </div>
                {errors.otp && (
                  <p className="text-destructive mt-1 text-xs font-bold">{errors.otp.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="new_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="pr-10 pl-9"
                    aria-invalid={!!errors.new_password}
                    {...register('new_password')}
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
                {errors.new_password && (
                  <p className="text-destructive mt-1 text-xs font-bold">
                    {errors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
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
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
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
