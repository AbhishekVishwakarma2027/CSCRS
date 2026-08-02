import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl font-medium">Page Not Found</p>
      <p className="text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <button
        onClick={() => navigate(PATHS.DASHBOARD)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-md px-4 py-2 text-sm"
      >
        Return to Dashboard
      </button>
    </div>
  )
}
