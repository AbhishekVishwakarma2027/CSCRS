import { z } from 'zod'

/**
 * Login form schema.
 *
 * Backend note: POST /api/v1/auth/login uses OAuth2PasswordRequestForm
 * which expects `username` (not `email`) + `password` as form fields.
 * The field is named `username` in the form but accepts an email address.
 */
export const loginSchema = z.object({
  username: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

/**
 * Forgot password schema — POST /api/v1/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

/**
 * OTP verification schema — POST /api/v1/auth/verify-reset-otp
 */
export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
})

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>

/**
 * Reset password schema — POST /api/v1/auth/reset-password
 */
export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

/**
 * Change password schema — POST /api/v1/auth/change-password
 */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

/**
 * Account activation schema — POST /api/v1/workers/activate or /api/v1/admins/activate
 * Admin/worker sets their password using the token from the invitation email link.
 */
export const activateAccountSchema = z
  .object({
    token: z.string().min(1, 'Activation token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type ActivateAccountFormValues = z.infer<typeof activateAccountSchema>
