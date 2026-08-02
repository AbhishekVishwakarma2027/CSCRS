import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth.schemas'
import { authService } from '@/features/auth/services/auth.service'
import { PATHS } from '@/routes/paths'

// Layout/branding components
import { AccessibilityBar, GovernmentHeader, Footer } from '@/components/landing'

// Custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await authService.forgotPassword(values.email)

      toast.success(
        response.message || 'If the email is registered, a password reset OTP has been sent.'
      )

      // Redirect to OTP verification page, passing email in query params
      navigate(`${PATHS.VERIFY_RESET_OTP}?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } }
      const errorMessage =
        err.response?.data?.detail || 'An error occurred while requesting password reset.'
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
        {/* Back Link to Login */}
        <div className="mb-6">
          <Link
            to={PATHS.LOGIN}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-500 uppercase transition-colors hover:text-[#0A3C7D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Login</span>
          </Link>
        </div>

        {/* Card Component */}
        <Card className="w-full max-w-md border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4 text-center">
            <CardTitle className="text-xl font-extrabold tracking-tight text-[#0A3C7D]">
              Recover Account
            </CardTitle>
            <CardDescription className="mt-1 text-xs font-semibold text-neutral-500">
              Enter your registered email address to receive a 6-digit verification code
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email Field */}
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
                    className="pl-9"
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive mt-1 text-xs font-bold">{errors.email.message}</p>
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
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Send Verification Code</span>
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
