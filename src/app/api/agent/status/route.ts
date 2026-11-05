import { isAiEnabled } from '@/lib/aiFeatures'

// Tells the client whether to show the agent UI. The CDN caches the answer, so
// the generator page stays static and does not run a function per visit. On
// Vercel, changing the flag needs a redeploy, which clears this cache.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(
    { enabled: isAiEnabled() },
    {
      headers: {
        // Browsers must re-check (max-age=0); only the CDN caches (s-maxage).
        'Cache-Control':
          'public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=60'
      }
    }
  )
}
