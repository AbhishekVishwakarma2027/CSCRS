import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Mail, ShieldAlert, ArrowLeft } from 'lucide-react'

import { verifyOtpSchema, type VerifyOtpFormValues } from '@/schemas/auth.schemas'
import { authService } from '@/features/auth/services/auth.service'
import { PATHS } from '@/routes/paths'

// Layout/branding components
import { AccessibilityBar, GovernmentHeader, Footer } from '@/components/landing'

// Custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function VerifyResetOtpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailFromUrl = searchParams.get('email') || ''

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: emailFromUrl,
      otp: '',
    },
  })

  // Keep email form input in sync if URL query parameter changes
  useEffect(() => {
    if (emailFromUrl) {
      setValue('email', emailFromUrl)
    }
  }, [emailFromUrl, setValue])

  const onSubmit = async (values: VerifyOtpFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await authService.verifyResetOtp(values.email, values.otp)

      toast.success(response.message || 'OTP verified successfully.')

      // Redirect to Reset Password screen passing email (sensitive OTP is NOT passed in URL)
      navigate(`${PATHS.RESET_PASSWORD}?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } }
      const errorMessage = err.response?.data?.detail || 'Invalid or expired OTP code.'
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
        {/* Back Link to Recover */}
        <div className="mb-6">
          <Link
            to={PATHS.FORGOT_PASSWORD}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-500 uppercase transition-colors hover:text-[#0A3C7D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Request New Code</span>
          </Link>
        </div>

        {/* Card Component */}
        <Card className="w-full max-w-md border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4 text-center">
            <CardTitle className="text-xl font-extrabold tracking-tight text-[#0A3C7D]">
              Verify Recovery Code
            </CardTitle>
            <CardDescription className="mt-1 text-xs font-semibold text-neutral-500">
              Enter the 6-digit numeric OTP sent to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email Address field */}
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

              {/* OTP Field */}
              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit Verification Code</Label>
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
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify Code</span>
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
