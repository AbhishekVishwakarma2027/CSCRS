import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'child_process'

function getGitCommitDate(): string {
  // 1. Check Vercel Git commit timestamp env var if present
  const vercelDateEnv =
    process.env.VERCEL_GIT_COMMIT_DATE || process.env.VERCEL_GIT_COMMIT_TIMESTAMP
  if (vercelDateEnv) {
    try {
      const date = new Date(vercelDateEnv)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      }
    } catch {
      // ignore parsing error and fallback to git CLI
    }
  }

  // 2. Try Git CLI for latest commit date
  try {
    const isoDateStr = execSync('git log -1 --format="%cI"', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

    if (isoDateStr) {
      const date = new Date(isoDateStr)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      }
    }
  } catch {
    // ignore git CLI failure (e.g. if build environment lacks .git folder)
  }

  // 3. Safe fallback date if git metadata is unavailable
  return 'September 18, 2026'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const lastUpdatedDate = getGitCommitDate()

  return {
    define: {
      'import.meta.env.VITE_LAST_UPDATED_DATE': JSON.stringify(lastUpdatedDate),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.VITE_API_BASE_URL) {
                proxyReq.setHeader('origin', env.VITE_API_BASE_URL)
              }
            })
          },
        },
        '/uploads': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
